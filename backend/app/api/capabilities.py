"""
Capability API — Status, guarantee execution, and management.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from app.core.auth_middleware import get_current_user
from app.autonomy.capability_engine import CapabilityManager, CapabilityStatus
from app.core.saas import WorkspaceManager
import json, os

router = APIRouter(prefix="/api/capabilities", tags=["Capabilities"])

@router.get("/status")
async def get_capabilities_status(
    current_user=Depends(get_current_user)
):
    """Returns all capabilities with their lifecycle status."""
    workspace_id = f"default-{current_user['uid']}"
    cap_mgr = CapabilityManager(workspace_id)
    index = cap_mgr._load_index()
    
    summary = {
        "total": len(index),
        "working": sum(1 for v in index.values() if v.get("status") == CapabilityStatus.WORKING),
        "failed": sum(1 for v in index.values() if v.get("status") == CapabilityStatus.FAILED),
        "testing": sum(1 for v in index.values() if v.get("status") == CapabilityStatus.TESTING),
        "draft": sum(1 for v in index.values() if v.get("status") == CapabilityStatus.DRAFT),
    }
    
    return {"summary": summary, "capabilities": index}

@router.get("/dependencies")
async def get_dependencies(
    current_user=Depends(get_current_user)
):
    """Returns all capability dependencies."""
    workspace_id = f"default-{current_user['uid']}"
    cap_mgr = CapabilityManager(workspace_id)
    return cap_mgr._load_deps()

@router.get("/working")
async def get_working_capabilities(
    current_user=Depends(get_current_user)
):
    """Returns only capabilities with 'working' status — ready to use."""
    workspace_id = f"default-{current_user['uid']}"
    cap_mgr = CapabilityManager(workspace_id)
    working = cap_mgr.get_working_capabilities()
    return {"count": len(working), "capabilities": working}

@router.post("/guarantee")
async def guarantee_capability(
    request: Request,
    current_user=Depends(get_current_user)
):
    """
    EXECUTION GUARANTEE: Ensures a capability exists for the given task.
    Never returns 'capability missing'.
    Generates, installs dependencies, tests, and auto-fixes if needed.
    """
    body = await request.json()
    task_goal = body.get("goal", "")
    
    if not task_goal:
        raise HTTPException(status_code=400, detail="'goal' is required.")
    
    workspace_id = f"default-{current_user['uid']}"
    
    # Read AI config from user's saved settings (RTDB) — synced with Settings UI
    from app.services.entities import ConfigService
    config_service = ConfigService()
    saved_config = config_service.get_ai_config(current_user["uid"])
    
    if saved_config and saved_config.get("provider"):
        provider_config = {
            "mode": saved_config.get("mode", "api"),
            "provider": saved_config.get("provider", "openai"),
            "model_name": saved_config.get("model_name", "gpt-4o"),
            "api_key": saved_config.get("api_key", ""),
            "local_url": saved_config.get("local_url", "http://localhost:11434"),
        }
    else:
        # Fallback: check workspace file, then defaults
        wm = WorkspaceManager(workspace_id)
        config_path = wm.get_path("provider_config.json")
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                provider_config = json.load(f)
        else:
            provider_config = {"provider": "openai", "model": "gpt-4o"}
    
    from app.autonomy.capability_engine import ExecutionGuaranteeEngine
    engine = ExecutionGuaranteeEngine(provider_config, current_user["uid"], workspace_id)
    result = await engine.ensure_and_execute(task_goal)
    
    return result
