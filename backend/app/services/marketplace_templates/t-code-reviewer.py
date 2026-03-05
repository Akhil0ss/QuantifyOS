"""
Marketplace Tool: AI Code Reviewer
Reads real project files and performs production-grade code review using the AI driver.
"""
import asyncio
from typing import Dict, Any
from app.services.ai_drivers.router import ModelRouter
from app.autonomy.structural import StructuralEngine


async def run(user_id: str = "default", **kwargs) -> Dict[str, Any]:
    """
    Reads a file from the workspace and performs a real AI-powered code review.
    Uses StructuralEngine for sandboxed file access and ModelRouter for AI.
    """
    workspace_id = kwargs.get("workspace_id", f"default-{user_id}")
    file_path = kwargs.get("file_path", "backend/main.py")

    # 1. Read the actual file
    engine = StructuralEngine(workspace_id)
    code = await engine._safe_read(file_path)

    if code.startswith("Error"):
        return {"status": "error", "message": f"Cannot read file: {code}"}

    system_message = (
        "You are a senior software engineer performing a production code review. "
        "Be specific. Cite exact line numbers. Categorize issues as: "
        "CRITICAL, WARNING, SUGGESTION, or PRAISE."
    )

    prompt = (
        f"Review this code from `{file_path}`:\n\n"
        f"```\n{code[:8000]}\n```\n\n"  # Cap at 8k chars for context window
        f"Provide:\n"
        f"1. Security vulnerabilities\n"
        f"2. Performance issues\n"
        f"3. Code quality and maintainability\n"
        f"4. Best practice violations\n"
        f"5. Overall score (1-10)\n"
    )

    try:
        result = await ModelRouter.get_best_provider(user_id, prompt, system_message)
        return {
            "status": "success",
            "file": file_path,
            "review": result,
            "message": f"Code review completed for {file_path}"
        }
    except Exception as e:
        return {"status": "error", "message": f"Review failed: {str(e)}"}


if __name__ == "__main__":
    print(asyncio.run(run(file_path="backend/main.py")))
