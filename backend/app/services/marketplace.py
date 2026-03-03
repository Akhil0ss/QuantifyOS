from typing import List, Dict, Any
import json
import os
import uuid
from app.services.base_rtdb import BaseRTDBService

class MarketplaceService(BaseRTDBService):
    """
    Manages the global marketplace of available AI modules and tools.
    Also handles workspace-level installations.
    """
    def __init__(self):
        super().__init__("marketplace") # Not really used for global static list, but useful for DB state
        
        self.catalog = []
        try:
            # Force Uvicorn to reload and pick up the json file
            catalog_path = os.path.join(os.path.dirname(__file__), "marketplace_catalog.json")
            with open(catalog_path, "r", encoding="utf-8") as f:
                self.catalog = json.load(f)
        except Exception as e:
            print(f"Failed to load marketplace catalog: {e}")
            self.catalog = []

    def get_catalog(self) -> List[Dict[str, Any]]:
        return self.catalog

    def install_module(self, workspace_id: str, module_id: str) -> bool:
        """
        Installs a module to the workspace.
        State stored in /workspaces/{workspace_id}/installed_modules
        """
        module = next((m for m in self.catalog if m["id"] == module_id), None)
        if not module:
            return False
            
        # We use the BaseRTDBService to access the root but we want to write to workspace
        install_ref = self.db.reference(f"workspaces/{workspace_id}/installed_modules/{module_id}")
        install_ref.set({
            "installed_at": {".sv": "timestamp"},
            "name": module["name"],
            "type": module["type"]
        })
        return True

    def get_installed_modules(self, workspace_id: str) -> List[Dict[str, Any]]:
        install_ref = self.db.reference(f"workspaces/{workspace_id}/installed_modules")
        installed = install_ref.get()
        if not installed:
            return []
            
        # Enrich with catalog details
        result = []
        for mod_id, data in installed.items():
            catalog_item = next((m for m in self.catalog if m["id"] == mod_id), None)
            if catalog_item:
                enriched = {**catalog_item, **data}
                result.append(enriched)
            else:
                result.append({"id": mod_id, **data})
                
        return result
