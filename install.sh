#!/bin/bash

#===============================================================================
# RAF NET ISP Website - Installer Script v4.0
# Untuk Ubuntu 20.04 dengan Node.js v20
#
# Cara penggunaan:
#   chmod +x install.sh
#   sudo ./install.sh
#===============================================================================

set -e

# ==================== KONFIGURASI ====================
APP_NAME="rafnet"
APP_DIR="/var/www/rafnet"
DOMAIN="rafnet.my.id"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Admin123!"
BACKEND_PORT="4500"

# ==================== WARNA ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}============================================${NC}"
}

print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
print_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
print_err() { echo -e "${RED}[ERROR]${NC} $1"; }

# ==================== CEK PRASYARAT ====================
print_header "RAF NET Installer v4.0"

if [ "$EUID" -ne 0 ]; then
    print_err "Jalankan dengan sudo: sudo ./install.sh"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_err "Node.js tidak ditemukan!"
    exit 1
fi
print_ok "Node.js: $(node --version)"
print_ok "npm: $(npm --version)"

if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_err "Jalankan dari root direktori project"
    exit 1
fi

CURRENT_DIR=$(pwd)
print_ok "Source: $CURRENT_DIR"

echo ""
echo "Domain: $DOMAIN"
echo "Admin: $ADMIN_USERNAME / $ADMIN_PASSWORD"
echo ""
read -p "Lanjutkan? (y/n): " -n 1 -r
echo ""
[[ ! $REPLY =~ ^[Yy]$ ]] && exit 0

# ==================== STEP 1: DEPENDENCIES ====================
print_header "Step 1: Install Dependencies"

apt-get update -qq
apt-get install -y build-essential python3 nginx rsync curl > /dev/null 2>&1
print_ok "System dependencies installed"

# ==================== STEP 2: COPY FILES ====================
print_header "Step 2: Setup Directory"

systemctl stop rafnet-backend 2>/dev/null || true

mkdir -p $APP_DIR
rsync -a --delete --exclude='node_modules' --exclude='.git' --exclude='*.db' \
    "$CURRENT_DIR/" "$APP_DIR/"
print_ok "Files copied to $APP_DIR"

# ==================== STEP 3: BUILD BACKEND ====================
print_header "Step 3: Build Backend"

cd $APP_DIR/backend

print_step "Installing dependencies..."
npm install 2>&1 | tail -3
print_ok "Dependencies installed"

print_step "Building TypeScript..."
npm run build
print_ok "Backend built"

mkdir -p $APP_DIR/backend/data

# ==================== STEP 4: BUILD FRONTEND ====================
print_header "Step 4: Build Frontend"

cd $APP_DIR/frontend

print_step "Cleaning old files..."
rm -rf node_modules package-lock.json

print_step "Installing dependencies (fresh)..."
npm install 2>&1 | tail -5
print_ok "Dependencies installed"

print_step "Building frontend..."
npm run build 2>&1 | tail -5

if [ ! -d "$APP_DIR/frontend/dist" ]; then
    print_err "Frontend build failed!"
    print_warn "Try manually: cd $APP_DIR/frontend && rm -rf node_modules && npm install && npm run build"
    exit 1
fi
print_ok "Frontend built"

# ==================== STEP 5: JWT SECRET ====================
print_header "Step 5: Generate JWT Secret"

JWT_SECRET=$(openssl rand -hex 32)
print_ok "JWT Secret generated"

# ==================== STEP 6: SYSTEMD SERVICE ====================
print_header "Step 6: Setup Systemd"

cat > /etc/systemd/system/rafnet-backend.service << EOF
[Unit]
Description=RAF NET Backend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$BACKEND_PORT
Environment=DB_PATH=$APP_DIR/backend/data/rafnet.db
Environment=JWT_SECRET=$JWT_SECRET

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable rafnet-backend > /dev/null 2>&1
print_ok "Systemd service configured"

# ==================== STEP 7: NGINX ====================
print_header "Step 7: Setup Nginx"

cat > /etc/nginx/sites-available/rafnet << 'NGINXCONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name rafnet.my.id www.rafnet.my.id _;

    root /var/www/rafnet/frontend/dist;
    index index.html;

    access_log /var/log/nginx/rafnet-access.log;
    error_log /var/log/nginx/rafnet-error.log;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api {
        proxy_pass http://127.0.0.1:4500;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:4500;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/rafnet /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
print_ok "Nginx configured"

# ==================== STEP 8: PERMISSIONS ====================
print_header "Step 8: Permissions"

chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
print_ok "Permissions set"

# ==================== STEP 9: START SERVICES ====================
print_header "Step 9: Start Services"

systemctl start rafnet-backend
sleep 3

if systemctl is-active --quiet rafnet-backend; then
    print_ok "Backend running"
else
    print_err "Backend failed to start"
    journalctl -u rafnet-backend -n 20 --no-pager
    exit 1
fi

systemctl restart nginx
print_ok "Nginx running"

# ==================== STEP 10: SEED ADMIN ====================
print_header "Step 10: Create Admin"

cd $APP_DIR/backend

cat > /tmp/seed.js << 'SEEDJS'
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const dbPath = process.env.DB_PATH;
const username = process.env.ADMIN_USER;
const password = process.env.ADMIN_PASS;

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    speed TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    duration TEXT NOT NULL,
    price INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
const hash = bcrypt.hashSync(password, 10);

if (existing) {
  db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(hash, username);
  console.log('Admin password updated');
} else {
  db.prepare('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, 'admin');
  console.log('Admin created');
}

db.close();
SEEDJS

DB_PATH="$APP_DIR/backend/data/rafnet.db" \
ADMIN_USER="$ADMIN_USERNAME" \
ADMIN_PASS="$ADMIN_PASSWORD" \
node /tmp/seed.js

rm /tmp/seed.js
chown www-data:www-data $APP_DIR/backend/data/rafnet.db
chmod 644 $APP_DIR/backend/data/rafnet.db

print_ok "Admin user ready"

systemctl restart rafnet-backend
sleep 2

# ==================== STEP 11: VERIFY ====================
print_header "Step 11: Verify"

HEALTH=$(curl -s http://127.0.0.1:$BACKEND_PORT/health 2>/dev/null || echo "error")
[[ "$HEALTH" == *"ok"* ]] && print_ok "Backend health: OK" || print_warn "Backend health failed"

HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ 2>/dev/null || echo "000")
[[ "$HTTP" == "200" ]] && print_ok "Nginx: OK" || print_warn "Nginx: $HTTP"

# ==================== DONE ====================
print_header "INSTALLATION COMPLETE!"

echo ""
echo -e "${GREEN}RAF NET berhasil diinstall!${NC}"
echo ""
echo "Website  : http://rafnet.my.id"
echo "Admin    : http://rafnet.my.id/admin/login"
echo "Username : $ADMIN_USERNAME"
echo "Password : $ADMIN_PASSWORD"
echo ""
echo "SSL Setup:"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d rafnet.my.id"
echo ""
echo "Commands:"
echo "  systemctl status rafnet-backend"
echo "  journalctl -u rafnet-backend -f"
echo ""
echo -e "${YELLOW}PENTING: Ganti password admin setelah login!${NC}"
echo ""
