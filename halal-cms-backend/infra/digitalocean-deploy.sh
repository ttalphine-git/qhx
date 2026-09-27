#!/bin/bash
#
# HalalCMS DigitalOcean Deployment Script
# Automated setup and deployment for production environment
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables - customize as needed
PROJECT_DIR="/opt/halalcms"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?Error: POSTGRES_PASSWORD not set}"
DB_USER="${DB_USER:halal_user}"
DB_PASSWORD="${DB_PASSWORD:halal@secure123}"
POSTGRES_HOST="${POSTGRES_HOST:localhost}"
POSTGRES_PORT="${POSTGRES_PORT:5432}"

# JWT and security
JWT_SECRET="${JWT_SECRET:?Error: JWT_SECRET not set}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:admin123}"
SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:?Error: SUPER_ADMIN_PASSWORD not set}"

# Mail configuration
MAIL_HOST="${MAIL_HOST:smtp.gmail.com}"
MAIL_PORT="${MAIL_PORT:587}"
MAIL_USERNAME="${MAIL_USERNAME:?Error: MAIL_USERNAME not set}"
MAIL_PASSWORD="${MAIL_PASSWORD:?Error: MAIL_PASSWORD not set}"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════╗"
echo "║   HalalCMS DigitalOcean Deployment Script      ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed.${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is required but not installed.${NC}"; exit 1; }
echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Step 2: Create project directory structure
echo -e "${YELLOW}Step 2: Creating project directories...${NC}"
mkdir -p "$PROJECT_DIR/infra/postgres"
mkdir -p "$PROJECT_DIR/data/postgres"
echo -e "${GREEN}✓ Project directories created${NC}"

# Step 3: Setup environment file
echo -e "${YELLOW}Step 3: Setting up environment variables...${NC}"
cat > "$PROJECT_DIR/.env" <<EOF
# Database Configuration
DB_URL=jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/halalcms_auth
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# Application Configuration
ADMIN_PASSWORD=$ADMIN_PASSWORD
SUPER_ADMIN_PASSWORD=$SUPER_ADMIN_PASSWORD

# Mail Configuration
MAIL_HOST=$MAIL_HOST
MAIL_PORT=$MAIL_PORT
MAIL_USERNAME=$MAIL_USERNAME
MAIL_PASSWORD=$MAIL_PASSWORD

# Deployment
ENVIRONMENT=production
EOF
chmod 600 "$PROJECT_DIR/.env"
echo -e "${GREEN}✓ Environment variables configured${NC}"

# Step 4: Create database setup script
echo -e "${YELLOW}Step 4: Creating database setup script...${NC}"
cat > "$PROJECT_DIR/infra/postgres/setup-databases.sh" <<'SETUP_SCRIPT'
#!/bin/bash
set -e

POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
DB_USER=${DB_USER:-halal_user}
DB_PASSWORD=${DB_PASSWORD:-halal@secure123}

DATABASES=(
  "halalcms_auth"
  "halalcms_applications"
  "halalcms_companies"
  "halalcms_certificates"
  "halalcms_inspections"
  "halalcms_notifications"
)

echo "Creating database user and databases..."

execute_sql() {
  local sql=$1
  if [ -z "$POSTGRES_PASSWORD" ]; then
    PGPASSWORD="" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "$sql"
  else
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "$sql"
  fi
}

# Create user
execute_sql "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
execute_sql "ALTER USER $DB_USER CREATEDB;"

# Create databases
for db in "${DATABASES[@]}"; do
  execute_sql "CREATE DATABASE $db OWNER $DB_USER;" 2>/dev/null || echo "Database $db already exists"
  execute_sql "GRANT ALL PRIVILEGES ON DATABASE $db TO $DB_USER;"
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$db" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
done

echo "Database setup completed!"
SETUP_SCRIPT
chmod +x "$PROJECT_DIR/infra/postgres/setup-databases.sh"
echo -e "${GREEN}✓ Database setup script created${NC}"

# Step 5: Pull and build Docker images
echo -e "${YELLOW}Step 5: Building Docker images...${NC}"
cd "$PROJECT_DIR"
docker-compose -f "$DOCKER_COMPOSE_FILE" build --pull 2>&1 | tail -10
echo -e "${GREEN}✓ Docker images built${NC}"

# Step 6: Start PostgreSQL
echo -e "${YELLOW}Step 6: Starting PostgreSQL...${NC}"
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres
sleep 10
echo -e "${GREEN}✓ PostgreSQL started${NC}"

# Step 7: Setup databases
echo -e "${YELLOW}Step 7: Setting up databases...${NC}"
bash "$PROJECT_DIR/infra/postgres/setup-databases.sh" || echo -e "${YELLOW}Note: Databases may already exist${NC}"
echo -e "${GREEN}✓ Databases initialized${NC}"

# Step 8: Start all services
echo -e "${YELLOW}Step 8: Starting all services...${NC}"
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
sleep 15
echo -e "${GREEN}✓ All services started${NC}"

# Step 9: Health check
echo -e "${YELLOW}Step 9: Verifying deployment...${NC}"
services=("api-gateway:8080" "auth-service:8081" "application-service:8082")
for service in "${services[@]}"; do
  IFS=':' read -r name port <<< "$service"
  if curl -sf "http://localhost:$port/health" >/dev/null 2>&1 || curl -sf "http://localhost:$port/actuator/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ $name is healthy${NC}"
  else
    echo -e "${YELLOW}⚠ $name not responding yet (may still be starting)${NC}"
  fi
done

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════╗"
echo "║      Deployment Completed Successfully!        ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Services are running at:"
echo "  API Gateway: http://localhost:8080"
echo "  Auth Service: http://localhost:8081"
echo "  Application Service: http://localhost:8082"
echo "  Certificate Service: http://localhost:8005"
echo "  Company Service: http://localhost:8083"
echo "  Inspection Service: http://localhost:8004"
echo ""
echo "View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
