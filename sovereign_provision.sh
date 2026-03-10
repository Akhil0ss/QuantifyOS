#!/bin/bash
# sovereign_provision.sh - Optimized for Oracle Always Free 1GB

echo "🚀 Starting Sovereign Provisioning..."

# 1. Network Hardening (DNS + MTU)
echo "🌐 Applying Network Hardening..."
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
sudo mkdir -p /etc/docker
echo '{"mtu": 1300, "dns": ["8.8.8.8", "8.8.4.4"]}' | sudo tee /etc/docker/daemon.json > /dev/null

# 2. Memory Hardening (Swap + OOM)
echo "🧠 Provisioning 2GB Swap & OOM Protections..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi
# Prevent kernel from killing Docker during spikes (prioritize system stability)
sudo sysctl -w vm.overcommit_memory=1
sudo sysctl -w vm.swappiness=10

# 3. Firewall Hardening (Oracle Specific)
echo "🛡️ Opening Ports 80/443 in iptables..."
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
# Persist Rules
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

# 3. System Prep
echo "🛠️ Installing Infrastructure Bases..."
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 caddy

# 4. Restart Docker with new MTU
sudo systemctl restart docker

# 5. Configure Caddy (Multi-Service Proxy)
echo "🔒 Configuring Caddy for Frontend & Backend..."
cat <<EOF | sudo tee /etc/caddy/Caddyfile
:80 {
    # Main Frontend
    reverse_proxy localhost:3000

    # Backend API
    handle_path /api/* {
        reverse_proxy localhost:8000
    }

    # Admin Panel
    handle_path /admin/* {
        reverse_proxy localhost:3001
    }
}
EOF
sudo systemctl restart caddy

# 6. Launch S-Tier
echo "🚢 Launching Quantify OS S-Tier..."
cd ~/quantify-os
# Ensure env file exists
if [ ! -f ./backend/.env ]; then
    cp .env.example ./backend/.env
fi
sudo docker compose -f docker-compose.prod.yml up --build -d backend

echo "✅ PROVISIONING COMPLETE!"
echo "🌍 App live at: http://$(curl -s ifconfig.me)"
