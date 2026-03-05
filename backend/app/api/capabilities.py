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
    
    workspace_id = f"default-{current_user['uid'][:8]}"
    
    # Get provider config from user's workspace
    wm = WorkspaceManager(workspace_id)
    config_path = wm.get_path("provider_config.json")
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            provider_config = json.load(f)
    else:
        provider_config = {"provider": "openai", "model": "gpt-4"}
    
    from app.autonomy.capability_engine import ExecutionGuaranteeEngine
    engine = ExecutionGuaranteeEngine(provider_config, current_user["uid"], workspace_id)
    result = await engine.ensure_and_execute(task_goal)
    
    return result
