"""
Workspace Backup Service for Quantify OS.
Automated backup and restore for user workspace data.
"""

import os
import json
import time
import shutil
import zipfile
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Depends
from app.core.auth_middleware import get_current_user
from app.core.saas import WorkspaceManager

router = APIRouter(prefix="/api/backups", tags=["Backups"])

BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)
MAX_BACKUPS_PER_USER = 5

class BackupService:
    """Manages workspace snapshots for data safety."""
    
    @staticmethod
    def create_backup(workspace_id: str) -> Dict:
        """Creates a compressed backup of the entire workspace."""
        ws_path = Path("workspaces") / workspace_id
        if not ws_path.exists():
            raise FileNotFoundError(f"Workspace {workspace_id} not found")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{workspace_id}_{timestamp}.zip"
        backup_path = BACKUP_DIR / backup_name
        
        # Create zip archive
        file_count = 0
        with zipfile.ZipFile(backup_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(ws_path):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(ws_path)
                    zf.write(file_path, arcname)
                    file_count += 1
        
        backup_info = {
            "id": backup_name,
            "workspace_id": workspace_id,
            "created_at": datetime.now().isoformat(),
            "size_bytes": backup_path.stat().st_size,
            "file_count": file_count,
        }
        
        # Save backup index
        BackupService._update_index(workspace_id, backup_info)
        
        # Enforce max backup limit
        BackupService._enforce_limit(workspace_id)
        
        return backup_info
    
    @staticmethod
    def restore_backup(workspace_id: str, backup_id: str) -> bool:
        """Restores a workspace from a backup archive."""
        backup_path = BACKUP_DIR / backup_id
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup {backup_id} not found")
        
        ws_path = Path("workspaces") / workspace_id
        
        # Clear current workspace data (keep structure)
        if ws_path.exists():
            shutil.rmtree(ws_path)
        ws_path.mkdir(parents=True, exist_ok=True)
        
        # Extract backup
        with zipfile.ZipFile(backup_path, "r") as zf:
            zf.extractall(ws_path)
        
        # Re-initialize workspace manager to rebuild dirs
        WorkspaceManager(workspace_id)
        return True
    
    @staticmethod
    def list_backups(workspace_id: str) -> List[Dict]:
        """Lists all backups for a workspace."""
        index = BackupService._load_index()
        return index.get(workspace_id, [])
    
    @staticmethod
    def delete_backup(backup_id: str):
        """Deletes a specific backup file."""
        backup_path = BACKUP_DIR / backup_id
        if backup_path.exists():
            backup_path.unlink()
    
    @staticmethod
    def _load_index() -> Dict:
        index_file = BACKUP_DIR / "backup_index.json"
        if index_file.exists():
            with open(index_file, "r") as f:
                return json.load(f)
        return {}
    
    @staticmethod
    def _update_index(workspace_id: str, backup_info: Dict):
        index = BackupService._load_index()
        if workspace_id not in index:
            index[workspace_id] = []
        index[workspace_id].append(backup_info)
        with open(BACKUP_DIR / "backup_index.json", "w") as f:
            json.dump(index, f, indent=2)
    
    @staticmethod
    def _enforce_limit(workspace_id: str):
        index = BackupService._load_index()
        backups = index.get(workspace_id, [])
        while len(backups) > MAX_BACKUPS_PER_USER:
            oldest = backups.pop(0)
            BackupService.delete_backup(oldest["id"])
        index[workspace_id] = backups
        with open(BACKUP_DIR / "backup_index.json", "w") as f:
            json.dump(index, f, indent=2)

# ─── API Endpoints ───

@router.post("/create")
async def create_backup(user: dict = Depends(get_current_user)):
    """Creates a backup of the user's workspace."""
    workspace_id = f"default-{user['uid'][:8]}"
    try:
        info = BackupService.create_backup(workspace_id)
        return {"status": "success", "backup": info}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/list")
async def list_backups(user: dict = Depends(get_current_user)):
    """Lists all backups for the user's workspace."""
    workspace_id = f"default-{user['uid'][:8]}"
    return BackupService.list_backups(workspace_id)

@router.post("/restore")
async def restore_backup(request_body: dict, user: dict = Depends(get_current_user)):
    """Restores the user's workspace from a backup."""
    backup_id = request_body.get("backup_id")
    if not backup_id:
        raise HTTPException(status_code=400, detail="backup_id required.")
    workspace_id = f"default-{user['uid'][:8]}"
    try:
        BackupService.restore_backup(workspace_id, backup_id)
        return {"status": "restored", "backup_id": backup_id}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
