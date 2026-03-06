"""
Workspace Backup Service for Quantify OS.
Local backup of user configs and workspace metadata to Firebase RTDB.
Backs up: AI config, memory config, business config, wallet settings,
autonomy preferences — everything from the Settings menu.
"""

import json
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from app.core.auth_middleware import get_current_user
from app.services.base_rtdb import BaseRTDBService
from app.services.entities import ConfigService
from app.services.wallet import WalletService
from app.services.users import UserService

router = APIRouter(prefix="/api/backups", tags=["Backups"])

MAX_BACKUPS_PER_USER = 5
backup_store = BaseRTDBService("backups")
config_service = ConfigService()
wallet_service = WalletService()
user_service = UserService()


class BackupService:
    """Manages workspace config snapshots stored in Firebase RTDB."""

    @staticmethod
    def create_backup(user_id: str) -> Dict:
        """Creates a backup snapshot of all user settings and configs."""
        
        # Collect all user settings data
        ai_config = config_service.get_ai_config(user_id) or {}
        memory_config = config_service.get_memory_config(user_id) or {}
        business_config = config_service.get_business_config(user_id) or {}
        wallet_settings = wallet_service.get_settings(user_id) or {}
        autonomy_prefs = user_service.get_autonomy_preferences(user_id) or {}
        wallet_balance = wallet_service.get_balance(user_id)
        
        timestamp = datetime.now().isoformat()
        backup_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_data = {
            "id": backup_id,
            "user_id": user_id,
            "created_at": timestamp,
            "snapshot": {
                "ai_config": ai_config,
                "memory_config": memory_config,
                "business_config": business_config,
                "wallet_settings": wallet_settings,
                "wallet_balance": wallet_balance,
                "autonomy_preferences": autonomy_prefs,
            },
            "item_count": sum(1 for v in [ai_config, memory_config, business_config, wallet_settings, autonomy_prefs] if v),
            "size_bytes": len(json.dumps({
                "ai_config": ai_config,
                "memory_config": memory_config,
                "business_config": business_config,
                "wallet_settings": wallet_settings,
                "autonomy_preferences": autonomy_prefs,
            }).encode()),
        }
        
        # Save to RTDB under backups/{user_id}/{backup_id}
        backup_store.db.reference(f"backups/{user_id}/{backup_id}").set(backup_data)
        
        # Enforce max backup limit
        BackupService._enforce_limit(user_id)
        
        return {
            "id": backup_id,
            "workspace_id": f"default-{user_id}",
            "created_at": timestamp,
            "size_bytes": backup_data["size_bytes"],
            "file_count": backup_data["item_count"],
        }

    @staticmethod
    def restore_backup(user_id: str, backup_id: str) -> bool:
        """Restores user settings from a backup snapshot."""
        backup_ref = backup_store.db.reference(f"backups/{user_id}/{backup_id}")
        backup_data = backup_ref.get()
        
        if not backup_data or "snapshot" not in backup_data:
            raise FileNotFoundError(f"Backup {backup_id} not found")
        
        snapshot = backup_data["snapshot"]
        
        # Restore AI config
        if snapshot.get("ai_config"):
            from app.schemas.db_schemas import AIConfigBase
            ai_data = snapshot["ai_config"]
            ai_data["user_id"] = user_id
            try:
                ai_config = AIConfigBase(**ai_data)
                config_service.set_ai_config(ai_config)
            except Exception:
                # Direct set if schema validation fails (legacy data)
                config_service.ai_configs.set(ai_data, user_id)
        
        # Restore memory config
        if snapshot.get("memory_config"):
            from app.schemas.db_schemas import MemoryConfigBase
            mem_data = snapshot["memory_config"]
            mem_data["user_id"] = user_id
            try:
                mem_config = MemoryConfigBase(**mem_data)
                config_service.set_memory_config(mem_config)
            except Exception:
                config_service.memory_configs.set(mem_data, user_id)
        
        # Restore business config
        if snapshot.get("business_config"):
            from app.schemas.db_schemas import BusinessConfigBase
            biz_data = snapshot["business_config"]
            biz_data["user_id"] = user_id
            try:
                biz_config = BusinessConfigBase(**biz_data)
                config_service.set_business_config(biz_config)
            except Exception:
                config_service.business_configs.set(biz_data, user_id)
        
        # Restore wallet settings
        if snapshot.get("wallet_settings"):
            ws = snapshot["wallet_settings"]
            wallet_service.set_spend_authorization(
                user_id,
                ws.get("authorized", False),
                ws.get("spend_limit", 0),
                ws.get("daily_cap", 100.0)
            )
        
        # Restore autonomy preferences
        if snapshot.get("autonomy_preferences"):
            user_service.update_autonomy_preferences(user_id, snapshot["autonomy_preferences"])
        
        return True

    @staticmethod
    def list_backups(user_id: str) -> List[Dict]:
        """Lists all backups for a user."""
        all_backups = backup_store.db.reference(f"backups/{user_id}").get() or {}
        
        result = []
        for bid, bdata in all_backups.items():
            result.append({
                "id": bdata.get("id", bid),
                "workspace_id": f"default-{user_id}",
                "created_at": bdata.get("created_at", ""),
                "size_bytes": bdata.get("size_bytes", 0),
                "file_count": bdata.get("item_count", 0),
            })
        
        # Sort by date, newest first
        result.sort(key=lambda x: x["created_at"], reverse=True)
        return result

    @staticmethod
    def delete_backup(user_id: str, backup_id: str):
        """Deletes a specific backup from RTDB."""
        backup_store.db.reference(f"backups/{user_id}/{backup_id}").delete()

    @staticmethod
    def _enforce_limit(user_id: str):
        """Keeps only the latest MAX_BACKUPS_PER_USER backups."""
        all_backups = backup_store.db.reference(f"backups/{user_id}").get() or {}
        
        if len(all_backups) <= MAX_BACKUPS_PER_USER:
            return
        
        # Sort by created_at, delete oldest
        sorted_backups = sorted(
            all_backups.items(),
            key=lambda x: x[1].get("created_at", ""),
            reverse=True
        )
        
        for bid, bdata in sorted_backups[MAX_BACKUPS_PER_USER:]:
            backup_store.db.reference(f"backups/{user_id}/{bid}").delete()


# ─── API Endpoints ───

@router.post("/create")
async def create_backup(user: dict = Depends(get_current_user)):
    """Creates a backup of the user's settings and configs."""
    user_id = user["uid"]
    try:
        info = BackupService.create_backup(user_id)
        return {"status": "success", "backup": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_backups(user: dict = Depends(get_current_user)):
    """Lists all backups for the user."""
    user_id = user["uid"]
    return BackupService.list_backups(user_id)

@router.post("/restore")
async def restore_backup(request_body: dict, user: dict = Depends(get_current_user)):
    """Restores the user's settings from a backup."""
    backup_id = request_body.get("backup_id")
    if not backup_id:
        raise HTTPException(status_code=400, detail="backup_id required.")
    user_id = user["uid"]
    try:
        BackupService.restore_backup(user_id, backup_id)
        return {"status": "restored", "backup_id": backup_id}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
