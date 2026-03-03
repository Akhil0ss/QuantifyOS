import os
from typing import Dict, Any, List
from app.core.tool_engine import Tool as BaseTool

class ReadFileTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="structural_read_file",
            description="Reads a file from the project directory. Provide the relative path (e.g., 'backend/main.py')",
            parameters={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"}
                },
                "required": ["file_path"]
            }
        )

    async def run(self, **kwargs) -> Dict[str, Any]:
        workspace_id = kwargs.get("workspace_id", "default")
        from app.autonomy.structural import StructuralEngine
        engine = StructuralEngine(workspace_id)
        content = await engine._safe_read(kwargs.get("file_path"))
        return {
            "status": "success" if not content.startswith("Error") else "error",
            "content": content
        }

class WriteFileTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="structural_write_file",
            description="Writes content to a file in the project directory. Provide the relative path and full file content.",
            parameters={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"},
                    "content": {"type": "string"}
                },
                "required": ["file_path", "content"]
            }
        )

    async def run(self, **kwargs) -> Dict[str, Any]:
        workspace_id = kwargs.get("workspace_id", "default")
        from app.autonomy.structural import StructuralEngine
        engine = StructuralEngine(workspace_id)
        result = await engine._safe_write(kwargs.get("file_path"), kwargs.get("content"))
        return {
            "status": "success" if "Successfully" in result else "error",
            "content": result
        }

class ListDirTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="structural_list_dir",
            description="Lists files in a project directory relative path (e.g., 'backend/app' or '.')",
            parameters={
                "type": "object",
                "properties": {
                    "directory_path": {"type": "string"}
                },
                "required": ["directory_path"]
            }
        )

    async def run(self, **kwargs) -> Dict[str, Any]:
        workspace_id = kwargs.get("workspace_id", "default")
        from app.autonomy.structural import StructuralEngine
        engine = StructuralEngine(workspace_id)
        result = await engine.list_sandbox_dir(kwargs.get("directory_path", "."))
        return {
            "status": "success" if not result.startswith("Error") else "error",
            "content": result
        }

STRUCTURAL_TOOLS = [ReadFileTool(), WriteFileTool(), ListDirTool()]
