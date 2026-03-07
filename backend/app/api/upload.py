import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.auth_middleware import get_current_user
from app.core.saas import WorkspaceManager

router = APIRouter(prefix="/api/workspaces/{workspace_id}", tags=["upload"])

@router.post("/upload")
async def upload_file(
    workspace_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Accepts file uploads and saves them to the workspace directory.
    Returns the file path so the execution engine can reference it.
    """
    wm = WorkspaceManager(workspace_id)
    uploads_dir = wm.get_path("uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Sanitize filename
    safe_name = file.filename.replace("..", "").replace("/", "_").replace("\\", "_")
    file_path = os.path.join(uploads_dir, safe_name)
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return {
        "status": "uploaded",
        "filename": safe_name,
        "path": file_path,
        "size_bytes": len(content)
    }

@router.get("/files")
async def list_workspace_files(
    workspace_id: str,
    current_user = Depends(get_current_user)
):
    """Lists all uploaded files in the workspace."""
    wm = WorkspaceManager(workspace_id)
    uploads_dir = wm.get_path("uploads")
    
    if not os.path.exists(uploads_dir):
        return {"files": []}
    
    files = []
    for f in os.listdir(uploads_dir):
        fpath = os.path.join(uploads_dir, f)
        if os.path.isfile(fpath):
            files.append({
                "name": f,
                "path": fpath,
                "size_bytes": os.path.getsize(fpath)
            })
    return {"files": files}
