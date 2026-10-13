#!/bin/bash
# =================================================================
# Twins Elevators Multi-Tenant SaaS - Contabo VPS One-Click Deploy
# Supported OS: Ubuntu 20.04 / 22.04 / 24.04 LTS
# Target Directory: /opt/Twins-Elevators-Saas or current directory
# =================================================================

set -e

echo "================================================================="
echo "   🚀 Starting Deployment of Twins Elevators SaaS on Contabo VPS"
echo "================================================================="

# Determine project directory
PROJECT_DIR="${1:-/opt/Twins-Elevators-Saas}"

echo "[1/6] Installing Essential Packages & Dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl wget git ufw htop ca-certificates gnupg lsb-release

echo "[2/6] Checking and Installing Docker Engine & Compose..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
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

echo "[3/6] Setting Up Security Firewall (UFW)..."
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw --force enable || true

echo "[4/6] Setting Up Project Directories..."
mkdir -p "$PROJECT_DIR/backups"
mkdir -p "$PROJECT_DIR/certbot/conf"
mkdir -p "$PROJECT_DIR/certbot/www"

# If current directory is not PROJECT_DIR, copy files
if [ "$(pwd)" != "$PROJECT_DIR" ]; then
    echo "Syncing project files to $PROJECT_DIR..."
    sudo cp -ru ./* "$PROJECT_DIR/" 2>/dev/null || true
    cd "$PROJECT_DIR"
fi

# Create .env if not exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "Generating production .env file..."
    cat << 'EOF' > "$PROJECT_DIR/.env"
PORT=3000
APP_DOMAIN=localhost
POSTGRES_USER=twins_admin
POSTGRES_PASSWORD=ContaboSecureElevatorPass2026!
POSTGRES_DB=twins_master_registry
POSTGRES_PORT=5433
JWT_SECRET=twins_jwt_super_secret_contabo_vps_key_2026_elevators
REDIS_HOST=redis
REDIS_PORT=6379
GEMINI_API_KEY=
EOF
fi

echo "[5/6] Making Scripts Executable..."
chmod +x "$PROJECT_DIR/init-multiple-databases.sh" || true
chmod +x "$PROJECT_DIR/deploy-contabo.sh" || true

echo "[6/6] Building and Launching Docker Containers..."
cd "$PROJECT_DIR"
docker compose down --remove-orphans 2>/dev/null || true
docker compose pull postgres redis nginx certbot || true
docker compose up -d --build

echo ""
echo "================================================================="
echo "   ✅ DEPLOYMENT COMPLETE! Twins Elevators SaaS is Live in Docker"
echo "================================================================="
echo "   Project Directory : $PROJECT_DIR"
echo "   Web App           : http://YOUR_VPS_IP or http://localhost"
echo "   PostgreSQL        : Port 5433 (Isolated tenant databases ready)"
echo "   Redis             : Port 6379 (Active)"
echo "   Container Status  :"
docker compose ps
echo "================================================================="
