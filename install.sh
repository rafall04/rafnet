#!/bin/bash

#===============================================================================
# RAF NET ISP Website - Installer Script
# Untuk Ubuntu 20.04 dengan Node.js v20 yang sudah terinstall
#
# Cara penggunaan:
#   chmod +x install.sh
#   sudo ./install.sh
#
# Script ini akan:
# 1. Install dependencies (nginx, build-essential)
# 2. Setup direktori aplikasi
# 3. Build backend dan frontend
# 4. Konfigurasi systemd service
# 5. Konfigurasi Nginx
# 6. Seed admin user
# 7. Start semua services
#===============================================================================

set -e

# ==================== KONFIGURASI ====================
# Ubah sesuai kebutuhan Anda

APP_NAME="rafnet"
APP_DIR="/var/www/rafnet"
DOMAIN="raf.my.id"                    # Ganti dengan domain Anda
ADMIN_USERNAME="admin"                 # Username admin
ADMIN_PASSWORD="Admin123!"             # Password admin (GANTI!)
BACKEND_PORT="4500"

# ==================== WARNA OUTPUT ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ==================== FUNGSI HELPER ====================
print_header() {
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}============================================${NC}"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[i]${NC} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# ==================== CEK PRASYARAT ====================
print_header "RAF NET Installer"

echo ""
echo "Konfigurasi:"
echo "  - Domain: $DOMAIN"
echo "  - App Directory: $APP_DIR"
echo "  - Backend Port: $BACKEND_PORT"
echo "  - Admin User: $ADMIN_USERNAME"
echo ""

# Cek root
if [ "$EUID" -ne 0 ]; then
    print_error "Script ini harus dijalankan sebagai root (sudo)"
    echo "Jalankan: sudo ./install.sh"
    exit 1
fi

# Cek Node.js
if ! check_command node; then
    print_error "Node.js tidak ditemukan!"
    echo "Install Node.js terlebih dahulu"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js terdeteksi: $NODE_VERSION"

# Cek npm
if ! check_command npm; then
    print_error "npm tidak ditemukan!"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm terdeteksi: $NPM_VERSION"

# Cek apakah script dijalankan dari direktori yang benar
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Script harus dijalankan dari root direktori project RAF NET"
    echo "Pastikan ada folder 'backend' dan 'frontend' di direktori ini"
    exit 1
fi

CURRENT_DIR=$(pwd)
print_success "Direktori source: $CURRENT_DIR"

echo ""
read -p "Lanjutkan instalasi? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Instalasi dibatalkan"
    exit 0
fi

# ==================== STEP 1: INSTALL DEPENDENCIES ====================
print_header "Step 1: Install System Dependencies"

print_step "Update package list..."
apt-get update -qq

print_step "Install build-essential..."
apt-get install -y -qq build-essential python3 > /dev/null 2>&1
print_success "build-essential terinstall"

print_step "Install Nginx..."
apt-get install -y -qq nginx > /dev/null 2>&1
print_success "Nginx terinstall"

# ==================== STEP 2: SETUP DIREKTORI ====================
print_header "Step 2: Setup Direktori Aplikasi"

print_step "Membuat direktori $APP_DIR..."
mkdir -p $APP_DIR

print_step "Menyalin source code..."
# Salin semua file kecuali node_modules
rsync -av --exclude='node_modules' --exclude='.git' --exclude='*.db' \
    "$CURRENT_DIR/" "$APP_DIR/" > /dev/null 2>&1
print_success "Source code tersalin ke $APP_DIR"

# ==================== STEP 3: BUILD BACKEND ====================
print_header "Step 3: Build Backend"

cd $APP_DIR/backend

print_step "Install backend dependencies..."
npm install --legacy-peer-deps 2>&1 | tail -3
print_success "Backend dependencies terinstall"

print_step "Build TypeScript..."
npm run build 2>&1 | tail -3
print_success "Backend built"

print_step "Setup database directory..."
mkdir -p $APP_DIR/backend/data
chmod 755 $APP_DIR/backend/data
print_success "Database directory siap"

# ==================== STEP 4: BUILD FRONTEND ====================
print_header "Step 4: Build Frontend"

cd $APP_DIR/frontend

print_step "Install frontend dependencies..."
npm install --legacy-peer-deps 2>&1 | tail -3
print_success "Frontend dependencies terinstall"

print_step "Build frontend untuk production..."
npm run build 2>&1 | tail -3
print_success "Frontend built"

# Verifikasi build
if [ ! -d "$APP_DIR/frontend/dist" ]; then
    print_error "Frontend build gagal - folder dist tidak ditemukan"
    exit 1
fi
print_success "Frontend dist folder terverifikasi"

# ==================== STEP 5: GENERATE JWT SECRET ====================
print_header "Step 5: Generate Security Keys"

JWT_SECRET=$(openssl rand -hex 32)
print_success "JWT Secret generated"

# ==================== STEP 6: SETUP SYSTEMD SERVICE ====================
print_header "Step 6: Setup Systemd Service"

print_step "Membuat service file..."

cat > /etc/systemd/system/rafnet-backend.service << EOF
[Unit]
Description=RAF NET Backend API
Documentation=https://github.com/rafall04/rafnet
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rafnet-backend

# Environment
Environment=NODE_ENV=production
Environment=PORT=$BACKEND_PORT
Environment=DB_PATH=$APP_DIR/backend/data/rafnet.db
Environment=JWT_SECRET=$JWT_SECRET

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

print_success "Service file dibuat: /etc/systemd/system/rafnet-backend.service"

print_step "Reload systemd daemon..."
systemctl daemon-reload
print_success "Systemd daemon reloaded"

print_step "Enable service untuk auto-start..."
systemctl enable rafnet-backend > /dev/null 2>&1
print_success "Service enabled"

# ==================== STEP 7: SETUP NGINX ====================
print_header "Step 7: Setup Nginx"

print_step "Membuat Nginx config..."

cat > /etc/nginx/sites-available/rafnet << EOF
# RAF NET Nginx Configuration
# Generated by installer script

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN _;

    # Frontend static files
    root $APP_DIR/frontend/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/rafnet-access.log;
    error_log /var/log/nginx/rafnet-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API Proxy ke Backend
    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # Frontend SPA - semua route ke index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
EOF

print_success "Nginx config dibuat"

print_step "Enable site..."
ln -sf /etc/nginx/sites-available/rafnet /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
print_success "Site enabled"

print_step "Test Nginx config..."
nginx -t
print_success "Nginx config valid"

# ==================== STEP 8: SET PERMISSIONS ====================
print_header "Step 8: Set Permissions"

print_step "Setting ownership ke www-data..."
chown -R www-data:www-data $APP_DIR
print_success "Ownership set"

print_step "Setting file permissions..."
find $APP_DIR -type d -exec chmod 755 {} \;
find $APP_DIR -type f -exec chmod 644 {} \;
chmod 755 $APP_DIR/backend/dist/index.js 2>/dev/null || true
print_success "Permissions set"

# ==================== STEP 9: START SERVICES ====================
print_header "Step 9: Start Services"

print_step "Starting backend service..."
systemctl start rafnet-backend
sleep 3

# Cek apakah backend running
if systemctl is-active --quiet rafnet-backend; then
    print_success "Backend service running"
else
    print_error "Backend service gagal start"
    echo "Cek log dengan: journalctl -u rafnet-backend -n 50"
    exit 1
fi

print_step "Restart Nginx..."
systemctl restart nginx
print_success "Nginx restarted"

# ==================== STEP 10: SEED ADMIN USER ====================
print_header "Step 10: Seed Admin User"

print_step "Membuat admin user..."
cd $APP_DIR/backend

# Export environment variables untuk seed script
export NODE_ENV=production
export PORT=$BACKEND_PORT
export DB_PATH=$APP_DIR/backend/data/rafnet.db
export JWT_SECRET=$JWT_SECRET
export ADMIN_USERNAME=$ADMIN_USERNAME
export ADMIN_PASSWORD=$ADMIN_PASSWORD

# Jalankan seed script
node -e "
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('$APP_DIR/backend/data/rafnet.db');

// Create admin table if not exists
db.exec(\`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
\`);

// Check if admin exists
const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get('$ADMIN_USERNAME');

if (existing) {
  console.log('Admin user sudah ada, skip...');
} else {
  const hash = bcrypt.hashSync('$ADMIN_PASSWORD', 10);
  db.prepare('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)').run('$ADMIN_USERNAME', hash, 'admin');
  console.log('Admin user berhasil dibuat');
}

db.close();
" 2>&1

print_success "Admin user ready"

# Fix database permissions after seed
chown www-data:www-data $APP_DIR/backend/data/rafnet.db
chmod 644 $APP_DIR/backend/data/rafnet.db

# ==================== STEP 11: VERIFIKASI ====================
print_header "Step 11: Verifikasi Instalasi"

print_step "Test backend health endpoint..."
sleep 2
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:$BACKEND_PORT/health 2>/dev/null || echo "failed")

if [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
    print_success "Backend health check: OK"
else
    print_warning "Backend health check gagal, cek log"
fi

print_step "Test API endpoint..."
API_RESPONSE=$(curl -s http://127.0.0.1:$BACKEND_PORT/api/packages/active 2>/dev/null || echo "failed")

if [[ "$API_RESPONSE" == "["* ]] || [[ "$API_RESPONSE" == "[]" ]]; then
    print_success "API endpoint: OK"
else
    print_warning "API endpoint tidak merespon dengan benar"
fi

print_step "Test Nginx..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ 2>/dev/null || echo "000")

if [[ "$NGINX_RESPONSE" == "200" ]]; then
    print_success "Nginx serving frontend: OK"
else
    print_warning "Nginx response code: $NGINX_RESPONSE"
fi

# ==================== SELESAI ====================
print_header "Instalasi Selesai!"

echo ""
echo -e "${GREEN}RAF NET berhasil diinstall!${NC}"
echo ""
echo "============================================"
echo "  INFORMASI PENTING"
echo "============================================"
echo ""
echo "📁 Direktori Aplikasi: $APP_DIR"
echo "🌐 Domain: $DOMAIN"
echo "🔌 Backend Port: $BACKEND_PORT"
echo ""
echo "👤 Admin Login:"
echo "   URL: http://$DOMAIN/admin/login"
echo "   Username: $ADMIN_USERNAME"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "🔐 JWT Secret tersimpan di:"
echo "   /etc/systemd/system/rafnet-backend.service"
echo ""
echo "============================================"
echo "  PERINTAH BERGUNA"
echo "============================================"
echo ""
echo "# Cek status services:"
echo "  systemctl status rafnet-backend"
echo "  systemctl status nginx"
echo ""
echo "# Lihat logs:"
echo "  journalctl -u rafnet-backend -f"
echo "  tail -f /var/log/nginx/rafnet-error.log"
echo ""
echo "# Restart services:"
echo "  systemctl restart rafnet-backend"
echo "  systemctl restart nginx"
echo ""
echo "# Test endpoints:"
echo "  curl http://localhost:$BACKEND_PORT/health"
echo "  curl http://localhost/api/packages/active"
echo ""
echo "============================================"
echo "  SETUP SSL (HTTPS)"
echo "============================================"
echo ""
echo "Untuk mengaktifkan HTTPS dengan Let's Encrypt:"
echo ""
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d $DOMAIN"
echo ""
echo "============================================"
echo ""
print_warning "PENTING: Ganti password admin setelah login pertama!"
echo ""
