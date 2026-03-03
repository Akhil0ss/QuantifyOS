from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from app.core.auth_middleware import get_current_user
from app.core.role_middleware import RoleMiddleware
from app.services.tasks import TaskService
from app.core.admin_config import system_config
from app.schemas.db_schemas import TaskCreate
from app.services.orchestrator import run_autonomy_loop
from app.services.telemetry import TelemetryService
from typing import List, Dict, Any

router = APIRouter(prefix="/api/workspaces/{workspace_id}/tasks", tags=["tasks"])
task_service = TaskService()
telemetry_service = TelemetryService()

@router.post("")
async def create_task(
    workspace_id: str, 
    task_data: TaskCreate = Body(...),
    background_tasks: BackgroundTasks = None,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """
    Creates a new task in the specified workspace.
    """
    if system_config.get("emergency_stop"):
        raise HTTPException(status_code=503, detail="System in Emergency Stop mode. All task execution is halted.")
    
    task_id = task_service.create_task(workspace_id, task_data.goal)
    
    if background_tasks:
        background_tasks.add_task(
            run_autonomy_loop,
            workspace_id=workspace_id,
            task_id=task_id,
            user_uid=current_user["uid"]
        )
        
    return {"task_id": task_id, "status": "pending"}

@router.get("")
async def list_tasks(
    workspace_id: str,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """
    Lists all tasks in the specified workspace.
    """
    return task_service.get_workspace_tasks(workspace_id)

@router.get("/{task_id}")
async def get_task(
    workspace_id: str,
    task_id: str,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """
    Retrieves details of a specific task.
    """
    task = task_service.get(task_id)
    if not task or task.get("workspace_id") != workspace_id:
        raise HTTPException(status_code=404, detail="Task not found in this workspace.")
    return task

@router.post("/{task_id}/approve")
async def approve_task(
    workspace_id: str,
    task_id: str,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """
    Approves a high-risk task and resumes execution.
    """
    task = task_service.get(task_id)
    if not task or task.get("workspace_id") != workspace_id:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    if task.get("status") != "awaiting_approval":
        raise HTTPException(status_code=400, detail="Task is not awaiting approval.")
    
    if system_config.get("emergency_stop"):
        raise HTTPException(status_code=503, detail="System in Emergency Stop mode. Cannot resume tasks.")
    
    # Update status to approved
    task_service.update_status(task_id, "approved")
    
    # Restart the autonomy loop
    background_tasks.add_task(
        run_autonomy_loop,
        workspace_id=workspace_id,
        task_id=task_id,
        user_uid=current_user["uid"]
    )
    
    return {"status": "success", "message": "Task approved. Resuming execution."}

@router.get("/{task_id}/traces")
async def get_task_traces(
    workspace_id: str,
    task_id: str,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """
    Retrieves the detailed execution trace for a task.
    """
    traces = telemetry_service.get_task_traces(workspace_id, task_id)
    return traces
