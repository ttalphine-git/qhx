# Docker Files Cleanup & Organization

## ✅ Cleanup Complete

### Files Deleted (Redundant/Outdated)

1. **❌ `halal-cms-backend/docker-compose.dev.yml`** 
   - **Why deleted**: Outdated development file with hardcoded Windows paths
   - **Issues**:
     - Used volume mounts: `D:/QHXSASS/halal-cms-backend/.../target/*.jar`
     - Wrong ports: inspection=8084, certificate=8085 (conflicting)
     - Hardcoded user/password: `halalcms/halalcms`
     - No longer needed (use `docker-compose.yml` instead)

2. **❌ `support/docker-compose.yml`**
   - **Why deleted**: Duplicate of docker-compose.prod.yml
   - **Issues**:
     - Confusing to have two nearly identical files
     - Different environment variable naming (SPRING_DATASOURCE_URL vs DB_URL)
     - Missing healthchecks
     - Use `support/docker-compose.prod.yml` instead

---

## ✅ Docker Files Kept (Current Standard)

### Development

**📄 `halal-cms-backend/docker-compose.yml`** (ACTIVE)
```
Purpose: Local development with Docker Compose
Features:
- Builds services from Dockerfiles
- Internal container network (halalcms-net)
- Health checks for all services
- Depends on entity-based schema (Hibernate)
- No port exposure (use for internal testing)
```

Usage:
```bash
cd halal-cms-backend
docker-compose up -d          # Start all services
docker-compose ps             # Check status
docker-compose logs -f        # View logs
docker-compose down           # Stop services
```

---

### Production

**📄 `support/docker-compose.prod.yml`** (ACTIVE)
```
Purpose: DigitalOcean production deployment
Features:
- Pulls images from DigitalOcean registry
- Exposed ports for external access
- Environment variable configuration
- Health checks for all services
- Proper networking (qhx-network)
- All services with restart policies
```

Usage:
```bash
cd support
docker-compose -f docker-compose.prod.yml up -d    # Start
docker-compose -f docker-compose.prod.yml ps        # Status
docker-compose -f docker-compose.prod.yml logs -f   # Logs
docker-compose -f docker-compose.prod.yml down      # Stop
```

---

## Docker Image Registry Scripts

### Push Scripts (6 services + frontend)

Each service has a `push-docker.sh` script for CI/CD:

```
halal-cms-backend/
  ├── auth-service/push-docker.sh           → qhx-auth
  ├── application-service/push-docker.sh    → qhx-application
  ├── certificate-service/push-docker.sh    → qhx-certificate
  ├── company-service/push-docker.sh        → qhx-company
  ├── inspection-service/push-docker.sh     → qhx-inspection
  └── [frontend]/push-docker.sh             → qhx-frontend

Registry: registry.digitalocean.com/rzct/
```

**Using the scripts:**

```bash
# Required: Set your DigitalOcean API token
export DO_API_TOKEN="your-do-api-token"

# Build and push individual service
cd auth-service
bash push-docker.sh

# Or push all services (from backend root)
for dir in */; do
  if [ -f "$dir/push-docker.sh" ]; then
    (cd "$dir" && bash push-docker.sh)
  fi
done
```

---

## Docker Ignore Files

### Backend `.dockerignore`
```
halal-cms-backend/.dockerignore
├── .git
├── .github
├── **/.mvn
├── **/node_modules
├── docker-compose*.yml
├── Makefile
├── *.md
├── .env
├── .env.*
└── !.env.example
```

### Frontend `.dockerignore`
```
halal-cms-frontend/.dockerignore
├── .git
├── node_modules
├── dist
├── *.md
├── .env
└── .env.*
```

---

## Service Dockerfiles

All services use standardized Java Dockerfiles:

```
halal-cms-backend/
├── auth-service/Dockerfile
├── application-service/Dockerfile
├── certificate-service/Dockerfile
├── company-service/Dockerfile
└── inspection-service/Dockerfile

halal-cms-frontend/
└── Dockerfile
```

Each builds a container image for registry deployment.

---

## Current Docker Architecture

### Development Flow
```
Local Source Code
       ↓
    Build Dockerfiles (docker-compose.yml)
       ↓
    Container Images (local)
       ↓
    docker-compose up (Local Testing)
       ↓
    Health Checks ✓
```

### Production Flow
```
Source Code
       ↓
    Build Dockerfiles
       ↓
    Run push-docker.sh
       ↓
    Push to DigitalOcean Registry
       ↓
    Pull in docker-compose.prod.yml
       ↓
    Run on DigitalOcean Droplet
       ↓
    Health Checks ✓
```

---

## Docker Compose Comparison

| Feature | Dev | Prod |
|---------|-----|------|
| **File** | docker-compose.yml | docker-compose.prod.yml |
| **Build** | From Dockerfiles | Pull from registry |
| **Network** | Internal (halalcms-net) | Internal (qhx-network) |
| **Ports** | No exposure | 80, 443, 8081-8085 |
| **Healthchecks** | ✅ Yes | ✅ Yes |
| **Config** | .env file | Environment vars |
| **Database** | Shared postgres | Separate databases |
| **Frontend** | Not included | Included with Nginx |

---

## Environment Variables

### Development (.env file)
```bash
DB_USER=halal_user
DB_PASSWORD=halal@secure123
JWT_SECRET=dev-secret
ADMIN_PASSWORD=admin123
```

### Production (docker-compose.prod.yml)
```yaml
environment:
  DB_URL: ${DB_URL:-jdbc:postgresql://postgres:5432/...}
  DB_USER: ${DB_USER:-halal_user}
  DB_PASSWORD: ${DB_PASSWORD:-halal@secure123}
  JWT_SECRET: ${JWT_SECRET:-...}
```

Set before running:
```bash
export DB_URL="jdbc:postgresql://..."
export JWT_SECRET="your-256-bit-secret"
# ... etc
docker-compose -f docker-compose.prod.yml up -d
```

---

## Port Mapping (All Standardized)

### Exposed Ports (Production)
```
Host         Container    Service
80      →    80          Nginx Frontend (HTTP)
443     →    443         Nginx Frontend (HTTPS)
5432    →    5432        PostgreSQL
8081    →    8081        Auth Service
8082    →    8082        Application Service
8083    →    8083        Inspection Service
8084    →    8084        Certificate Service
8085    →    8085        Company Service
```

### Internal Ports (Development)
```
Services communicate via container names:
- postgres:5432
- auth-service:8081
- application-service:8082
- inspection-service:8083
- certificate-service:8084
- company-service:8085
```

---

## Cleanup Summary

| Item | Status | Action |
|------|--------|--------|
| docker-compose.dev.yml | ❌ DELETED | Outdated/redundant |
| support/docker-compose.yml | ❌ DELETED | Duplicate |
| docker-compose.yml (dev) | ✅ ACTIVE | Use for local testing |
| docker-compose.prod.yml | ✅ ACTIVE | Use for production |
| push-docker.sh scripts | ✅ ACTIVE | Use for registry pushes |
| .dockerignore files | ✅ ACTIVE | Optimizes builds |
| Service Dockerfiles | ✅ ACTIVE | Build container images |

---

## Quick Reference

### Start Development Environment
```bash
cd halal-cms-backend
docker-compose up -d
curl http://localhost:8081/actuator/health  # Test auth service
```

### Deploy to Production
```bash
# Build and push images
export DO_API_TOKEN="your-token"
./push-all-services.sh

# Deploy
cd support
docker-compose -f docker-compose.prod.yml up -d
```

### Check Service Status
```bash
# Dev
cd halal-cms-backend
docker-compose ps
docker-compose logs -f auth-service

# Prod
cd support
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f auth-service
```

---

**Status**: ✅ Docker files cleaned up and organized
**Last Updated**: 2026-09-27
**Files Kept**: 2 active docker-compose files + 6 push scripts
**Files Removed**: 2 redundant files
