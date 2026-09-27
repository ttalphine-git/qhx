# Port Configuration - All Services

## ✅ All Ports Fixed and Standardized

### Service Port Mapping

| Service | Port | Dev Docker | Prod Docker | Database | Status |
|---------|------|-----------|-------------|----------|--------|
| **Auth Service** | 8081 | 8081 | 8081 | halalcms_auth | ✅ |
| **Application Service** | 8082 | 8082 | 8082 | halalcms_applications | ✅ |
| **Inspection Service** | 8083 | 8083 | 8083 | halalcms_inspections | ✅ |
| **Certificate Service** | 8084 | 8084 | 8084 | halalcms_certificates | ✅ |
| **Company Service** | 8085 | 8085 | 8085 | halalcms_companies | ✅ |
| **PostgreSQL** | 5432 | Internal | 5432 | All DBs | ✅ |
| **Frontend (HTTP)** | 80 | Internal | 80 | - | ✅ |
| **Frontend (HTTPS)** | 443 | Internal | 443 | - | ✅ |

---

## Configuration Files Updated

### ✅ Application YAML Files
- `auth-service/src/main/resources/application.yml` → Port 8081
- `application-service/src/main/resources/application.yml` → Port 8082
- `inspection-service/src/main/resources/application.yml` → Port 8083 (was 8004)
- `inspection-service/src/main/resources/application-prod.yml` → Port 8083 (was 8084)
- `certificate-service/src/main/resources/application.yml` → Port 8084 (was 8005)
- `company-service/src/main/resources/application.yml` → Port 8085 (was 8083)

### ✅ Docker Compose Files
- `docker-compose.yml` (dev) - Healthchecks updated:
  - Inspection: 8083 (was 8084)
  - Certificate: 8084 (was 8085)
  - Company: 8085 (was 8083)

- `support/docker-compose.prod.yml` (production) - All ports fixed:
  - Inspection: 8083 (was conflicting with Company)
  - Certificate: 8084 (was conflicting)
  - Company: 8085 (confirmed)
  - Added healthchecks to all services

---

## Verification

All configurations have been verified for consistency:

```bash
# Dev environment (internal container network)
localhost:8081 → Auth Service
localhost:8082 → Application Service
localhost:8083 → Inspection Service
localhost:8084 → Certificate Service
localhost:8085 → Company Service

# Production environment (exposed ports)
localhost:8081 → Auth Service
localhost:8082 → Application Service
localhost:8083 → Inspection Service
localhost:8084 → Certificate Service
localhost:8085 → Company Service
localhost:80   → Frontend (HTTP)
localhost:443  → Frontend (HTTPS)
localhost:5432 → PostgreSQL
```

---

## Health Check Endpoints

All services expose health check endpoints on port `<service_port>/actuator/health`:

```bash
# Local testing
curl http://localhost:8081/actuator/health   # Auth Service
curl http://localhost:8082/actuator/health   # Application Service
curl http://localhost:8083/actuator/health   # Inspection Service
curl http://localhost:8084/actuator/health   # Certificate Service
curl http://localhost:8085/actuator/health   # Company Service
```

---

## Docker Compose Commands

### Development (docker-compose.yml)
```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f auth-service

# Stop all services
docker-compose down
```

### Production (docker-compose.prod.yml)
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check health status
docker-compose -f docker-compose.prod.yml ps

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f inspection-service
```

---

## Port Conflict Resolution

### Previous Issues (FIXED)
- ❌ Inspection Service: 8004 (YAML) vs 8084 (Dev) vs 8083 (Prod) → ✅ Now 8083 everywhere
- ❌ Certificate Service: 8005 (YAML) vs 8085 (Dev) vs 8084 (Prod) → ✅ Now 8084 everywhere
- ❌ Company Service: 8083 (YAML) vs 8083 (Dev) vs 8085 (Prod) → ✅ Now 8085 everywhere

### Resolution Strategy
Used sequential port allocation (8081-8085) with single source of truth in:
1. Application YAML files (primary)
2. Docker Compose files (mirror configuration)
3. Health check endpoints (verification)

---

## Networking

### Development
- Internal Docker network: `halalcms-net`
- Services communicate via container names
- PostgreSQL accessible as `postgres:5432`

### Production
- Internal Docker network: `qhx-network`
- Services communicate via container names
- PostgreSQL accessible as `postgres:5432`
- External ports exposed for monitoring/debugging

---

## Firewall Rules (DigitalOcean)

### Recommended UFW Configuration
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP Frontend
ufw allow 443/tcp   # HTTPS Frontend
ufw allow 8081/tcp  # Auth Service (optional)
ufw allow 8082/tcp  # Application Service (optional)
ufw allow 8083/tcp  # Inspection Service (optional)
ufw allow 8084/tcp  # Certificate Service (optional)
ufw allow 8085/tcp  # Company Service (optional)
ufw allow 5432/tcp  # PostgreSQL (local only)
```

### For Production
Only expose ports 80, 443, and 22 (SSH). Keep service ports (8081-8085) internal via reverse proxy.

---

## Reverse Proxy Configuration (Nginx Example)

```nginx
upstream auth {
    server localhost:8081;
}

upstream application {
    server localhost:8082;
}

upstream inspection {
    server localhost:8083;
}

upstream certificate {
    server localhost:8084;
}

upstream company {
    server localhost:8085;
}

server {
    listen 80;
    server_name yourdomain.com;

    location /api/auth { proxy_pass http://auth; }
    location /api/application { proxy_pass http://application; }
    location /api/inspection { proxy_pass http://inspection; }
    location /api/certificate { proxy_pass http://certificate; }
    location /api/company { proxy_pass http://company; }
}
```

---

## Status

✅ **All ports are now consistent across all environments**
- Development: Ready to test
- Production: Ready to deploy
- Health checks: Enabled and verified
- No conflicts: All 5 services use unique ports

---

**Last Updated:** 2026-09-27
**Changes Made:** Standardized all ports to 8081-8085 across YAML, Dev Compose, and Prod Compose files
