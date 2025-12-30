#!/bin/bash

#===============================================================================
# RAF NET ISP Website - Installer Script v5.0
# Untuk Ubuntu 20.04 dengan Node.js v20
# 
# Fitur:
# - Backend + Frontend dalam 1 port (810)
# - Tidak perlu Nginx (cocok untuk server dengan aaPanel)
# - Express serve static files
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
APP_PORT="810"

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
print_header "RAF NET Installer v5.0"
echo "Port: $APP_PORT (Backend + Frontend)"

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
echo "Konfigurasi:"
echo "  Domain   : $DOMAIN"
echo "  Port     : $APP_PORT"
echo "  Admin    : $ADMIN_USERNAME / $ADMIN_PASSWORD"
echo ""
read -p "Lanjutkan? (y/n): " -n 1 -r
echo ""
[[ ! $REPLY =~ ^[Yy]$ ]] && exit 0

# ==================== STEP 1: DEPENDENCIES ====================
print_header "Step 1: Install Dependencies"

apt-get update -qq
apt-get install -y build-essential python3 rsync curl > /dev/null 2>&1
print_ok "System dependencies installed"

# ==================== STEP 2: COPY FILES ====================
print_header "Step 2: Setup Directory"

systemctl stop rafnet 2>/dev/null || true

mkdir -p $APP_DIR
rsync -a --delete --exclude='node_modules' --exclude='.git' --exclude='*.db' \
    "$CURRENT_DIR/" "$APP_DIR/"
print_ok "Files copied to $APP_DIR"

# ==================== STEP 3: BUILD FRONTEND ====================
print_header "Step 3: Build Frontend"

cd $APP_DIR/frontend

print_step "Cleaning old files..."
rm -rf node_modules package-lock.json

print_step "Installing dependencies..."
npm install 2>&1 | tail -3
print_ok "Dependencies installed"

print_step "Building frontend..."
npm run build 2>&1 | tail -5

if [ ! -d "$APP_DIR/frontend/dist" ]; then
    print_err "Frontend build failed!"
    exit 1
fi
print_ok "Frontend built: $APP_DIR/frontend/dist"

# ==================== STEP 4: BUILD BACKEND ====================
print_header "Step 4: Build Backend"

cd $APP_DIR/backend

print_step "Installing dependencies..."
npm install 2>&1 | tail -3
print_ok "Dependencies installed"

print_step "Building TypeScript..."
npm run build
print_ok "Backend built"

mkdir -p $APP_DIR/backend/data

# ==================== STEP 5: JWT SECRET ====================
print_header "Step 5: Generate JWT Secret"

JWT_SECRET=$(openssl rand -hex 32)
print_ok "JWT Secret generated"

# ==================== STEP 6: SYSTEMD SERVICE ====================
print_header "Step 6: Setup Systemd"

cat > /etc/systemd/system/rafnet.service << EOF
[Unit]
Description=RAF NET Website (Backend + Frontend)
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
Environment=PORT=$APP_PORT
Environment=DB_PATH=$APP_DIR/backend/data/rafnet.db
Environment=JWT_SECRET=$JWT_SECRET

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable rafnet > /dev/null 2>&1
print_ok "Systemd service configured"

# ==================== STEP 7: PERMISSIONS ====================
print_header "Step 7: Permissions"

chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
print_ok "Permissions set"

# ==================== STEP 8: SEED ADMIN ====================
print_header "Step 8: Create Admin"

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

# ==================== STEP 9: START SERVICE ====================
print_header "Step 9: Start Service"

systemctl start rafnet
sleep 3

if systemctl is-active --quiet rafnet; then
    print_ok "Service running on port $APP_PORT"
else
    print_err "Service failed to start"
    journalctl -u rafnet -n 20 --no-pager
    exit 1
fi

# ==================== STEP 10: VERIFY ====================
print_header "Step 10: Verify"

sleep 2

HEALTH=$(curl -s http://127.0.0.1:$APP_PORT/health 2>/dev/null || echo "error")
if [[ "$HEALTH" == *"ok"* ]]; then
    print_ok "Health check: OK"
else
    print_warn "Health check failed"
fi

HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$APP_PORT/ 2>/dev/null || echo "000")
if [[ "$HTTP" == "200" ]]; then
    print_ok "Frontend: OK"
else
    print_warn "Frontend response: $HTTP"
fi

API=$(curl -s http://127.0.0.1:$APP_PORT/api/packages/active 2>/dev/null || echo "error")
if [[ "$API" == "["* ]] || [[ "$API" == "[]" ]]; then
    print_ok "API: OK"
else
    print_warn "API check failed"
fi

# ==================== DONE ====================
print_header "INSTALLATION COMPLETE!"

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}RAF NET berhasil diinstall!${NC}"
echo ""
echo "============================================"
echo "  AKSES"
echo "============================================"
echo ""
echo "  Website  : http://$SERVER_IP:$APP_PORT"
echo "  Admin    : http://$SERVER_IP:$APP_PORT/admin/login"
echo ""
echo "  Username : $ADMIN_USERNAME"
echo "  Password : $ADMIN_PASSWORD"
echo ""
echo "============================================"
echo "  COMMANDS"
echo "============================================"
echo ""
echo "  Status   : systemctl status rafnet"
echo "  Logs     : journalctl -u rafnet -f"
echo "  Restart  : systemctl restart rafnet"
echo ""
echo "============================================"
echo "  SETUP DOMAIN (via aaPanel)"
echo "============================================"
echo ""
echo "  1. Login aaPanel"
echo "  2. Website > Add site > $DOMAIN"
echo "  3. Edit config, tambahkan:"
echo ""
echo "     location / {"
echo "         proxy_pass http://127.0.0.1:$APP_PORT;"
echo "         proxy_http_version 1.1;"
echo "         proxy_set_header Host \$host;"
echo "         proxy_set_header X-Real-IP \$remote_addr;"
echo "     }"
echo ""
echo "============================================"
echo ""
echo -e "${YELLOW}PENTING: Ganti password admin setelah login!${NC}"
echo ""
