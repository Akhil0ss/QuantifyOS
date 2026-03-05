"""
Deploy Webhook — Triggered by GitHub Actions to auto-deploy backend.
Replaces SSH-based deploy (which fails due to Oracle firewall/iptables blocking port 22).
"""

import os
import subprocess
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException

router = APIRouter()

DEPLOY_SECRET = os.getenv("DEPLOY_SECRET", "")


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify HMAC-SHA256 signature from GitHub/CI."""
    if not DEPLOY_SECRET:
        return False
    expected = "sha256=" + hmac.new(
        DEPLOY_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/api/deploy/webhook")
async def deploy_webhook(request: Request):
    """Pull latest code and rebuild Docker containers."""
    # Verify the deploy secret
    signature = request.headers.get("X-Deploy-Signature", "")
    body = await request.body()

    if not verify_signature(body, signature):
        # Fallback: check simple token header
        token = request.headers.get("X-Deploy-Token", "")
        if not DEPLOY_SECRET or token != DEPLOY_SECRET:
            raise HTTPException(status_code=403, detail="Invalid deploy token")

    # Run deploy commands
    project_dir = os.path.expanduser("~/quantify-os")
    try:
        # Git pull
        result_pull = subprocess.run(
            ["git", "pull", "origin", "main"],
            cwd=project_dir,
            capture_output=True, text=True, timeout=60
        )

        # Docker compose rebuild
        result_build = subprocess.run(
            ["sudo", "docker", "compose", "-f", "docker-compose.prod.yml", "up", "--build", "-d"],
            cwd=project_dir,
            capture_output=True, text=True, timeout=600
        )

        # Prune old images
        subprocess.run(
            ["sudo", "docker", "image", "prune", "-f"],
            cwd=project_dir,
            capture_output=True, text=True, timeout=30
        )

        return {
            "status": "success",
            "git_pull": result_pull.stdout.strip() or result_pull.stderr.strip(),
            "docker_build": "started" if result_build.returncode == 0 else result_build.stderr.strip()[:200]
        }

    except subprocess.TimeoutExpired:
        return {"status": "timeout", "message": "Deploy command timed out but may still be running"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
