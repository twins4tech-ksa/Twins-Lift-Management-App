#!/bin/bash
set -e

# =================================================================
# Twins Elevators Multi-Tenant SaaS - Automated DB Provisioner
# Runs on first PostgreSQL container start
# =================================================================

echo "Starting automated multi-tenant database provisioning..."

function create_tenant_database() {
    local user=$1
    local pass=$2
    local db=$3
    echo "Creating tenant database: $db with owner: $user"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$user') THEN
                CREATE USER $user WITH ENCRYPTED PASSWORD '$pass';
            END IF;
        END
        \$\$;
        SELECT 'CREATE DATABASE $db WITH OWNER = $user'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
        GRANT ALL PRIVILEGES ON DATABASE $db TO $user;
EOSQL
}

# 1. Main Twins Tenant Database
create_tenant_database "twins_main_user" "TwinsPassMain2026!" "twins_db_main"

# 2. Arabian Lifts Tenant Database
create_tenant_database "arabian_lifts_user" "ArabianPass2026!" "twins_db_arabian_lifts"

# 3. Gulf Elevators Tenant Database
create_tenant_database "gulf_elevators_user" "GulfPass2026!" "twins_db_gulf_elevators"

echo "All multi-tenant databases initialized successfully!"
