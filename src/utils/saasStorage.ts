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
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate port 5432 to 5433 so it doesn't conflict with other PostgreSQL on VPS
      const port = (parsed.postgresPort === 5432 || !parsed.postgresPort) ? 5433 : parsed.postgresPort;
      return {
        ...DEFAULT_CONTABO_CONFIG,
        ...parsed,
        postgresPort: port,
        projectDir: parsed.projectDir || '/opt/Twins-Elevators-Saas',
      };
    }
  } catch (e) {}
  return DEFAULT_CONTABO_CONFIG;
}

export function saveContaboConfig(config: ContaboVpsConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_SAAS_CONTABO, JSON.stringify(config));
  } catch (e) {}
}

// ==========================================
// Secret Direct-Link SaaS Admin Key Storage
// ==========================================
export const STORAGE_KEY_SAAS_ADMIN_KEY = 'twins_saas_admin_secret_key_v1';
export const DEFAULT_SAAS_ADMIN_KEY = 'twins2026';

export function getStoredSaaSAdminKey(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SAAS_ADMIN_KEY);
    if (stored) return stored;
  } catch (e) {}
  return DEFAULT_SAAS_ADMIN_KEY;
}

export function saveSaaSAdminKey(key: string) {
  try {
    localStorage.setItem(STORAGE_KEY_SAAS_ADMIN_KEY, key);
  } catch (e) {}
}

// ==========================================
// Encrypted Base64 SaaS Admin Token Utilities
// Obfuscates and encrypts the SaaS entry point
// ==========================================
const SAAS_TOKEN_CIPHER_SECRET = 'TWINS_ELEVATORS_SAAS_ENCRYPTED_VAULT_KEY_2026_V1';

export function computeSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function encryptPayload(text: string, key = SAAS_TOKEN_CIPHER_SECRET): string {
  const enc: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    enc.push(String.fromCharCode(charCode));
  }
  const str = enc.join('');
  try {
    const b64 = typeof btoa !== 'undefined'
      ? btoa(str)
      : Buffer.from(str, 'binary').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    const b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

export function decryptPayload(b64url: string, key = SAAS_TOKEN_CIPHER_SECRET): string | null {
  try {
    let clean = b64url.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4) {
      clean += '=';
    }
    const decoded = typeof atob !== 'undefined'
      ? atob(clean)
      : Buffer.from(clean, 'base64').toString('binary');
    const dec: string[] = [];
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      dec.push(String.fromCharCode(charCode));
    }
    return dec.join('');
  } catch {
    return null;
  }
}

export interface SaasTokenVerificationResult {
  valid: boolean;
  preAuthenticated: boolean;
}

/**
 * Generates a complex base64-encoded encrypted token for SaaS admin access.
 * Masks all obvious parameters into an encrypted URL-safe string.
 */
export function generateSaaSSecureToken(adminKey?: string): string {
  const effectiveKey = (adminKey || getStoredSaaSAdminKey()).trim();
  const payload = JSON.stringify({
    system: 'twins_elevators_saas_master',
    scope: 'cloud_infrastructure_control',
    chk: computeSimpleHash(`twins_${effectiveKey}_secret_vault_salt`),
    iat: Date.now(),
    rnd: Math.random().toString(36).substring(2, 10),
  });
  return encryptPayload(payload);
}

/**
 * Verifies the complex, base64-encoded encrypted token from URL parameters.
 * Validates the encrypted payload and checks whether the key signature matches.
 */
export function verifySaaSSecureToken(
  tokenString: string | null | undefined,
  expectedAdminKey?: string
): SaasTokenVerificationResult {
  if (!tokenString || typeof tokenString !== 'string') {
    return { valid: false, preAuthenticated: false };
  }

  const raw = tokenString.trim();
  if (raw.length < 8) {
    return { valid: false, preAuthenticated: false };
  }

  try {
    const decrypted = decryptPayload(raw);
    if (!decrypted) return { valid: false, preAuthenticated: false };

    const parsed = JSON.parse(decrypted);
    if (
      parsed &&
      parsed.system === 'twins_elevators_saas_master' &&
      parsed.scope === 'cloud_infrastructure_control'
    ) {
      const activeKey = (expectedAdminKey || getStoredSaaSAdminKey()).trim();
      const expectedChk = computeSimpleHash(`twins_${activeKey}_secret_vault_salt`);
      const keyMatches = parsed.chk === expectedChk;
      return {
        valid: true,
        preAuthenticated: keyMatches,
      };
    }
  } catch {}

  return { valid: false, preAuthenticated: false };
}

// ==========================================
// Contabo VPS & Docker Scripts Generators
// ==========================================

export function generateContaboDockerfile(): string {
  return `# =================================================================
# Twins Elevators Multi-Tenant SaaS - Production Dockerfile
# Optimized multi-stage build for Node.js 20 & Vite React SPA
# =================================================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Build the production frontend bundle (outputs to /app/dist)
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm install -g tsx

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server script and configuration
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/public ./public

# Expose app port
EXPOSE 3000

# Start production server
CMD ["tsx", "server.ts"]
`;
}

export function generateContaboDockerignore(): string {
  return `node_modules
dist
dev-dist
.git
.github
*.log
.env.local
.env.*.local
.DS_Store
backups
android
`;
}

export function generateContaboDockerCompose(tenants: CompanyTenant[], config: ContaboVpsConfig): string {
  return `# =================================================================
# Twins Elevators Multi-Tenant SaaS - Contabo VPS Deployment
# Generated for VPS IP: ${config.vpsIp} | Domain: ${config.domain}
# Main Project Directory: ${config.projectDir || '/opt/Twins-Elevators-Saas'}
# Isolated PostgreSQL Multi-Tenant Databases per Company
# =================================================================

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
  const projectDir = config.projectDir || '/opt/Twins-Elevators-Saas';
  return `#!/bin/bash
# =================================================================
# Twins Elevators SaaS - Automated Contabo VPS Setup Script
# Run on clean Ubuntu 22.04 / 24.04 LTS VPS
# Project Path: ${projectDir}
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

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
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

echo "=== [4/6] Creating Application Directories in ${projectDir} ==="
mkdir -p "${projectDir}/backups"
mkdir -p "${projectDir}/certbot/conf"
mkdir -p "${projectDir}/certbot/www"

# Handle case if lowercase directory was created previously
if [ -d "/opt/twins-elevators-saas" ] && [ "${projectDir}" != "/opt/twins-elevators-saas" ]; then
    ln -sfn "${projectDir}" /opt/twins-elevators-saas 2>/dev/null || true
fi

cd "${projectDir}"

echo "=== [5/6] Making Scripts Executable ==="
chmod +x ./init-multiple-databases.sh 2>/dev/null || true
chmod +x ./deploy-contabo.sh 2>/dev/null || true

echo "=== [6/6] Launching Multi-Tenant SaaS Containers ==="
docker compose pull postgres redis nginx certbot || true
docker compose up -d postgres redis

if [ -f "./package.json" ]; then
    docker compose up -d --build
else
    echo ">> Databases initialized. Upload project code to ${projectDir} then run: docker compose up -d --build"
fi

echo ""
echo "==================================================================="
echo "  Twins Elevators Multi-Tenant SaaS is configured on Contabo VPS!"
echo "  Directory: ${projectDir}"
echo "  Server IP: ${config.vpsIp}"
echo "  Domain: https://${config.domain}"
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
PROJECT_DIR=${config.projectDir || '/opt/Twins-Elevators-Saas'}

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
  const projectDir = config.projectDir || '/opt/Twins-Elevators-Saas';
  const dockerCompose = generateContaboDockerCompose(tenants, config);
  const dockerfile = generateContaboDockerfile();
  const dockerignore = generateContaboDockerignore();
  const postgresInit = generatePostgresInitScript(tenants);
  const envFile = generateContaboEnvFile(config);
  const nginxConf = generateContaboNginxConfig(config);

  return `#!/bin/bash
# =================================================================
# Twins Elevators Multi-Tenant SaaS - Complete Automated Contabo Setup
# Run this on your Contabo VPS to auto-create ${projectDir},
# write all configuration files & Dockerfile, and launch all tenant databases!
# =================================================================
set -e

TARGET_DIR="${projectDir}"

echo "=== [1/7] Preparing Application Directories in $TARGET_DIR ==="
mkdir -p "$TARGET_DIR/backups"
mkdir -p "$TARGET_DIR/certbot/conf"
mkdir -p "$TARGET_DIR/certbot/www"

# Handle case if lowercase directory was created or if user ran inside it
if [ -d "/opt/twins-elevators-saas" ] && [ "$TARGET_DIR" != "/opt/twins-elevators-saas" ]; then
    echo "Creating symlink /opt/twins-elevators-saas -> $TARGET_DIR"
    ln -sfn "$TARGET_DIR" /opt/twins-elevators-saas 2>/dev/null || true
fi

cd "$TARGET_DIR"

echo "=== [2/7] Writing Dockerfile & .dockerignore ==="
cat << 'EOF' > "$TARGET_DIR/Dockerfile"
${dockerfile}
EOF

cat << 'EOF' > "$TARGET_DIR/.dockerignore"
${dockerignore}
EOF

echo "=== [3/7] Writing docker-compose.yml ==="
cat << 'EOF' > "$TARGET_DIR/docker-compose.yml"
${dockerCompose}
EOF

echo "=== [4/7] Writing .env File ==="
cat << 'EOF' > "$TARGET_DIR/.env"
${envFile}
EOF

echo "=== [5/7] Writing init-multiple-databases.sh ==="
cat << 'EOF' > "$TARGET_DIR/init-multiple-databases.sh"
${postgresInit}
EOF
chmod +x "$TARGET_DIR/init-multiple-databases.sh"

echo "=== [6/7] Writing nginx.conf ==="
cat << 'EOF' > "$TARGET_DIR/nginx.conf"
${nginxConf}
EOF

echo "=== [7/7] Launching PostgreSQL (Isolated Tenant Databases) & Redis ==="
docker compose down --remove-orphans 2>/dev/null || true
docker compose pull postgres redis nginx certbot || true
docker compose up -d postgres redis

echo "Waiting for PostgreSQL to initialize all tenant databases..."
sleep 4

# Check if application source code exists
if [ -f "$TARGET_DIR/package.json" ]; then
    echo "Application source code detected. Building and starting full SaaS app container..."
    docker compose up -d --build
    echo ""
    echo "==================================================================="
    echo "  SUCCESS: Twins Elevators Multi-Tenant SaaS is RUNNING on Contabo!"
    echo "  Directory: $TARGET_DIR"
    echo "  Server IP: ${config.vpsIp}"
    echo "  Domain: https://${config.domain}"
    echo "  Databases: PostgreSQL isolated databases provisioned for all companies"
    echo "==================================================================="
else
    echo "-------------------------------------------------------------------"
    echo "  [DATABASE ENGINES READY & HEALTHY]"
    echo "  PostgreSQL has started and created isolated databases for each company."
    echo "  Redis cache and session store is running."
    echo ""
    echo "  [NEXT STEP TO START WEB APP]:"
    echo "  Upload your application source files to: $TARGET_DIR"
    echo "  Run this one command from your local terminal (e.g. Mac/PC):"
    echo "    scp -r /path/to/Twins-Elevators-Saas/* root@${config.vpsIp}:$TARGET_DIR/"
    echo "  "
    echo "  Then build and start the web application:"
    echo "    cd $TARGET_DIR && docker compose up -d --build"
    echo "-------------------------------------------------------------------"
    # Start Nginx and certbot
    docker compose up -d nginx certbot 2>/dev/null || true
fi
`;
}
