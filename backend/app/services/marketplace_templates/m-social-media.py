"""
Marketplace Tool: Social Media Manager
Generates real social media content using the AI driver.
"""
import asyncio
from typing import Dict, Any, Optional
from app.services.ai_drivers.router import ModelRouter


async def run(user_id: str = "default", **kwargs) -> Dict[str, Any]:
    """
    Generates production-quality social media posts.
    Uses the actual Gemini/OpenAI driver configured in the workspace.
    """
    topic = kwargs.get("topic", "our latest AI product update")
    platform = kwargs.get("platform", "Twitter")
    tone = kwargs.get("tone", "professional yet approachable")

    system_message = (
        "You are an expert social media marketer. "
        "Generate real, ready-to-publish content. "
        "Include relevant hashtags and emojis where appropriate. "
        "Keep it concise and engaging."
    )

    prompt = (
        f"Write a {platform} post about: {topic}\n"
        f"Tone: {tone}\n"
        f"Platform constraints: {'280 chars max' if platform == 'Twitter' else '2200 chars max'}\n"
        f"Include: hashtags, call-to-action, and engagement hook.\n"
        f"Return ONLY the post text, nothing else."
    )

    try:
        result = await ModelRouter.get_best_provider(user_id, prompt, system_message)
        return {
            "status": "success",
            "platform": platform,
            "topic": topic,
            "content": result,
            "message": f"Generated {platform} post ready for publishing."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"AI generation failed: {str(e)}",
            "fallback": "Check your AI provider configuration in Connections."
        }


if __name__ == "__main__":
    print(asyncio.run(run(topic="Quantify OS V11 Launch")))
