#!/bin/bash

# RAF NET Deployment Script
# Jalankan dengan: sudo bash deploy.sh

set -e

echo "=========================================="
echo "RAF NET Deployment Script"
echo "=========================================="

# Variables
APP_DIR="/var/www/rafnet"
DOMAIN="raf.my.id"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Jalankan script ini dengan sudo"
    exit 1
fi

# Step 1: Update system
echo ""
echo "Step 1: Update sistem..."
apt update && apt upgrade -y
print_status "Sistem terupdate"

# Step 2: Install Node.js
echo ""
echo "Step 2: Install Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
print_status "Node.js $(node --version) terinstall"

# Step 3: Install Nginx
echo ""
echo "Step 3: Install Nginx..."
apt install -y nginx
systemctl enable nginx
print_status "Nginx terinstall"

# Step 4: Create app directory
echo ""
echo "Step 4: Setup direktori..."
mkdir -p $APP_DIR
print_status "Direktori $APP_DIR siap"

# Check if code exists
if [ ! -f "$APP_DIR/package.json" ]; then
    print_warning "Code belum ada di $APP_DIR"
    print_warning "Upload code Anda ke $APP_DIR terlebih dahulu"
    print_warning "Kemudian jalankan script ini lagi"
    exit 1
fi

# Step 5: Build Backend
echo ""
echo "Step 5: Build Backend..."
cd $APP_DIR/backend
npm install --production=false
npm run build
mkdir -p data
print_status "Backend built"

# Step 6: Build Frontend
echo ""
echo "Step 6: Build Frontend..."
cd $APP_DIR/frontend
npm install
npm run build
print_status "Frontend built"

# Step 7: Setup systemd service
echo ""
echo "Step 7: Setup systemd service..."
cp $APP_DIR/deploy/rafnet-backend.service /etc/systemd/system/

# Generate random JWT secret if not set
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/GANTI_DENGAN_SECRET_YANG_KUAT_DAN_RANDOM/$JWT_SECRET/" /etc/systemd/system/rafnet-backend.service

systemctl daemon-reload
systemctl enable rafnet-backend
print_status "Systemd service configured"

# Step 8: Setup Nginx
echo ""
echo "Step 8: Setup Nginx..."
cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/rafnet
sed -i "s/raf.my.id/$DOMAIN/g" /etc/nginx/sites-available/rafnet
ln -sf /etc/nginx/sites-available/rafnet /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
print_status "Nginx configured"

# Step 9: Set permissions
echo ""
echo "Step 9: Set permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
print_status "Permissions set"

# Step 10: Start services
echo ""
echo "Step 10: Start services..."
systemctl start rafnet-backend
systemctl restart nginx
print_status "Services started"

# Step 11: Setup firewall
echo ""
echo "Step 11: Setup firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable
print_status "Firewall configured"

# Final status
echo ""
echo "=========================================="
echo -e "${GREEN}Deployment selesai!${NC}"
echo "=========================================="
echo ""
echo "Status services:"
systemctl status rafnet-backend --no-pager -l | head -5
echo ""
systemctl status nginx --no-pager -l | head -5
echo ""
echo "Test endpoints:"
echo "  curl http://localhost:4500/health"
echo "  curl http://$DOMAIN/api/packages/active"
echo ""
echo "JWT Secret tersimpan di: /etc/systemd/system/rafnet-backend.service"
echo ""
print_warning "Jangan lupa seed admin user:"
echo "  cd $APP_DIR/backend"
echo "  export JWT_SECRET='$JWT_SECRET'"
echo "  export DB_PATH='$APP_DIR/backend/data/rafnet.db'"
echo "  npx ts-node src/scripts/seed-admin.ts admin password123"
echo ""
print_warning "Untuk SSL, jalankan:"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d $DOMAIN"
