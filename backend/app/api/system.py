from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.autonomy.stability import StabilityEngine
from app.core.auth_middleware import get_current_user

router = APIRouter(prefix="/api/system", tags=["System Stability"])

@router.get("/health")
async def get_system_health(user = Depends(get_current_user)):
    """
    Returns real-time system health and stability metrics.
    """
    engine = StabilityEngine()
    return engine.get_health_metrics()

@router.post("/backup")
async def trigger_manual_backup(user = Depends(get_current_user)):
    """
    Triggers an immediate system backup.
    """
    engine = StabilityEngine()
    path = engine.perform_backup()
    return {"message": "Backup triggered successfully", "path": path}
