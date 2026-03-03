import os
import secrets
from fastapi import HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .firebase_admin_sdk import auth_admin
from .admin_config import system_config

security = HTTPBearer()

# ────────────────────────────────────────────────────────
# SECURITY: Per-boot random test token (never hardcoded)
# This is only used in development mode and changes every restart.
# ────────────────────────────────────────────────────────
_DEV_TEST_TOKEN = secrets.token_urlsafe(32)


def get_dev_test_token() -> str:
    """Returns the per-boot test token for development use only."""
    return _DEV_TEST_TOKEN


async def get_current_user(res: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifies the Firebase ID token in the Authorization header.
    Returns the decoded token (which contains user info).
    """
    token = res.credentials
    env = os.environ.get("QUANTIFY_ENV", "production")

    # ── SECURITY: Test mode bypass ──
    # Only allowed when ALL conditions are met:
    #   1. QUANTIFY_ENV is NOT "production"
    #   2. TEST_MODE is "true"
    #   3. Token matches the per-boot random secret (NOT a hardcoded string)
    if (
        env != "production"
        and os.getenv("TEST_MODE") == "true"
        and token == _DEV_TEST_TOKEN
    ):
        return {"uid": "Me", "email": "test@example.com"}

    try:
        decoded_token = auth_admin.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}"
        )

async def get_current_owner(user = Depends(get_current_user)):
    """
    Ensures the current user has the owner email defined in system_config.
    """
    owner_email = system_config.get("owner_email")
    if user.get("email") != owner_email:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the system owner can access this resource."
        )
    return user
