"""
Marketplace Tool: SQL Query Optimizer
Takes a raw SQL query and returns an optimized version with explanation.
"""
import asyncio
from typing import Dict, Any
from app.services.ai_drivers.router import ModelRouter


async def run(user_id: str = "default", **kwargs) -> Dict[str, Any]:
    """
    Takes a SQL query, analyzes it, and returns an optimized version with explanation.
    """
    query = kwargs.get("query", "SELECT * FROM users")
    dialect = kwargs.get("dialect", "PostgreSQL")

    system_message = (
        "You are a database performance expert. "
        "Analyze the given SQL query and provide an optimized version. "
        "Explain each optimization with performance impact estimates."
    )

    prompt = (
        f"Optimize this {dialect} query:\n\n"
        f"```sql\n{query}\n```\n\n"
        f"Provide:\n"
        f"1. The optimized query\n"
        f"2. Explanation of each change\n"
        f"3. Recommended indexes\n"
        f"4. Estimated performance improvement\n"
    )

    try:
        result = await ModelRouter.get_best_provider(user_id, prompt, system_message)
        return {
            "status": "success",
            "original_query": query,
            "dialect": dialect,
            "optimization": result,
            "message": "SQL optimization complete."
        }
    except Exception as e:
        return {"status": "error", "message": f"Optimization failed: {str(e)}"}


if __name__ == "__main__":
    print(asyncio.run(run(query="SELECT * FROM orders o JOIN users u ON o.user_id = u.id WHERE u.created_at > '2024-01-01'")))
