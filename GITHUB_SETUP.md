# 🔗 GitHub Setup Guide

## Step 1: Create GitHub Repositories

### Backend Repository
1. Go to https://github.com/new
2. Fill in:
   - Repository name: `halal-cms-backend`
   - Description: `HalalCMS Backend - Spring Boot Microservices`
   - Visibility: Public (or Private)
   - DO NOT initialize with README (we have one)
3. Click "Create repository"

### Frontend Repository  
1. Go to https://github.com/new
2. Fill in:
   - Repository name: `halal-cms-frontend`
   - Description: `HalalCMS Frontend - React/Vite`
   - Visibility: Public (or Private)
   - DO NOT initialize with README
3. Click "Create repository"

## Step 2: Push Backend Code

```bash
cd D:\QHXSASS\halal-cms-backend

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Backend services implementation

- NCWorkflowService: NC submission, evidence, auditor review
- AuditSummaryService: Draft and final summaries
- DecisionMakingService: Decision workflow with auto-certificate generation
- CertificateGenerationService: Certificate generation and delivery
- Real database integration with PostgreSQL
- Flyway migrations (V1-V9)
- Email service with SMTP
- Notification system with persistence
- Comprehensive audit logging"

# Connect to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/halal-cms-backend.git

# Push to GitHub
git push -u origin main
```

## Step 3: Push Frontend Code

```bash
cd D:\QHXSASS\halal-cms-frontend

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Frontend with real API integration

- NcsTab: NC workflow with evidence submission
- AuditSummaryTab: Draft and final summaries with product compliance
- DecisionMakingTab: Decision workflow UI
- CertificateManagementTab: Certificate generation and delivery
- React Query for server state management
- Error handling and loading states
- Toast notifications for user feedback
- Production build ready"

# Connect to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/halal-cms-frontend.git

# Push to GitHub
git push -u origin main
```

## Step 4: Verify Repositories

After pushing, verify:
1. Go to https://github.com/YOUR_USERNAME/halal-cms-backend
2. Go to https://github.com/YOUR_USERNAME/halal-cms-frontend
3. Both should show all files and commits

## Step 5: Setup Deploy Keys (Optional - for DigitalOcean)

If you want DigitalOcean to automatically deploy:

### Create SSH Key on Droplet
```bash
ssh root@YOUR_DROPLET_IP
ssh-keygen -t ed25519 -C "halalcms-deploy" -f ~/.ssh/halalcms
cat ~/.ssh/halalcms.pub
```

### Add Deploy Key to GitHub
1. Go to your repository Settings → Deploy keys
2. Click "Add deploy key"
3. Paste the public key from above
4. Check "Allow write access" if auto-deployment needed
5. Click "Add key"

## Step 6: Setup GitHub Actions (Optional - for CI/CD)

Create `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: 17
          distribution: temurin
      
      - name: Build with Maven
        run: mvn clean install -DskipTests
      
      - name: Deploy to DigitalOcean
        run: |
          # Add deployment script here
```

## 🎯 Quick Checklist

- [ ] Created halal-cms-backend repository
- [ ] Created halal-cms-frontend repository
- [ ] Pushed backend code to GitHub
- [ ] Pushed frontend code to GitHub
- [ ] Verified both repositories show all files
- [ ] (Optional) Added deploy keys
- [ ] (Optional) Setup GitHub Actions

## 📝 Common Git Commands

```bash
# Check status
git status

# View commit log
git log --oneline

# Create new branch
git checkout -b feature-name

# Merge branch
git checkout main
git merge feature-name

# Push changes
git add .
git commit -m "Description"
git push

# Pull latest changes
git pull origin main
```

## 🚨 Important Notes

1. **Don't commit sensitive files:**
   - `.env` files (use .env.example)
   - Private keys
   - API keys
   - Database passwords

2. **Good .gitignore for backend:**
   ```
   .env
   .env.local
   target/
   .idea/
   *.iml
   .vscode/
   *.log
   node_modules/
   ```

3. **Good .gitignore for frontend:**
   ```
   .env.local
   node_modules/
   dist/
   .idea/
   .vscode/
   *.log
   ```

## 📚 Resources

- Git Documentation: https://git-scm.com/doc
- GitHub Documentation: https://docs.github.com
- Spring Boot Deployment: https://spring.io/guides/gs/deploying-on-cloudfoundry/

---

After completing these steps, you''re ready for DigitalOcean deployment!
