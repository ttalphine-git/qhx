#!/bin/bash
set -e

create_db() {
  local db=$1
  echo "Creating database: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db') THEN
        PERFORM dblink_exec('dbname=$POSTGRES_DB', 'CREATE DATABASE $db');
      END IF;
    END
    \$\$;
EOSQL
}

# Simpler approach: attempt CREATE DATABASE and ignore duplicate errors
for db in halalcms_applications halalcms_companies halalcms_certificates halalcms_inspections halalcms_notifications; do
  psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -c "CREATE DATABASE $db;" 2>&1 | grep -v "already exists" || true
  echo "Database $db ready."
done
