# 🚀 Deployment Guide

This guide will walk you through deploying Quantify OS V1.0 Stable on a new server.

## 1. Prerequisites
Before you begin, ensure you have the following installed on your server:
- **Docker** and **Docker Compose** (V2 recommended)
- **Git** (for cloning the repository)
- **Firebase Project**: A service account key (JSON) and your Realtime Database URL.

## 2. One-Command Installation
We provide an automated installer for rapid setup.
1. Clone the Quantify OS repository.
2. Run the installer:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
This script will check for Docker, create your `.env` file from the template, and start the containers.

## 3. Environment Configuration
Open the `.env` file and fill in your credentials:
- **`FIREBASE_SERVICE_ACCOUNT_JSON`**: Path to your Firebase JSON key.
- **`FIREBASE_DATABASE_URL`**: Your RTDB URL.
- **`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`**: Set these to enable the AI's reasoning capabilities.

## 4. Manual Start/Stop
You can control the system manually using Docker Compose:
- **Start**: `docker compose up -d`
- **Stop**: `docker compose down`
- **Logs**: `docker compose logs -f`
- **Rebuild**: `docker compose up -d --build`

## 5. Security Recommendations
- **Firewall**: Ensure only ports `3000` (Frontend) and `8000` (Backend API) are exposed.
- **API Keys**: We recommend using a secrets manager or restricting your AI API keys to the server's IP address.
- **Backups**: Periodically back up the `workspaces/` and `backups/` directories to off-site storage.

---
**Congratulations!** You have successfully deployed Quantify OS. Head over to the [Quick Start Guide](quick_start.md) to begin your autonomous journey.
