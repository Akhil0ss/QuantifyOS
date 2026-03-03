#!/bin/bash

# --- Quantify OS: Oracle 1GB Lean Setup ---
# This script prepares an Oracle Free Tier instance for S-Tier operations.

set -e

echo "🚀 Initializing Sovereign Environment (Oracle 1GB)..."

# 1. Update and Install Dependencies
sudo apt-get update
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl

# 2. Add Caddy Repository (Not in default Ubuntu 22.04)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# 3. Update & Install Docker + Caddy
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 caddy

# 4. Provision Swap Space (CRITICAL for 1GB RAM)
if [ ! -f /swapfile ]; then
    echo "💾 Creating 2GB Swap Space..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap active."
else
    echo "ℹ️ Swapfile already exists."
fi

# 5. Configure Caddy (SSL & Reverse Proxy)
echo "🔒 Configuring Caddy for Domain..."
# Note: Since we don't have a domain yet, we use :80
cat <<EOF | sudo tee /etc/caddy/Caddyfile
:80 {
    reverse_proxy localhost:8000
}
EOF

sudo systemctl restart caddy

# 6. Deployment Helper
echo "🐳 Preparing Docker deployment..."
mkdir -p ~/quantify-os/workspaces
mkdir -p ~/quantify-os/backups

echo "✨ System ready for Sovereign Deployment."
