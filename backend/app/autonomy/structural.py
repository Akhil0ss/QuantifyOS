import os
import json
from typing import Dict, Any, List, Optional
from app.services.ai_drivers.router import ModelRouter

class StructuralEngine:
    """
    Level 6 Autonomy: Structural Autonomy Engine.
    Allows the AI to inspect, propose, and commit self-refactoring changes 
    to its own codebase.
    """
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        # We assume the codebase to self-modify is the actual backend/frontend project
        # In a real deployed environment, this might be a sandboxed repo loop
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    async def _safe_read(self, file_path: str) -> str:
        full_path = os.path.join(self.base_dir, file_path)
        if not os.path.commonpath([self.base_dir, full_path]) == self.base_dir:
            return "Error: Access denied. Path traverses outside sandbox."
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return f"Error reading file {file_path}: {e}"

    async def _safe_write(self, file_path: str, content: str) -> str:
        full_path = os.path.join(self.base_dir, file_path)
        
        # --- V1.0 STABLE ARCHITECTURE FREEZE ---
        protected_dirs = ["app/core", "app/services", "app/api", "app/autonomy", "main.py"]
        if any(file_path.startswith(p) for p in protected_dirs):
             return f"Error: Core Architecture is FROZEN. Modification to {file_path} is prohibited."
             
        if not os.path.commonpath([self.base_dir, full_path]) == self.base_dir:
            return "Error: Access denied. Path traverses outside sandbox."
        try:
            # Ensure dir exists
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return f"Successfully wrote to {file_path}."
        except Exception as e:
            return f"Error writing file {file_path}: {e}"

    async def apply_patch(self, file_path: str, patch_content: str) -> str:
        """
        Applies a simple line-by-line replacement or full write for now.
        In a more advanced version, this would use unified diffs.
        """
        return await self._safe_write(file_path, patch_content)

    async def run_tests(self, test_file: Optional[str] = None) -> Dict[str, Any]:
        """
        Runs the test suite within the backend.
        """
        import subprocess
        import sys
        try:
            cmd = [sys.executable, "-m", "pytest", "-v", "-n", "auto"] # Running in parallel for speed if available
            if test_file:
                cmd = [sys.executable, "-m", "pytest", "-v", os.path.join(self.base_dir, test_file)]
            
            env = os.environ.copy()
            env["PYTHONPATH"] = self.base_dir
            
            result = subprocess.run(
                cmd, 
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=60,
                env=env
            )
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr
            }
        except Exception as e:
            return {"success": False, "error": str(e), "output": ""}

    async def list_sandbox_dir(self, directory: str = ".") -> str:
        full_path = os.path.join(self.base_dir, directory)
        if not os.path.commonpath([self.base_dir, full_path]) == self.base_dir:
            return "Error: Access denied. Path traverses outside sandbox."
        try:
            items = os.listdir(full_path)
            # Filter out some noise
            filtered = [i for i in items if not i.startswith('__') and not i.endswith('.pyc') and i not in ['node_modules', '.git', '.next']]
            return f"Directory listing of {directory}:\n" + "\n".join(filtered)
        except Exception as e:
            return f"Error listing directory {directory}: {e}"

    def get_codebase_context(self, file_list: List[str]) -> str:
        """
        Aggregates content of multiple files for AI context.
        """
        context = ""
        for f in file_list:
            full_path = os.path.join(self.base_dir, f)
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8') as content:
                    context += f"\n--- FILE: {f} ---\n{content.read()}\n"
        return context
