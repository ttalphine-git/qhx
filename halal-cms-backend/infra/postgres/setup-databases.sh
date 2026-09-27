#!/bin/bash
#
# Database setup script for HalalCMS on DigitalOcean
# Automatically creates all required databases and users
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
DB_USER=${DB_USER:-halal_user}
DB_PASSWORD=${DB_PASSWORD:-halal@secure123}

# Databases to create
DATABASES=(
  "halalcms_auth"
  "halalcms_applications"
  "halalcms_companies"
  "halalcms_certificates"
  "halalcms_inspections"
  "halalcms_notifications"
)

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}HalalCMS Database Setup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Function to execute SQL
execute_sql() {
  local sql=$1

  if [ -z "$POSTGRES_PASSWORD" ]; then
    PGPASSWORD="" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "$sql"
  else
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "$sql"
  fi
}

# Create main application user if not exists
echo -e "${YELLOW}Creating application user: $DB_USER${NC}"
execute_sql "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo -e "${GREEN}User $DB_USER already exists${NC}"

# Grant privileges to user
execute_sql "ALTER USER $DB_USER CREATEDB;"
execute_sql "ALTER USER $DB_USER CREATEROLE;"

# Create databases
for db in "${DATABASES[@]}"; do
  echo -e "${YELLOW}Creating database: $db${NC}"
  execute_sql "CREATE DATABASE $db OWNER $DB_USER;" 2>/dev/null || echo -e "${GREEN}Database $db already exists${NC}"

  # Grant privileges
  execute_sql "GRANT ALL PRIVILEGES ON DATABASE $db TO $DB_USER;"
  execute_sql "ALTER DATABASE $db OWNER TO $DB_USER;"
done

# Create required extensions for each database
echo -e "${YELLOW}Setting up database extensions${NC}"
for db in "${DATABASES[@]}"; do
  if [ -z "$POSTGRES_PASSWORD" ]; then
    PGPASSWORD="" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$db" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
  else
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$db" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
  fi
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Created databases:"
for db in "${DATABASES[@]}"; do
  echo "  - $db"
done
echo ""
echo "Database user: $DB_USER"
echo "Connection string: postgresql://$DB_USER@$POSTGRES_HOST:$POSTGRES_PORT/"
