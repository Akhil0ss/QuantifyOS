import os
import shutil
import zipfile
import json
from datetime import datetime
from typing import Dict, Any, Optional
from app.core.saas import WorkspaceManager

class PortabilityEngine:
    """
    Handles workspace export and import for system portability.
    """
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.wm = WorkspaceManager(workspace_id)

    async def export_workspace(self, export_dir: str = "/tmp/exports") -> str:
        """
        Packages the entire workspace into a zip file.
        """
        if not os.path.exists(export_dir):
            os.makedirs(export_dir)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"quantify_export_{self.workspace_id}_{timestamp}.zip"
        zip_path = os.path.join(export_dir, zip_filename)

        workspace_root = str(self.wm.root)
        
        # We zip the entire workspace folder (data + tools)
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(workspace_root):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Create arcname relative to workspace root
                    arcname = os.path.relpath(file_path, os.path.dirname(workspace_root))
                    zipf.write(file_path, arcname)

        return zip_path

    async def import_workspace(self, zip_path: str):
        """
        Extracts a workspace package and restores its structure.
        """
        if not os.path.exists(zip_path):
            raise FileNotFoundError(f"Export package not found: {zip_path}")

        # The WorkspaceManager creates the folder if it doesn't exist
        workspace_root = str(self.wm.root)
        
        # Clean existing if needed or just extract
        # Extract into the parent directory of workspaces/{id}
        extract_to = os.path.dirname(workspace_root)
        
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            zipf.extractall(extract_to)
            
        return {"status": "success", "workspace_id": self.workspace_id}

    def verify_package(self, zip_path: str) -> bool:
        """Checks if the zip contains essential files."""
        try:
            with zipfile.ZipFile(zip_path, 'r') as zipf:
                file_list = zipf.namelist()
                required_patterns = [
                    f"workspaces/{self.workspace_id}/data/capability_index.json",
                    f"workspaces/{self.workspace_id}/data/memory.db"
                ]
                return all(any(p in f for f in file_list) for p in required_patterns)
        except:
            return False
