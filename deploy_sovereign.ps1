# deploy_sovereign.ps1
param (
    [Parameter(Mandatory=$true)]
    [string]$IP,
    [string]$KeyFile = "ssh-key-2026-03-03.key"
)

Write-Host "QUANTIFY OS: SOVEREIGN DEPLOYMENT STARTING"

# 1. Create Project Bundle
Write-Host "Step 1: Packaging project files..."
tar --exclude="node_modules" --exclude=".next" --exclude=".git" -czf project.tar.gz .

# 2. Upload to Oracle
Write-Host "Step 2: Uploading Project to $IP..."
scp -i $KeyFile project.tar.gz "ubuntu@$($IP):~/"

# 3. Server Activation
Write-Host "Step 3: Hardening Network & Activating S-Tier on Oracle..."
$RemoteCmd = "mkdir -p ~/quantify-os ; tar -xzf ~/project.tar.gz -C ~/quantify-os ; chmod +x ~/quantify-os/sovereign_provision.sh ; ~/quantify-os/sovereign_provision.sh"

ssh -i $KeyFile ubuntu@$IP $RemoteCmd

Write-Host "DEPLOYMENT INITIATED!"
Write-Host "Check status at: http://$IP/api/health"
