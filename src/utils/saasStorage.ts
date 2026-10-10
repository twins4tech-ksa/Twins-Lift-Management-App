import {
  CompanyTenant,
  CompanyBranch,
  CompanyWarehouse,
  ContaboVpsConfig,
  INITIAL_SAAS_COMPANIES,
  INITIAL_SAAS_BRANCHES,
  INITIAL_SAAS_WAREHOUSES,
  DEFAULT_CONTABO_CONFIG,
} from '../types/saas';

export const STORAGE_KEY_SAAS_TENANTS = 'twins_saas_tenants_v1';
export const STORAGE_KEY_SAAS_BRANCHES = 'twins_saas_branches_v1';
export const STORAGE_KEY_SAAS_WAREHOUSES = 'twins_saas_warehouses_v1';
export const STORAGE_KEY_SAAS_ACTIVE_TENANT = 'twins_saas_active_tenant_id_v1';
export const STORAGE_KEY_SAAS_CONTABO = 'twins_saas_contabo_config_v1';

// Load stored companies or seed
export function getStoredTenants(): CompanyTenant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAAS_TENANTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading SaaS tenants from localStorage', e);
  }
  return INITIAL_SAAS_COMPANIES;
}

export function saveTenants(tenants: CompanyTenant[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SAAS_TENANTS, JSON.stringify(tenants));
  } catch (e) {
    console.error('Error saving SaaS tenants', e);
  }
}

// Load stored branches or seed
export function getStoredBranches(): CompanyBranch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAAS_BRANCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading SaaS branches from localStorage', e);
  }
  return INITIAL_SAAS_BRANCHES;
}

export function saveBranches(branches: CompanyBranch[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SAAS_BRANCHES, JSON.stringify(branches));
  } catch (e) {
    console.error('Error saving SaaS branches', e);
  }
}

// Load stored warehouses or seed
export function getStoredWarehouses(): CompanyWarehouse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAAS_WAREHOUSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading SaaS warehouses from localStorage', e);
  }
  return INITIAL_SAAS_WAREHOUSES;
}

export function saveWarehouses(warehouses: CompanyWarehouse[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SAAS_WAREHOUSES, JSON.stringify(warehouses));
  } catch (e) {
    console.error('Error saving SaaS warehouses', e);
  }
}

// Active Tenant ID
export function getActiveTenantId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SAAS_ACTIVE_TENANT);
    if (stored) return stored;
  } catch (e) {}
  return 'tenant-twins-main';
}

export function setActiveTenantId(tenantId: string) {
  try {
    localStorage.setItem(STORAGE_KEY_SAAS_ACTIVE_TENANT, tenantId);
  } catch (e) {}
}

// Contabo VPS Config
export function getStoredContaboConfig(): ContaboVpsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAAS_CONTABO);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CONTABO_CONFIG;
}

export function saveContaboConfig(config: ContaboVpsConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_SAAS_CONTABO, JSON.stringify(config));
  } catch (e) {}
}

// ==========================================
// Contabo VPS & Docker Scripts Generators
// ==========================================

export function generateContaboDockerCompose(tenants: CompanyTenant[], config: ContaboVpsConfig): string {
  return `# =================================================================
# Twins Elevators Multi-Tenant SaaS - Contabo VPS Deployment
# Generated for VPS IP: ${config.vpsIp} | Domain: ${config.domain}
# Isolated PostgreSQL Multi-Tenant Databases per Company
# =================================================================

version: '3.8'

services:
  # 1. Reverse Proxy & SSL Termination
  nginx:
    image: nginx:alpine
    container_name: twins_saas_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - app
    networks:
      - ${config.dockerNetwork}

  # 2. Main Full-Stack SaaS Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: twins_saas_app
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=${config.appPort}
      - APP_DOMAIN=${config.domain}
      - DB_SUPER_USER=${config.postgresSuperUser}
      - DB_SUPER_PASSWORD=\${POSTGRES_PASSWORD:-ChangeMeSecurePass2026!}
      - DB_HOST=postgres
      - DB_PORT=${config.postgresPort}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=\${JWT_SECRET:-twins_secret_jwt_token_contabo_vps_99}
    ports:
      - "127.0.0.1:${config.appPort}:${config.appPort}"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - ${config.dockerNetwork}

  # 3. Multi-Database PostgreSQL Engine (Separate DB per Company)
  postgres:
    image: postgres:16-alpine
    container_name: twins_saas_postgres
    restart: always
    environment:
      POSTGRES_USER: ${config.postgresSuperUser}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-ChangeMeSecurePass2026!}
      POSTGRES_DB: twins_master_registry
    ports:
      - "127.0.0.1:${config.postgresPort}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-multiple-databases.sh:/docker-entrypoint-initdb.d/init-multiple-databases.sh:ro
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${config.postgresSuperUser}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ${config.dockerNetwork}

  # 4. Redis Cache & Fast Session Store
  redis:
    image: redis:7-alpine
    container_name: twins_saas_redis
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - ${config.dockerNetwork}

  # 5. Let's Encrypt SSL Auto-Renew Certbot
  certbot:
    image: certbot/certbot
    container_name: twins_saas_certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"

networks:
  ${config.dockerNetwork}:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
`;
}

export function generatePostgresInitScript(tenants: CompanyTenant[]): string {
  const dbCommands = tenants.map((tenant) => {
    const dbName = tenant.databaseConfig.databaseName || `twins_db_${tenant.code.toLowerCase()}`;
    const user = tenant.databaseConfig.username || `db_user_${tenant.code.toLowerCase()}`;
    const pass = tenant.databaseConfig.password || 'SecureTenantPass2026!';
    return `
# Provisioning Isolated Database for: ${tenant.nameAr} (${tenant.code})
echo "Creating isolated database and role for [${tenant.nameAr}]..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER ${user} WITH ENCRYPTED PASSWORD '${pass}';
    CREATE DATABASE ${dbName} OWNER ${user};
    GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${user};
    \\c ${dbName}
    GRANT ALL ON SCHEMA public TO ${user};
EOSQL
`;
  }).join('\n');

  return `#!/bin/bash
set -e

# =================================================================
# Twins Elevators Multi-Tenant SaaS - Database Provisioner
# Creates isolated PostgreSQL databases for each registered company
# =================================================================

echo "Starting automated multi-tenant database provisioning..."

${dbCommands}

echo "All tenant databases successfully created and permissions granted."
`;
}

export function generateContaboDeployScript(config: ContaboVpsConfig): string {
  return `#!/bin/bash
# =================================================================
# Twins Elevators SaaS - Automated Contabo VPS Setup Script
# Run on clean Ubuntu 22.04 / 24.04 LTS VPS
# =================================================================

set -e

echo "=== [1/6] Updating Ubuntu Packages ==="
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ufw htop ca-certificates gnupg lsb-release

echo "=== [2/6] Installing Docker & Docker Compose ==="
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \\
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \\
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \\
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
fi

echo "=== [3/6] Setting Up Firewall (UFW) ==="
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "=== [4/6] Creating Application Directories ==="
mkdir -p /opt/twins-saas/backups
mkdir -p /opt/twins-saas/certbot/conf
mkdir -p /opt/twins-saas/certbot/www
cd /opt/twins-saas

echo "=== [5/6] Making Scripts Executable ==="
chmod +x ./init-multiple-databases.sh 2>/dev/null || true
chmod +x ./deploy-contabo.sh 2>/dev/null || true

echo "=== [6/6] Launching Multi-Tenant SaaS Containers ==="
docker compose pull || true
docker compose up -d --build

echo ""
echo "==================================================================="
echo "  Twins Elevators Multi-Tenant SaaS is now RUNNING on Contabo VPS!"
echo "  Server IP: ${config.vpsIp}"
echo "  Domain: https://${config.domain}"
echo "  Check container logs: docker compose logs -f"
echo "==================================================================="
`;
}

export function generateContaboEnvFile(config: ContaboVpsConfig): string {
  return `# =================================================================
# Twins Elevators Multi-Tenant SaaS - Contabo VPS .env Configuration
# =================================================================

# Server & Domain
NODE_ENV=production
PORT=${config.appPort}
APP_DOMAIN=${config.domain}
VPS_IP=${config.vpsIp}

# Master Database Superuser (for creating tenant databases)
POSTGRES_USER=${config.postgresSuperUser}
POSTGRES_PASSWORD=ContaboSecureElevatorPass2026!
POSTGRES_PORT=${config.postgresPort}
POSTGRES_MASTER_DB=twins_master_registry

# Redis Cache
REDIS_HOST=redis
REDIS_PORT=6379

# Security & Tokens
JWT_SECRET=twins_jwt_super_secret_contabo_vps_key_2026_elevators
ENCRYPTION_KEY=32_bytes_hex_key_for_encrypting_tenant_secrets

# SSL Let's Encrypt Email
SSL_EMAIL=${config.sslEmail}
`;
}

export function generateContaboNginxConfig(config: ContaboVpsConfig): string {
  return `# =================================================================
# Nginx Reverse Proxy Configuration for Contabo VPS
# Supports Subdomain & Root Domain Multi-Tenant Routing
# =================================================================

server {
    listen 80;
    server_name ${config.domain} *.${config.domain};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${config.domain} *.${config.domain};

    # SSL Certificate Paths
    ssl_certificate /etc/letsencrypt/live/${config.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${config.domain}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://app:${config.appPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
}

export function generateContaboAllInOneScript(tenants: CompanyTenant[], config: ContaboVpsConfig): string {
  const dockerCompose = generateContaboDockerCompose(tenants, config);
  const postgresInit = generatePostgresInitScript(tenants);
  const envFile = generateContaboEnvFile(config);
  const nginxConf = generateContaboNginxConfig(config);

  return `#!/bin/bash
# =================================================================
# Twins Elevators Multi-Tenant SaaS - Complete Automated Contabo Setup
# Run this on your clean Contabo VPS to auto-create /opt/twins-saas,
# write all configuration files, and launch all tenant databases!
# =================================================================
set -e

echo "=== [1/6] Preparing Application Directories in /opt/twins-saas ==="
mkdir -p /opt/twins-saas/backups
mkdir -p /opt/twins-saas/certbot/conf
mkdir -p /opt/twins-saas/certbot/www
cd /opt/twins-saas

echo "=== [2/6] Writing docker-compose.yml ==="
cat << 'EOF' > /opt/twins-saas/docker-compose.yml
${dockerCompose}
EOF

echo "=== [3/6] Writing .env File ==="
cat << 'EOF' > /opt/twins-saas/.env
${envFile}
EOF

echo "=== [4/6] Writing init-multiple-databases.sh ==="
cat << 'EOF' > /opt/twins-saas/init-multiple-databases.sh
${postgresInit}
EOF
chmod +x /opt/twins-saas/init-multiple-databases.sh

echo "=== [5/6] Writing nginx.conf ==="
cat << 'EOF' > /opt/twins-saas/nginx.conf
${nginxConf}
EOF

echo "=== [6/6] Launching Containers & Multi-Tenant Databases ==="
docker compose pull || true
docker compose up -d --build

echo ""
echo "==================================================================="
echo "  All Configuration Files Written & Containers Started!"
echo "  Twins Elevators Multi-Tenant SaaS is now RUNNING on Contabo VPS!"
echo "  Server IP: ${config.vpsIp}"
echo "  Domain: https://${config.domain}"
echo "==================================================================="
`;
}
