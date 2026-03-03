#!/bin/bash
# sovereign_provision.sh - Optimized for Oracle Always Free 1GB

echo "🚀 Starting Sovereign Provisioning..."

# 1. Network Hardening (DNS + MTU)
echo "🌐 Applying Network Hardening..."
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
sudo mkdir -p /etc/docker
echo '{"mtu": 1300, "dns": ["8.8.8.8", "8.8.4.4"]}' | sudo tee /etc/docker/daemon.json > /dev/null

# 2. Memory Hardening (Swap)
echo "🧠 Provisioning 2GB Swap Memory..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 3. System Prep
echo "🛠️ Installing Infrastructure Bases..."
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 caddy

# 4. Restart Docker with new MTU
sudo systemctl restart docker

# 5. Launch S-Tier
echo "🚢 Launching Quantify OS S-Tier..."
cd ~/quantify-os
sudo docker compose -f docker-compose.prod.yml up --build -d

echo "✅ PROVISIONING COMPLETE!"
