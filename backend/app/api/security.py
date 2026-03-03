from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.core.security import SecurityEngine
from app.core.auth_middleware import get_current_user

router = APIRouter(prefix="/api/security", tags=["Security & Trust"])

@router.get("/status")
async def get_security_status(workspace_id: str, user = Depends(get_current_user)):
    """
    Returns real-time security health and autonomous trust metrics.
    """
    engine = SecurityEngine(workspace_id)
    return engine.get_security_status()

@router.post("/grant")
async def grant_permission(workspace_id: str, capability: str, user = Depends(get_current_user)):
    """
    Allows an admin to manually grant evolution permissions.
    In a real system, this would require high-level admin role.
    """
    # Placeholder for permission persistence logic
    return {"message": f"Permission for '{capability}' requested for {workspace_id}."}
