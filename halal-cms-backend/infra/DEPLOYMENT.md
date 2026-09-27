# HalalCMS DigitalOcean Deployment Guide

This guide provides step-by-step instructions for deploying HalalCMS to DigitalOcean using Docker Compose.

## Prerequisites

- DigitalOcean Droplet (2GB RAM minimum, 2 vCPU recommended)
- Ubuntu 20.04 LTS or later
- Docker and Docker Compose installed
- Git installed

## Quick Setup (Automated)

### 1. SSH into your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Install Docker and Docker Compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 3. Clone the Repository

```bash
cd /opt
git clone https://github.com/your-repo/halal-cms.git halalcms
cd halalcms/halal-cms-backend
```

### 4. Run the Automated Deployment Script

```bash
# Set required environment variables
export POSTGRES_PASSWORD="your-strong-postgres-password"
export JWT_SECRET="your-256-bit-jwt-secret"
export SUPER_ADMIN_PASSWORD="your-super-admin-password"
export MAIL_USERNAME="your-email@gmail.com"
export MAIL_PASSWORD="your-app-password"

# Run deployment script
bash infra/digitalocean-deploy.sh
```

## Manual Setup

### 1. Create Environment File

```bash
cat > .env <<EOF
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/halalcms_auth
DB_USER=halal_user
DB_PASSWORD=halal@secure123
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-strong-password

# JWT Configuration
JWT_SECRET=your-256-bit-jwt-secret

# Application Configuration
ADMIN_PASSWORD=admin123
SUPER_ADMIN_PASSWORD=sqxad@12098

# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
EOF
chmod 600 .env
```

### 2. Start PostgreSQL

```bash
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10
```

### 3. Initialize Databases

```bash
bash infra/postgres/setup-databases.sh
```

Or manually with psql:

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres

# Inside psql:
CREATE USER halal_user WITH PASSWORD 'halal@secure123';
CREATE DATABASE halalcms_auth OWNER halal_user;
CREATE DATABASE halalcms_applications OWNER halal_user;
CREATE DATABASE halalcms_companies OWNER halal_user;
CREATE DATABASE halalcms_certificates OWNER halal_user;
CREATE DATABASE halalcms_inspections OWNER halal_user;
CREATE DATABASE halalcms_notifications OWNER halal_user;

# Create UUID extension in each database
\c halalcms_auth
CREATE EXTENSION "uuid-ossp";
\c halalcms_applications
CREATE EXTENSION "uuid-ossp";
-- Repeat for other databases...
```

### 4. Build Docker Images

```bash
docker-compose -f docker-compose.prod.yml build --pull
```

### 5. Start All Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Database Migration from Flyway to Hibernate

HalalCMS now uses **Hibernate** for database management instead of Flyway migrations.

### Key Changes:

- **Removed**: Flyway dependencies and migration scripts
- **Added**: JPA Entity-driven schema generation with `ddl-auto: update`
- **Benefit**: Schema is now managed by entity annotations, making it easier to track changes in code

### First Run Behavior:

On the first run, Hibernate will automatically:
1. Create all required tables based on JPA entity definitions
2. Add required indexes
3. Set up relationships and constraints

**No manual migration scripts needed!**

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f auth-service
```

### Check Service Health

```bash
# API Gateway
curl http://localhost:8080/health

# Auth Service  
curl http://localhost:8081/actuator/health

# Application Service
curl http://localhost:8082/actuator/health
```

### Database Backup

```bash
# Backup all databases
for db in halalcms_auth halalcms_applications halalcms_companies halalcms_certificates halalcms_inspections halalcms_notifications; do
  docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U halal_user $db > $db.sql
done
```

### Database Restore

```bash
# Restore a database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U halal_user halalcms_auth < halalcms_auth.sql
```

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Verify network connectivity
docker-compose -f docker-compose.prod.yml exec api-gateway ping postgres
```

### Services Failing to Start

```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs auth-service

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database Schema Issues

Since Hibernate manages schema with `ddl-auto: update`:
- **Development**: Use `ddl-auto: update` (automatic schema updates)
- **Production**: Change to `ddl-auto: validate` once stable
- **Reverting**: Use `ddl-auto: create` only if you want to reset the database

## Production Best Practices

### 1. Change Default Passwords

Update all passwords in `.env`:
- `DB_PASSWORD` - Database user password
- `ADMIN_PASSWORD` - Admin user password
- `SUPER_ADMIN_PASSWORD` - Super admin password
- `JWT_SECRET` - Use a strong 256-bit secret
- `MAIL_PASSWORD` - Application-specific email password

### 2. Configure Firewall

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. Set Up SSL/TLS

Use Let's Encrypt with Nginx reverse proxy:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

### 4. Enable Backups

Configure automated PostgreSQL backups (recommended daily).

### 5. Monitor Resources

```bash
# Check CPU, Memory, Disk
docker stats
df -h
```

## Stopping and Removing Services

```bash
# Stop all services (data persists)
docker-compose -f docker-compose.prod.yml stop

# Remove containers (data persists in volumes)
docker-compose -f docker-compose.prod.yml down

# Remove everything including volumes (⚠️ WARNING: Deletes data)
docker-compose -f docker-compose.prod.yml down -v
```

## Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables in `.env`
3. Ensure all prerequisites are installed
4. Check database connectivity with psql
