# Panduan Deployment RAF NET Website - Ubuntu 20.04

## Arsitektur Deployment

```
Internet → Nginx (Port 80/443) → Frontend (Static Files)
                               → Backend API (/api → localhost:4500)
```

Dengan setup ini:
- Frontend dan Backend diakses dari 1 domain/URL
- Nginx serve static files untuk frontend
- Nginx proxy `/api/*` requests ke backend
- Backend berjalan di port 4500 (internal only)

---

## Step 1: Persiapan Server

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Dependencies
```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version

# Install build essentials (untuk native modules seperti better-sqlite3)
sudo apt install -y build-essential python3

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager untuk Node.js)
sudo npm install -g pm2
```

---

## Step 2: Setup Aplikasi

### 2.1 Clone/Upload Project
```bash
# Buat direktori aplikasi
sudo mkdir -p /var/www/rafnet
sudo chown $USER:$USER /var/www/rafnet

# Clone dari git (atau upload manual)
cd /var/www/rafnet
git clone <your-repo-url> .

# Atau upload via SCP dari local machine:
# scp -r ./raf-net-isp-website/* user@server:/var/www/rafnet/
```

### 2.2 Install Dependencies
```bash
cd /var/www/rafnet

# Install semua dependencies
npm run install:all

# Atau manual:
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2.3 Build Backend
```bash
cd /var/www/rafnet/backend
npm run build
```

### 2.4 Build Frontend
```bash
cd /var/www/rafnet/frontend
npm run build
```

### 2.5 Setup Database & Admin User
```bash
cd /var/www/rafnet/backend

# Seed admin user (ganti password sesuai keinginan)
ADMIN_USERNAME=admin ADMIN_PASSWORD=YourSecurePassword123! npm run seed:admin
```

---

## Step 3: Konfigurasi Environment

### 3.1 Buat file .env untuk Backend
```bash
cat > /var/www/rafnet/backend/.env << 'EOF'
PORT=4500
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=/var/www/rafnet/backend/data/rafnet.db
EOF
```

**PENTING:** Ganti `JWT_SECRET` dengan string random yang panjang dan aman!

Generate random secret:
```bash
openssl rand -base64 64
```

### 3.2 Update Backend untuk membaca .env
```bash
# Install dotenv jika belum
cd /var/www/rafnet/backend
npm install dotenv
```

---

## Step 4: Setup PM2 (Process Manager)

### 4.1 Buat PM2 Ecosystem File
```bash
cat > /var/www/rafnet/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'rafnet-backend',
      cwd: '/var/www/rafnet/backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4500
      },
      error_file: '/var/log/pm2/rafnet-backend-error.log',
      out_file: '/var/log/pm2/rafnet-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF
```

### 4.2 Buat Log Directory
```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### 4.3 Start Backend dengan PM2
```bash
cd /var/www/rafnet
pm2 start ecosystem.config.js

# Verify running
pm2 status
pm2 logs rafnet-backend

# Setup PM2 startup (auto-start on reboot)
pm2 startup
# Jalankan command yang diberikan oleh pm2 startup

pm2 save
```

---

## Step 5: Konfigurasi Nginx

### 5.1 Buat Nginx Config
```bash
sudo nano /etc/nginx/sites-available/rafnet
```

Isi dengan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    # Ganti your-domain.com dengan domain Anda
    # Atau gunakan IP server jika belum ada domain

    # Frontend - Static Files
    root /var/www/rafnet/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API Proxy - Backend
    location /api {
        proxy_pass http://127.0.0.1:4500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://127.0.0.1:4500;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend Routes - SPA Support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 5.2 Enable Site & Test Config
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/rafnet /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 6: Setup SSL dengan Let's Encrypt (Opsional tapi Recommended)

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Generate SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Ikuti instruksi yang muncul. Certbot akan otomatis update config Nginx.

### 6.3 Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot sudah setup auto-renewal via systemd timer
sudo systemctl status certbot.timer
```

---

## Step 7: Firewall Setup

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (PENTING! Jangan sampai terkunci)
sudo ufw allow ssh

# Allow HTTP & HTTPS
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

---

## Step 8: Verifikasi Deployment

### 8.1 Check Services
```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check Backend Health
curl http://localhost:4500/health
```

### 8.2 Test dari Browser
- Buka `http://your-domain.com` - Harus tampil landing page
- Buka `http://your-domain.com/admin/login` - Harus tampil login page
- Login dengan credentials admin yang sudah di-seed

---

## Troubleshooting

### Backend tidak jalan
```bash
# Check logs
pm2 logs rafnet-backend

# Restart
pm2 restart rafnet-backend

# Check port
sudo netstat -tlnp | grep 4500
```

### Nginx Error
```bash
# Check error log
sudo tail -f /var/log/nginx/error.log

# Check access log
sudo tail -f /var/log/nginx/access.log

# Test config
sudo nginx -t
```

### Database Issues
```bash
# Check database file exists
ls -la /var/www/rafnet/backend/data/

# Check permissions
sudo chown -R $USER:$USER /var/www/rafnet/backend/data/
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/rafnet

# Fix permissions
chmod -R 755 /var/www/rafnet
```

---

## Maintenance Commands

### Update Aplikasi
```bash
cd /var/www/rafnet

# Pull latest code
git pull

# Install dependencies
npm run install:all

# Rebuild
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# Restart backend
pm2 restart rafnet-backend

# Reload nginx (jika ada perubahan config)
sudo systemctl reload nginx
```

### Backup Database
```bash
# Backup
cp /var/www/rafnet/backend/data/rafnet.db /backup/rafnet-$(date +%Y%m%d).db

# Atau dengan cron job
# crontab -e
# 0 2 * * * cp /var/www/rafnet/backend/data/rafnet.db /backup/rafnet-$(date +\%Y\%m\%d).db
```

### View Logs
```bash
# Backend logs
pm2 logs rafnet-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Port Summary

| Service | Port | Access |
|---------|------|--------|
| Nginx | 80/443 | Public |
| Backend | 4500 | Internal only (via Nginx proxy) |
| Frontend | - | Static files served by Nginx |

---

## Security Checklist

- [ ] Ganti JWT_SECRET dengan value yang aman
- [ ] Ganti password admin default
- [ ] Enable SSL/HTTPS
- [ ] Setup firewall (UFW)
- [ ] Disable root SSH login
- [ ] Setup fail2ban (optional)
- [ ] Regular backup database
- [ ] Keep system updated

