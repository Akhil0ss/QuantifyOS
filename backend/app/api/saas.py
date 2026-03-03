from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import Dict, Any, List
from app.core.saas import SaaSController, WorkspaceManager
from app.core.auth_middleware import get_current_user
from app.core.portability import PortabilityEngine
import os
import shutil

router = APIRouter(prefix="/api/saas", tags=["SaaS Scaling"])

@router.get("/status")
async def get_saas_status(user = Depends(get_current_user)):
    """
    Returns system-wide SaaS reliability and scaling metrics.
    """
    controller = SaaSController()
    metrics = controller.get_global_metrics()
    
    # Add platform stability context
    return {
        "platform_status": "operational",
        "scaling_layer": "autonomous_v13",
        "active_workspaces": metrics["active_workspaces"],
        "total_load_tasks": metrics["total_tasks"],
        "total_active_agents": metrics["active_agents"],
        "isolation_protocol": "strict_folder_base"
    }

@router.get("/workspace/usage")
async def get_workspace_usage(workspace_id: str, user = Depends(get_current_user)):
    """
    Returns specific resource usage for a workspace.
    """
    controller = SaaSController()
    usage = controller.get_usage(workspace_id)
    limits = controller.get_limits(workspace_id)
    
    return {
        "workspace_id": workspace_id,
        "usage": usage,
        "limits": limits,
        "health": "throttled" if usage["tasks_this_hour"] >= limits["max_tasks_per_hour"] else "optimal"
    }

@router.get("/export/{workspace_id}")
async def export_workspace(workspace_id: str, user = Depends(get_current_user)):
    """
    Exports the entire workspace as a zip file.
    """
    engine = PortabilityEngine(workspace_id)
    try:
        # Save to a temporary location
        temp_dir = os.path.join(os.getcwd(), "temp_exports")
        zip_path = await engine.export_workspace(temp_dir)
        return FileResponse(zip_path, media_type="application/zip", filename=os.path.basename(zip_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import/{workspace_id}")
async def import_workspace(workspace_id: str, file: UploadFile = File(...), user = Depends(get_current_user)):
    """
    Imports a workspace from a zip package.
    """
    # Save uploaded file
    temp_path = f"temp_import_{workspace_id}.zip"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    engine = PortabilityEngine(workspace_id)
    try:
        if not engine.verify_package(temp_path):
            raise Exception("Invalid export package. Essential files missing.")
            
        result = await engine.import_workspace(temp_path)
        os.remove(temp_path)
        return result
    except Exception as e:
        if os.path.exists(temp_path): os.remove(temp_path)
        raise HTTPException(status_code=400, detail=str(e))
