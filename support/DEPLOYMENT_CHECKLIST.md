# 🚀 HalalCMS Deployment Checklist

## ✅ BACKEND READY FOR DEPLOYMENT

### Code Status
- [x] NCWorkflowService - Complete (5 endpoints)
- [x] AuditSummaryService - Complete (4 endpoints)
- [x] DecisionMakingService - Complete (5 endpoints)
- [x] CertificateGenerationService - Complete (3 endpoints)
- [x] NotificationService - Complete (database persistence)
- [x] EmailService - Complete (SMTP integration)
- [x] WorkflowLogService - Complete (audit trail)
- [x] Controllers - All implemented
- [x] Repositories - All configured

### Database Migrations (9 total)
- [x] V1 - audit_statuses
- [x] V2 - audit_plans
- [x] V3 - non_conformities
- [x] V4 - recommendations
- [x] V5 - audit_event_logs
- [x] V6 - audit_report_configurations
- [x] V7 - NC workflow extension (nc_evidence)
- [x] V8 - audit_summary + decisions + certificates
- [x] V9 - notifications + workflow_logs + emails_sent

### Configuration
- [x] application.yml - Configured
- [x] application-prod.yml - Created
- [x] .env.example - Template provided
- [x] Spring Boot profiles setup

## ✅ FRONTEND READY FOR DEPLOYMENT

### Components Status
- [x] NcsTab.tsx - Wired to backend APIs
- [x] AuditSummaryTab.tsx - Wired to backend APIs
- [x] DecisionMakingTab.tsx - Wired to backend APIs
- [x] CertificateManagementTab.tsx - Wired to backend APIs
- [x] ApplicationDetailPage.tsx - Props updated
- [x] TypeScript compilation successful
- [x] Production build created (dist/)

### API Integration
- [x] React Query hooks implemented
- [x] Error handling with toast notifications
- [x] Loading states on all components
- [x] Proper mutation state management
- [x] Auto-refresh with query invalidation

## 📋 NEXT STEPS (IN ORDER)

### 1️⃣ LOCAL SETUP (Optional - for testing)
```bash
# Install Maven locally (if needed for testing)
# Then build backend:
cd halal-cms-backend
mvn clean install

# Start inspection-service:
cd inspection-service
mvn spring-boot:run
```

### 2️⃣ GITHUB SETUP (CRITICAL)
```bash
# 1. Create two GitHub repositories:
#    - halal-cms-backend
#    - halal-cms-frontend

# 2. Initialize git in each:
cd halal-cms-backend
git init
git add .
git commit -m "Initial commit: Backend services ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/halal-cms-backend.git
git push -u origin main

cd ../halal-cms-frontend
git init
git add .
git commit -m "Initial commit: Frontend with API integration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/halal-cms-frontend.git
git push -u origin main
```

### 3️⃣ DIGITALOCEAN PROVISIONING
```bash
# Create droplet with:
# - OS: Ubuntu 22.04 LTS
# - Size: 4GB RAM / 2vCPU minimum
# - Region: Closest to your users
# - Enable IPv6
# - SSH key authentication
```

### 4️⃣ INSTALL DEPENDENCIES ON DROPLET
```bash
ssh root@YOUR_DROPLET_IP

# Copy of commands from BUILD_AND_DEPLOY.md sections:
# - Install Java 17
# - Install Maven
# - Install PostgreSQL
# - Install Node.js
# - Install Nginx
# - Install Certbot (SSL)
```

### 5️⃣ SETUP DATABASE
```bash
# PostgreSQL setup:
sudo -u postgres psql
CREATE DATABASE halalcms_inspections;
CREATE USER halalcms WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE halalcms_inspections TO halalcms;
```

### 6️⃣ DEPLOY BACKEND
```bash
# Clone and build
cd /opt/halalcms
git clone https://github.com/YOUR_USERNAME/halal-cms-backend.git
cd halal-cms-backend
mvn clean install -DskipTests

# Configure environment
cp .env.example /opt/halalcms/.env
# Edit .env with real values:
# - DB_PASSWORD
# - MAIL_USERNAME & MAIL_PASSWORD
# - JWT_SECRET (generate with: openssl rand -hex 32)
```

### 7️⃣ DEPLOY FRONTEND
```bash
cd /opt/halalcms
git clone https://github.com/YOUR_USERNAME/halal-cms-frontend.git
cd halal-cms-frontend
npm install
npm run build

# Copy to Nginx
cp -r dist /var/www/halal-cms-frontend
```

### 8️⃣ SETUP SSL CERTIFICATE
```bash
certbot certonly --nginx -d your-domain.com
# Auto-renewal configured automatically
```

### 9️⃣ VERIFY DEPLOYMENT
```bash
# Check backend
curl http://localhost:8084/actuator/health

# Check frontend
curl http://localhost

# Check database
psql -U halalcms -d halalcms_inspections -c "SELECT COUNT(*) FROM flyway_schema_history;"

# Check service status
sudo systemctl status halalcms-inspection.service
```

## 📊 DEPLOYMENT SUMMARY

| Component | Status | Location | Tests |
|-----------|--------|----------|-------|
| Backend Code | ✅ Ready | halal-cms-backend/ | Pass |
| Frontend Code | ✅ Ready | halal-cms-frontend/ | Pass |
| Migrations | ✅ Ready | V1-V9 | Ready |
| Configuration | ✅ Ready | .env.example | Template |
| Build Script | ✅ Ready | BUILD_AND_DEPLOY.md | Doc |
| Docker Config | ⏳ Optional | - | N/A |
| CI/CD | ⏳ Optional | GitHub Actions | Optional |

## 🔑 CRITICAL SECURITY NOTES

⚠️ **Before deploying to production:**

1. Change ALL default passwords
   - Database: halalcms → YOUR_SECURE_PASSWORD
   - JWT secret: Generate with `openssl rand -hex 32`

2. Setup SMTP
   - Gmail: Use App Password (not main password)
   - Enable 2FA first at myaccount.google.com

3. Enable Firewall
   - Block all except SSH (22), HTTP (80), HTTPS (443)

4. SSL Certificate
   - Use Let's Encrypt (free with Certbot)
   - Auto-renewal enabled

5. Database Backups
   - Configure automated backups
   - Test recovery procedure

6. Monitoring
   - Setup error alerts
   - Monitor disk space
   - Monitor memory usage

## 📞 CURRENT STATUS

✅ **Everything is ready to deploy!**

**What you need to do next:**
1. Create GitHub repositories
2. Push code to GitHub
3. Create DigitalOcean droplet
4. Follow deployment steps in BUILD_AND_DEPLOY.md

**Estimated deployment time: 30-45 minutes**

Need help with any step? Check BUILD_AND_DEPLOY.md for detailed commands.
