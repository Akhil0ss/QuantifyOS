import os
from .tool_engine import Tool, registry
from typing import Any

class FileRead(Tool):
    def __init__(self):
        super().__init__(
            name="file_read",
            description="Read the content of a file from the local filesystem.",
            parameters={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The absolute or relative path to the file."
                    }
                },
                "required": ["path"]
            }
        )

    async def run(self, path: str) -> Any:
        print(f"Executing file_read for: {path}")
        try:
            if not os.path.exists(path):
                return f"Error: File not found at {path}"
            
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except Exception as e:
            return f"Error reading file: {str(e)}"

# Register the tool
registry.register_tool(FileRead())
