# HalalCMS Audit Report System - DigitalOcean Deployment Guide

## Overview
This guide covers deploying the audit report system with file upload capabilities to DigitalOcean App Platform and using DigitalOcean Spaces for file storage.

## Prerequisites
- DigitalOcean account with billing enabled
- Docker installed locally (for building images)
- PostgreSQL database (managed database or self-hosted)
- DigitalOcean Spaces bucket (optional, for cloud storage)

## File Storage Options

### Option 1: Local Filesystem (Recommended for Small Scale)
Files are stored on the application server's filesystem. Good for initial deployment.

**Storage Path**: `/var/lib/halalcms/audit-reports`

**Environment Variable**:
```bash
AUDIT_FILES_PATH=/var/lib/halalcms/audit-reports
```

**Prerequisites**:
- Sufficient disk space on the app instance
- Regular backups of the `/var/lib/halalcms` directory

### Option 2: DigitalOcean Spaces (Recommended for Scale)
Files are stored in DigitalOcean Spaces for redundancy and scalability.

**Setup**:
1. Create a Spaces bucket in DigitalOcean console
2. Generate access keys
3. Add to environment variables:
```bash
DO_SPACES_ENDPOINT=https://<region>.digitaloceanspaces.com
DO_SPACES_KEY=<your-access-key>
DO_SPACES_SECRET=<your-secret-key>
DO_SPACES_BUCKET=<bucket-name>
```

## Deployment Steps

### 1. Prepare Application Configuration

Set environment variables in DigitalOcean App Platform:

```
DATABASE_URL=postgresql://user:password@host:5432/halalcms_applications
DB_URL=postgresql://user:password@host:5432/halalcms_applications
DB_USER=halalcms
DB_PASSWORD=<secure-password>
JWT_SECRET=<256-bit-base64-encoded-secret>
AUDIT_FILES_PATH=/var/lib/halalcms/audit-reports
AUDIT_MAX_FILE_SIZE=52428800
REACT_APP_API_URL=https://your-domain.com/api
```

### 2. Build Docker Image

```bash
# Build backend application service
cd halal-cms-backend/application-service
docker build -t halalcms-app-service:latest .

# Build frontend
cd halal-cms-frontend
npm run build
docker build -t halalcms-frontend:latest .
```

### 3. Deploy to DigitalOcean App Platform

#### Using App Platform:
1. Connect your GitHub repository
2. Create new App from GitHub
3. Configure services:
   - **Application Service** (backend)
     - Port: 8082
     - Health check: `/health`
   - **Frontend** (React)
     - Port: 3000

#### Using Docker Compose on Droplet:
1. Create a Droplet (4GB RAM minimum recommended)
2. Install Docker and Docker Compose
3. Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  application-service:
    image: halalcms-app-service:latest
    ports:
      - "8082:8082"
    environment:
      DB_URL: ${DB_URL}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      AUDIT_FILES_PATH: ${AUDIT_FILES_PATH}
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - audit-reports:/var/lib/halalcms/audit-reports
    restart: always
    
  frontend:
    image: halalcms-frontend:latest
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: ${REACT_APP_API_URL}
    restart: always

volumes:
  audit-reports:
    driver: local
```

### 4. File Upload Configuration

**Maximum File Size**: 50MB per file
**Maximum Payload**: 500MB per request
**Allowed File Types**:
- application/pdf
- image/jpeg
- image/png
- image/jpg
- application/msword
- application/vnd.openxmlformats-officedocument.wordprocessingml.document

Modify in `application.yml` if needed:
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 100MB  # Change as needed
      max-request-size: 500MB
```

### 5. Directory Structure

Files are organized as:
```
/var/lib/halalcms/audit-reports/
  app_<applicationId>/
    <timestamp>/
      nc-evidence-q0-f0.pdf
      obs-evidence-q1-f0.jpg
      customer-evidence-q2-f0.docx
      audit_report_metadata.json
```

### 6. Backup Strategy

**For Local Filesystem**:
```bash
# Daily backup to DigitalOcean Spaces
aws s3 sync /var/lib/halalcms/audit-reports/ \
  s3://your-backup-bucket/audit-reports/ \
  --endpoint-url https://<region>.digitaloceanspaces.com \
  --recursive
```

**Add to crontab**:
```
0 2 * * * aws s3 sync /var/lib/halalcms/audit-reports/ s3://your-backup-bucket/audit-reports/ --endpoint-url https://<region>.digitaloceanspaces.com --recursive
```

### 7. Security Considerations

1. **File Validation**:
   - File type validation (MIME type check)
   - File size limits enforced
   - Filename sanitization

2. **Access Control**:
   - Only authenticated users can upload
   - Files associated with application ID
   - User audit trail in metadata

3. **Encryption**:
   - Use HTTPS for all file transfers
   - Consider encrypting files at rest
   - Use environment variables for secrets

4. **Rate Limiting**:
   - Add rate limiting to file upload endpoint
   - Monitor upload patterns for abuse

### 8. Monitoring and Logs

**Check Application Logs**:
```bash
docker logs <container-id> | grep "Audit Report Save"
```

**Monitor Disk Space**:
```bash
# Alert if disk usage exceeds 80%
df -h /var/lib/halalcms
```

**File Storage Metrics**:
- Total files uploaded
- Average file size
- Storage usage trends

### 9. Maintenance

**Clean Old Reports** (Keep last 6 months):
```bash
find /var/lib/halalcms/audit-reports -type d -mtime +180 -exec rm -rf {} \;
```

**Add to crontab**:
```
0 1 1 * * find /var/lib/halalcms/audit-reports -type d -mtime +180 -exec rm -rf {} \;
```

## Testing

### Test File Upload

```bash
# Create test file
echo "Test document" > test.txt

# Upload to audit report endpoint
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "payload=@payload.json" \
  -F "fileCount=1" \
  -F "totalFileSize=100" \
  -F "nc-evidence-q0-f0=@test.txt" \
  https://your-domain.com/api/applications/1/audit-report
```

### Verify File Storage

```bash
# Check if files are stored
ls -la /var/lib/halalcms/audit-reports/app_1/

# Check metadata
cat /var/lib/halalcms/audit-reports/app_1/<timestamp>/audit_report_metadata.json | jq
```

## Troubleshooting

### Issue: "File size exceeds limit"
- Check `max-file-size` in `application.yml`
- Increase if needed for your use case
- Verify client-side file size validation

### Issue: "Permission denied" on file save
```bash
# Fix permissions
sudo chmod -R 775 /var/lib/halalcms/audit-reports
sudo chown -R www-data:www-data /var/lib/halalcms/audit-reports
```

### Issue: Disk space full
```bash
# Check what's consuming space
du -sh /var/lib/halalcms/audit-reports/*

# Archive old files
tar -czf audit-reports-backup-2024.tar.gz /var/lib/halalcms/audit-reports/app_*/
```

## Scaling Considerations

1. **Use DigitalOcean Spaces** when:
   - Multiple app instances
   - Need geographic redundancy
   - Storage exceeds available disk

2. **Use Load Balancer** when:
   - > 1000 concurrent uploads per hour
   - Need automatic failover

3. **Use CDN** for file downloads:
   - Set up DigitalOcean CDN on Spaces
   - Faster file retrieval for users

## Cost Estimation (DigitalOcean)

- **App Platform**: $12-20/month (starter)
- **Managed Database**: $15-30/month (small)
- **Storage (Spaces)**: $5 + $0.005/GB
- **Backups**: Minimal additional cost

**Example for 1TB storage**: ~$25/month

---

For questions or issues, refer to DigitalOcean documentation or submit an issue.
