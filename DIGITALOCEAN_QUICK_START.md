# 🚀 DIGITALOCEAN DEPLOYMENT - QUICK CHECKLIST

## ⏱️ Total Time: ~2 hours

---

## 📋 STEP 1: GitHub Setup (5 minutes)

### Create 2 GitHub Repositories:
- [ ] Go to https://github.com/new
- [ ] Create: `halal-cms-backend` (Public or Private)
- [ ] Create: `halal-cms-frontend` (Public or Private)

### Push Backend Code:
```bash
cd D:\QHXSASS\halal-cms-backend
git init
git add .
git commit -m "Initial commit: Backend ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/halal-cms-backend.git
git push -u origin main
```

### Push Frontend Code:
```bash
cd D:\QHXSASS\halal-cms-frontend
git init
git add .
git commit -m "Initial commit: Frontend ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/halal-cms-frontend.git
git push -u origin main
```

**Verification:**
- [ ] Backend repo shows all files at https://github.com/YOUR_USERNAME/halal-cms-backend
- [ ] Frontend repo shows all files at https://github.com/YOUR_USERNAME/halal-cms-frontend

---

## 💻 STEP 2: Create DigitalOcean Droplet (10 minutes)

### Create Droplet:
- [ ] Go to https://www.digitalocean.com
- [ ] Click "Create" → "Droplet"
- [ ] Choose: Ubuntu 22.04 LTS
- [ ] Size: 4GB RAM / 2 vCPU (recommended minimum)
- [ ] Region: Pick closest to you
- [ ] Authentication: SSH key (or password)
- [ ] Click "Create Droplet"
- [ ] Wait for droplet to start (~2 min)
- [ ] Note down: **YOUR_DROPLET_IP**

---

## 🔧 STEP 3: SSH into Droplet (1 minute)

```bash
ssh root@YOUR_DROPLET_IP
```

**If using Windows without SSH:**
- Download PuTTY or use Windows Terminal
- Or use DigitalOcean Console in web browser

---

## 📦 STEP 4: Install Dependencies (10 minutes)

**Copy & paste this entire block:**

```bash
#!/bin/bash
set -e

echo "Updating system..."
apt-get update && apt-get upgrade -y

echo "Installing Java 17..."
apt-get install -y openjdk-17-jdk-headless

echo "Installing Maven..."
apt-get install -y maven

echo "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

echo "Installing Nginx..."
apt-get install -y nginx

echo "Installing Git..."
apt-get install -y git

echo "Installing Certbot for SSL..."
apt-get install -y certbot python3-certbot-nginx

echo "✅ All dependencies installed!"
java -version
mvn -version
psql --version
node -v
```

**Verification:**
- [ ] All commands complete without errors
- [ ] Each version check shows the tool is installed

---

## 🗄️ STEP 5: Setup PostgreSQL Database (5 minutes)

```bash
# Switch to postgres user
sudo -u postgres psql

# Run these SQL commands:
CREATE DATABASE halalcms_inspections;
CREATE USER halalcms WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE halalcms_inspections TO halalcms;
\q

# Test connection:
psql -U halalcms -d halalcms_inspections -c "SELECT version();"
```

**Verification:**
- [ ] Database created
- [ ] User created
- [ ] Connection test shows PostgreSQL version

---

## 🔑 STEP 6: Setup Environment & Secrets (5 minutes)

```bash
# Create .env file
cat > /opt/halalcms/.env << 'EOF'
# Database
DB_URL=jdbc:postgresql://localhost:5432/halalcms_inspections
DB_USER=halalcms
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# SMTP (Gmail)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your-256-bit-secret-here

# Application
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8084
LOGGING_LEVEL_ROOT=INFO
EOF

# Secure permissions
chmod 600 /opt/halalcms/.env
mkdir -p /opt/halalcms
```

**Before running: Get these values:**
- [ ] **Gmail App Password**: https://myaccount.google.com/apppasswords
  - Enable 2FA first
  - Generate App Password
  - Copy 16-character password
- [ ] **Database Password**: Use your chosen secure password
- [ ] **JWT Secret**: Run `openssl rand -hex 32` to generate

---

## 📥 STEP 7: Clone & Build Backend (15 minutes)

```bash
cd /opt/halalcms
git clone https://github.com/YOUR_USERNAME/halal-cms-backend.git
cd halal-cms-backend

# Build (this takes ~5-10 minutes)
mvn clean install -DskipTests

# Verify JAR created
ls -lh inspection-service/target/inspection-service-1.0.0-SNAPSHOT.jar
```

**Verification:**
- [ ] Build completes with "BUILD SUCCESS"
- [ ] JAR file exists in inspection-service/target/

---

## 🌐 STEP 8: Create Backend SystemD Service (5 minutes)

```bash
sudo tee /etc/systemd/system/halalcms-inspection.service > /dev/null <<'EOF'
[Unit]
Description=HalalCMS Inspection Service
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/halalcms/halal-cms-backend
EnvironmentFile=/opt/halalcms/.env

ExecStart=java -jar inspection-service/target/inspection-service-1.0.0-SNAPSHOT.jar \
  --spring.datasource.url=${DB_URL} \
  --spring.datasource.username=${DB_USER} \
  --spring.datasource.password=${DB_PASSWORD} \
  --spring.mail.host=${MAIL_HOST} \
  --spring.mail.port=${MAIL_PORT} \
  --spring.mail.username=${MAIL_USERNAME} \
  --spring.mail.password=${MAIL_PASSWORD} \
  --jwt.secret=${JWT_SECRET}

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable halalcms-inspection.service
sudo systemctl start halalcms-inspection.service

# Check status
sudo systemctl status halalcms-inspection.service
```

**Verification:**
- [ ] Service status shows "running"
- [ ] Check logs: `sudo journalctl -u halalcms-inspection -f` (should see startup messages)
- [ ] Press Ctrl+C to exit logs

---

## ⏰ Wait for Migrations (1-2 minutes)

After service starts, Flyway will automatically:
1. Detect migrations needed
2. Run V1-V9 in order
3. Create all database tables

**Check migrations applied:**
```bash
psql -U halalcms -d halalcms_inspections -c "SELECT version, description FROM flyway_schema_history ORDER BY version;"
```

**Verification:**
- [ ] Shows V1 through V9
- [ ] All marked as success

---

## 📱 STEP 9: Deploy Frontend (10 minutes)

```bash
cd /opt/halalcms
git clone https://github.com/YOUR_USERNAME/halal-cms-frontend.git
cd halal-cms-frontend

# Install dependencies
npm install

# Build production
npm run build

# Copy to Nginx
sudo mkdir -p /var/www/halal-cms-frontend
sudo cp -r dist/* /var/www/halal-cms-frontend/
```

**Verification:**
- [ ] npm install completes
- [ ] npm run build completes with "✓ built"
- [ ] dist/ folder contains index.html

---

## 🔗 STEP 10: Configure Nginx (5 minutes)

```bash
sudo tee /etc/nginx/sites-available/default > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;

    root /var/www/halal-cms-frontend;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:8084;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and reload
sudo nginx -t
sudo systemctl restart nginx
```

**Verification:**
- [ ] Nginx test passes ("successful")
- [ ] Nginx reloads without errors

---

## 🔒 STEP 11: Setup SSL Certificate (5 minutes)

```bash
# If you have a domain:
sudo certbot certonly --nginx -d your-domain.com

# Or for testing (self-signed):
sudo certbot certonly --standalone -d your-domain.com
```

**Verification:**
- [ ] Certificate created at `/etc/letsencrypt/live/your-domain.com/`

---

## ✅ STEP 12: Final Verification (5 minutes)

```bash
# Test backend is running
curl http://localhost:8084/api/nc/application/1

# Check database
psql -U halalcms -d halalcms_inspections -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public';"

# Check nginx
curl http://localhost

# Check service status
sudo systemctl status halalcms-inspection.service
sudo systemctl status nginx.service
sudo systemctl status postgresql.service
```

**Verification Checklist:**
- [ ] Backend responds (shows API response)
- [ ] Database shows 14+ tables
- [ ] Frontend loads (shows HTML)
- [ ] All services show "running"

---

## 🔥 STEP 13: Enable Firewall (5 minutes)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny everything else
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Check status
sudo ufw status
```

**Verification:**
- [ ] Firewall enabled
- [ ] Only ports 22, 80, 443 allowed

---

## 🎉 DEPLOYMENT COMPLETE!

### Your System is Now Live at:
- **Frontend**: http://YOUR_DROPLET_IP
- **Backend API**: http://YOUR_DROPLET_IP/api
- **Database**: PostgreSQL on localhost:5432

### Next Steps:
1. Point your domain to droplet IP
2. Setup SSL for domain
3. Test workflow end-to-end
4. Setup backups
5. Monitor logs

---

## 🆘 QUICK TROUBLESHOOTING

### Backend won't start
```bash
sudo journalctl -u halalcms-inspection -f
# Look for error message
```

### Database connection failed
```bash
psql -U halalcms -d halalcms_inspections -c "SELECT 1;"
# Should return: 1
```

### Frontend shows 404
```bash
sudo systemctl status nginx.service
sudo nginx -t
```

### Can't SSH into droplet
```bash
# Use DigitalOcean Console in web browser instead
# Or check SSH key permissions
```

---

## 📊 DEPLOYMENT SUMMARY

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | GitHub Setup | 5 min | TBD |
| 2 | Create Droplet | 10 min | TBD |
| 3 | SSH Access | 1 min | TBD |
| 4 | Install Deps | 10 min | TBD |
| 5 | Setup DB | 5 min | TBD |
| 6 | Environment | 5 min | TBD |
| 7 | Build Backend | 15 min | TBD |
| 8 | SystemD Service | 5 min | TBD |
| 9 | Deploy Frontend | 10 min | TBD |
| 10 | Configure Nginx | 5 min | TBD |
| 11 | Setup SSL | 5 min | TBD |
| 12 | Verify | 5 min | TBD |
| 13 | Firewall | 5 min | TBD |
| **TOTAL** | | **~2 hours** | **⏳** |

---

## 💡 IMPORTANT REMINDERS

1. ⚠️ **Change ALL default passwords**
   - Database: Use strong password
   - JWT Secret: Generate new one
   - Gmail: Use App Password (not main password)

2. 🔐 **Security**
   - Don't commit .env to GitHub
   - Use SSH keys for authentication
   - Enable firewall

3. 📧 **Email Setup**
   - Gmail requires App Password (not main password)
   - Enable 2FA first: https://myaccount.google.com
   - App Password: https://myaccount.google.com/apppasswords

4. 🔄 **After Deployment**
   - Test email sending
   - Check database migrations
   - Monitor service logs
   - Setup backups

---

**YOU ARE READY TO DEPLOY! 🚀**

Follow steps 1-13 in order, don''t skip any. The entire process takes about 2 hours.

Need help with any step? The BUILD_AND_DEPLOY.md has more details on each section.
