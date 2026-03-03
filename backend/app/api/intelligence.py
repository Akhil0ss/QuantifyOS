from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.autonomy.intelligence import IntelligenceEngine
from app.core.auth_middleware import get_current_user

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence Measurement"])

@router.get("/status")
async def get_intelligence_status(workspace_id: str, user = Depends(get_current_user)):
    """
    Returns real-time intelligence score, growth metrics, and success trends.
    """
    engine = IntelligenceEngine(workspace_id)
    return engine.get_intelligence_status()

@router.get("/metrics")
async def get_raw_metrics(workspace_id: str, user = Depends(get_current_user)):
    """
    Returns raw performance data (success rates, execution times).
    """
    engine = IntelligenceEngine(workspace_id)
    return engine._get_metrics()
