#!/bin/bash

# --- Quantify OS: Oracle 1GB Lean Setup ---
# This script prepares an Oracle Free Tier instance for S-Tier operations.

set -e

echo "🚀 Initializing Sovereign Environment (Oracle 1GB)..."

# 1. Update and Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose caddy

# 2. Provision Swap Space (CRITICAL for 1GB RAM)
if [ ! -f /swapfile ]; then
    echo "💾 Creating 2GB Swap Space..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap active."
fi

# 3. Configure Caddy (SSL & Reverse Proxy)
echo "🔒 Configuring Caddy for Domain..."
# Note: User must replace 'your-domain.com' with their actual domain/IP
cat <<EOF | sudo tee /etc/caddy/Caddyfile
:80 {
    reverse_proxy localhost:8000
}
EOF

sudo systemctl restart caddy

# 4. Deployment Helper
echo "🐳 Preparing Docker deployment..."
# The CI/CD pipeline will handle the 'docker-compose up' via SSH
# but this script ensures the directories and permissions are ready.

mkdir -p ~/quantify-os/workspaces
mkdir -p ~/quantify-os/backups

echo "✨ System ready for Sovereign Deployment."
