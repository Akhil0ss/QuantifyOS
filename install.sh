#!/bin/bash

# Quantify OS V1.0 Stable - One-Command Installer
# ----------------------------------------------

echo "🚀 Initializing Quantify OS Deployment..."

# 1. Check for Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "📦 Docker not found. Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  echo "✅ Docker installed."
else
  echo "✅ Docker is already installed."
fi

# 2. Check for Docker Compose
if ! docker compose version >/dev/null 2>&1; then
  echo "📦 Docker Compose not found. Please install Docker Compose v2."
  exit 1
fi

# 3. Setup Environment
if [ ! -f .env ]; then
  echo "📝 Creating .env from template..."
  cp .env.example .env
  echo "⚠️  ACTION REQUIRED: Edit the .env file with your credentials before starting."
fi

# 4. Pull/Build and Start
echo "🏗️  Starting Quantify OS Containers..."
docker compose up -d --build

echo "----------------------------------------------"
echo "✅ Quantify OS is now deploying in the background."
echo "🖥️  Frontend: http://localhost:3000"
echo "⚙️  Backend API: http://localhost:8000"
echo "📊 Run 'docker compose logs -f' to monitor progress."
echo "----------------------------------------------"
