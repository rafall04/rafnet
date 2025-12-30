# Panduan Deploy RAF NET di Ubuntu 20.04

## Arsitektur
```
Internet → Nginx (port 80/443) → Frontend Static Files
                              → Backend API (port 4500) via /api
```

Dengan setup ini:
- Frontend dan Backend diakses dari 1 URL yang sama (misal: raf.my.id)
- `/api/*` di-proxy ke backend (port 4500)
- Semua route lain serve frontend static files

---

## Step 1: Persiapan Server

### 1.1 Update sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Pastikan v18.x
npm --version
```

### 1.3 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 1.4 Install Git
```bash
sudo apt install -y git
```

---

## Step 2: Setup Direktori & Clone Project

### 2.1 Buat direktori
```bash
sudo mkdir -p /var/www/rafnet
sudo chown -R $USER:$USER /var/www/rafnet
```

### 2.2 Clone repository
```bash
cd /var/www/rafnet
git clone <URL_REPOSITORY_ANDA> .
# Atau upload file manual via SCP/SFTP
```

---

## Step 3: Build Backend

### 3.1 Install dependencies
```bash
cd /var/www/rafnet/backend
npm install
```

### 3.2 Build TypeScript
```bash
npm run build
```

### 3.3 Buat direktori data
```bash
mkdir -p /var/www/rafnet/backend/data
```

### 3.4 Seed admin user
```bash
# Set environment variables dulu
export JWT_SECRET="ganti_dengan_secret_yang_kuat_minimal_32_karakter"
export DB_PATH="/var/www/rafnet/backend/data/rafnet.db"

# Jalankan seed (ganti username dan password)
npx ts-node src/scripts/seed-admin.ts admin password123
```

---

## Step 4: Build Frontend

### 4.1 Install dependencies
```bash
cd /var/www/rafnet/frontend
npm install
```

### 4.2 Build untuk production
```bash
npm run build
```

Hasil build ada di `/var/www/rafnet/frontend/dist`

---

## Step 5: Setup Systemd Service untuk Backend

### 5.1 Copy service file
```bash
sudo cp /var/www/rafnet/deploy/rafnet-backend.service /etc/systemd/system/
```

### 5.2 Edit JWT_SECRET
```bash
sudo nano /etc/systemd/system/rafnet-backend.service
```
Ganti `GANTI_DENGAN_SECRET_YANG_KUAT_DAN_RANDOM` dengan secret yang kuat.

### 5.3 Set permissions
```bash
sudo chown -R www-data:www-data /var/www/rafnet
```

### 5.4 Enable dan start service
```bash
sudo systemctl daemon-reload
sudo systemctl enable rafnet-backend
sudo systemctl start rafnet-backend
```

### 5.5 Cek status
```bash
sudo systemctl status rafnet-backend
# Cek logs jika ada error
sudo journalctl -u rafnet-backend -f
```

### 5.6 Test backend
```bash
curl http://localhost:4500/health
# Harus return: {"status":"ok"}
```

---

## Step 6: Setup Nginx

### 6.1 Copy konfigurasi
```bash
sudo cp /var/www/rafnet/deploy/nginx.conf /etc/nginx/sites-available/rafnet
```

### 6.2 Edit domain (jika perlu)
```bash
sudo nano /etc/nginx/sites-available/rafnet
# Ganti raf.my.id dengan domain Anda
```

### 6.3 Enable site
```bash
sudo ln -s /etc/nginx/sites-available/rafnet /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Hapus default site
```

### 6.4 Test konfigurasi
```bash
sudo nginx -t
```

### 6.5 Restart Nginx
```bash
sudo systemctl restart nginx
```

---

## Step 7: Setup SSL dengan Let's Encrypt (Opsional tapi Recommended)

### 7.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Generate SSL certificate
```bash
sudo certbot --nginx -d raf.my.id -d www.raf.my.id
```

### 7.3 Auto-renewal (sudah otomatis, tapi bisa test)
```bash
sudo certbot renew --dry-run
```

---

## Step 8: Firewall (UFW)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

---

## Troubleshooting

### Cek backend logs
```bash
sudo journalctl -u rafnet-backend -f
```

### Cek nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart services
```bash
sudo systemctl restart rafnet-backend
sudo systemctl restart nginx
```

### Cek port yang digunakan
```bash
sudo netstat -tlnp | grep -E '4500|80|443'
```

### Permission issues
```bash
sudo chown -R www-data:www-data /var/www/rafnet
sudo chmod -R 755 /var/www/rafnet
```

---

## Update Deployment

Ketika ada update code:

```bash
cd /var/www/rafnet

# Pull latest code
git pull origin main

# Rebuild backend
cd backend
npm install
npm run build
sudo systemctl restart rafnet-backend

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Restart nginx (jika perlu)
sudo systemctl restart nginx
```

---

## Environment Variables

### Backend (.env atau systemd)
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4500 | Port backend |
| DB_PATH | ./data/rafnet.db | Path database SQLite |
| JWT_SECRET | (required) | Secret untuk JWT token |
| NODE_ENV | production | Environment |

### Frontend (build time)
| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | /api | URL API (relative untuk 1 domain) |

---

## Port Summary

| Service | Port | Access |
|---------|------|--------|
| Nginx | 80 | Public HTTP |
| Nginx | 443 | Public HTTPS |
| Backend | 4500 | Internal only (via Nginx proxy) |

---

## Quick Commands

```bash
# Status semua service
sudo systemctl status rafnet-backend nginx

# Restart semua
sudo systemctl restart rafnet-backend nginx

# View logs
sudo journalctl -u rafnet-backend --since "1 hour ago"

# Test API
curl http://localhost:4500/api/packages/active
curl https://raf.my.id/api/packages/active
```
