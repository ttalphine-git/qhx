# HalalCMS Backend Build & Deployment Guide

## ✅ Current Status

- **Frontend**: Built & compiled successfully ✅
- **Backend**: Code complete, ready for Maven build
- **Database**: Migrations ready (V7, V8, V9)

## 🔧 Local Build Setup (Optional - Only if testing locally)

### Prerequisites
- Java 17+ (Installed ✅)
- Maven 3.9.6+ (Needs installation)

### Install Maven Locally

#### Windows:
1. Download from: https://maven.apache.org/download.cgi
2. Extract to: `C:\Program Files\apache-maven-3.9.6`
3. Add to PATH: `C:\Program Files\apache-maven-3.9.6\bin`
4. Verify: `mvn -version`

#### Building Backend Locally:
```bash
cd halal-cms-backend
mvn clean install
# This will:
# - Compile all modules
# - Run tests
# - Package JAR files
# - Install to local Maven repository
```

Expected output:
```
[INFO] BUILD SUCCESS
[INFO] Total time: XX.XXX s
[INFO] Finished at: 2026-09-23T...
```

## 🚀 Production Deployment (DigitalOcean)

### Step 1: Provision DigitalOcean Droplet

```bash
# Create droplet with:
# - OS: Ubuntu 22.04 LTS
# - RAM: 4GB minimum
# - CPU: 2vCPU
# - Storage: 80GB SSD
```

### Step 2: Install Dependencies

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt-get update && apt-get upgrade -y

# Install Java 17
apt-get install -y openjdk-17-jdk-headless

# Install Maven
apt-get install -y maven

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Install Node.js (for frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verify installations
java -version
mvn -version
psql --version
node -v
```

### Step 3: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE halalcms_inspections;
CREATE USER halalcms WITH PASSWORD 'halalcms';
GRANT ALL PRIVILEGES ON DATABASE halalcms_inspections TO halalcms;
\q

# Verify connection
psql -U halalcms -d halalcms_inspections -c "SELECT version();"
```

### Step 4: Clone & Build Backend

```bash
# Create app directory
mkdir -p /opt/halalcms
cd /opt/halalcms

# Clone backend repository (when ready)
git clone https://github.com/YOUR_USERNAME/halal-cms-backend.git
cd halal-cms-backend

# Build with Maven
mvn clean install -DskipTests

# Verify JAR was created
ls -la inspection-service/target/inspection-service-1.0.0-SNAPSHOT.jar
```

### Step 5: Configure Environment Variables

Create `.env` file:
```bash
cat > /opt/halalcms/.env << 'EOF'
# Database
DB_URL=jdbc:postgresql://localhost:5432/halalcms_inspections
DB_USER=halalcms
DB_PASSWORD=halalcms

# SMTP Email
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password

# Application
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
EOF

chmod 600 /opt/halalcms/.env
```

### Step 6: Create SystemD Service

```bash
sudo tee /etc/systemd/system/halalcms-inspection.service > /dev/null <<EOF
[Unit]
Description=HalalCMS Inspection Service
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/halalcms/halal-cms-backend
EnvironmentFile=/opt/halalcms/.env

ExecStart=java -jar inspection-service/target/inspection-service-1.0.0-SNAPSHOT.jar \
  --spring.datasource.url=\${DB_URL} \
  --spring.datasource.username=\${DB_USER} \
  --spring.datasource.password=\${DB_PASSWORD} \
  --spring.mail.username=\${MAIL_USERNAME} \
  --spring.mail.password=\${MAIL_PASSWORD}

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable halalcms-inspection.service
sudo systemctl start halalcms-inspection.service

# Check status
sudo systemctl status halalcms-inspection.service
```

### Step 7: Deploy Frontend

```bash
cd /opt/halalcms
git clone https://github.com/YOUR_USERNAME/halal-cms-frontend.git
cd halal-cms-frontend

# Install dependencies
npm install

# Build production
npm run build

# Serve with nginx (optional)
apt-get install -y nginx

# Copy build to nginx
cp -r dist /var/www/halal-cms-frontend

# Configure nginx
sudo tee /etc/nginx/sites-available/halal-cms-frontend > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/halal-cms-frontend;
        try_files \$uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Enable and restart nginx
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL Certificate (Let's Encrypt)

```bash
apt-get install -y certbot python3-certbot-nginx

certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Step 9: Setup Firewall

```bash
# Enable UFW
ufw enable

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Block other ports
ufw default deny incoming
ufw default allow outgoing
```

## 📋 Verification Checklist

After deployment, verify:

- [ ] Backend service running: `curl http://localhost:8080/api/nc/application/1`
- [ ] Database connected: Check logs with `journalctl -u halalcms-inspection -f`
- [ ] Frontend loading: Visit `your-domain.com`
- [ ] Email configured: Test sending from admin panel
- [ ] Database migrations applied: `psql -U halalcms -d halalcms_inspections -c "\dt"`

## 🔗 API Endpoints Available

Once deployed:

```
GET    /api/nc/application/{applicationId}
POST   /api/nc/{ncId}/customer-response
POST   /api/nc/{ncId}/evidence
POST   /api/nc/{ncId}/auditor-review
GET    /api/audit-summary/{auditId}/check-ncs
POST   /api/audit-summary/{auditId}/draft
POST   /api/audit-summary/{auditId}/submit
POST   /api/decisions/assign
POST   /api/decisions/{requestId}/decide
GET    /api/decisions/my-requests
POST   /api/certificates/generate/{auditId}
POST   /api/certificates/{certificateId}/approve
POST   /api/certificates/{certificateId}/send
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u halalcms-inspection -f

# Common issues:
# - Database not running: sudo systemctl restart postgresql
# - Port 8080 in use: ss -tlnp | grep 8080
# - Missing environment variables: Check .env file
```

### Database migration failed
```bash
# Check migrations
psql -U halalcms -d halalcms_inspections -c "SELECT version FROM flyway_schema_history;"

# Manually run migration
java -cp inspection-service/target/inspection-service-1.0.0-SNAPSHOT.jar \
  org.flywaydb.core.Flyway -url=jdbc:postgresql://localhost/halalcms_inspections \
  -user=halalcms -password=halalcms migrate
```

### Email not sending
```bash
# Check Gmail app password created
# Enable Less Secure App Access (if not using app password)
# Verify SMTP credentials in .env
```

## 📞 Support & Next Steps

1. **Git Setup**: Push code to GitHub repositories
2. **CI/CD**: Setup GitHub Actions for automated builds
3. **Monitoring**: Add Prometheus/Grafana for monitoring
4. **Backups**: Configure automated database backups
5. **SSL**: Renew certificates automatically with Certbot

---

**Ready to proceed? Let me know when you've:**
1. Set up GitHub repositories
2. Provisioned DigitalOcean droplet
3. Need help with any deployment step
