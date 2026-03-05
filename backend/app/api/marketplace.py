from fastapi import APIRouter, Depends, HTTPException
from app.core.auth_middleware import get_current_user
from app.core.role_middleware import RoleMiddleware
from app.services.marketplace import MarketplaceService
from typing import List, Dict, Any

router = APIRouter(prefix="/api/workspaces/{workspace_id}/marketplace", tags=["marketplace"])
marketplace_service = MarketplaceService()

@router.get("/catalog")
async def get_catalog(
    current_user = Depends(get_current_user)
):
    """
    Returns the global module catalog.
    """
    return marketplace_service.get_catalog()

@router.get("/installed")
async def get_installed_modules(
    workspace_id: str,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """
    Returns the modules installed in the specific workspace.
    """
    return marketplace_service.get_installed_modules(workspace_id)

@router.post("/install/{module_id}")
async def install_module(
    workspace_id: str,
    module_id: str,
    current_user = Depends(get_current_user),
    membership = Depends(RoleMiddleware.get_workspace_membership)
):
    """
    Installs a module into the workspace.
    """
    success = marketplace_service.install_module(workspace_id, module_id)
    if not success:
        raise HTTPException(status_code=404, detail="Module not found in catalog.")
    return {"status": "success", "module_id": module_id}
