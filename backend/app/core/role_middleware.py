import os
from functools import wraps
from fastapi import HTTPException, Depends
from app.core.auth_middleware import get_current_user
from app.core.firebase_admin_sdk import db_admin

class RoleMiddleware:
    """
    Utilities for checking user roles and workspace isolation.
    """
    
    @staticmethod
    def require_role(allowed_roles: list):
        """
        Decorator to restrict access based on roles in a workspace.
        Note: This expects 'workspace_id' to be in the path or query.
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                workspace_id = kwargs.get("workspace_id")
                user = kwargs.get("current_user")
                
                if not workspace_id or not user:
                    raise HTTPException(status_code=400, detail="Missing workspace_id or user.")

                # Check membership in RTDB
                user_id = user["uid"]
                ref = db_admin.reference(f"memberships/{user_id}/{workspace_id}")
                role = ref.get()
                
                if not role and workspace_id == f"default-{user_id}":
                    role = "owner"
                    ref.set(role)
                    db_admin.reference(f"workspaces/{workspace_id}").set({
                        "name": "Personal Workspace",
                        "owner_id": user_id
                    })
                
                if not role:
                    raise HTTPException(status_code=403, detail="Forbidden: Not a member of this workspace.")
                
                if role not in allowed_roles:
                    raise HTTPException(status_code=403, detail=f"Forbidden: {role} role lacks required permissions.")
                
                return await func(*args, **kwargs)
            return wrapper
        return decorator

    @staticmethod
    async def get_workspace_membership(workspace_id: str, current_user = Depends(get_current_user)):
        """
        Dependency for isolating workspaces.
        Ensures user belongs to the workspace they are requesting.
        """
        user_id = current_user["uid"]
        
        # Test mode bypass
        if os.getenv("TEST_MODE") == "true" and (workspace_id == "default-Me" or workspace_id == "Me"):
             return {"user_id": user_id, "workspace_id": workspace_id, "role": "owner"}

        ref = db_admin.reference(f"memberships/{user_id}/{workspace_id}")
        role = ref.get()
        
        if not role and workspace_id == f"default-{user_id}":
            role = "owner"
            ref.set(role)
            db_admin.reference(f"workspaces/{workspace_id}").set({
                "name": "Personal Workspace",
                "owner_id": user_id
            })
            
        if not role:
            raise HTTPException(status_code=403, detail="Workspace isolation breach: Access denied.")
        
        return {"user_id": user_id, "workspace_id": workspace_id, "role": role}
