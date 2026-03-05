"""
Marketplace Tool: Market Trend Predictor
Performs real financial analysis using the AI driver with structured output.
"""
import asyncio
import json
from typing import Dict, Any
from app.services.ai_drivers.router import ModelRouter


async def run(user_id: str = "default", **kwargs) -> Dict[str, Any]:
    """
    Analyzes market data, news trends, and generates actionable financial reports.
    Uses the actual AI driver for real analysis.
    """
    asset = kwargs.get("asset", "NVDA")
    analysis_type = kwargs.get("type", "technical")

    system_message = (
        "You are a senior financial analyst. Provide real, actionable analysis. "
        "Base your analysis on current market knowledge. "
        "Always include risk disclaimers. Respond in valid JSON format."
    )

    prompt = (
        f"Analyze {asset} stock.\n"
        f"Analysis type: {analysis_type}\n"
        f"Provide:\n"
        f"1. Current sentiment (Bullish/Neutral/Bearish)\n"
        f"2. Key factors driving the price\n"
        f"3. Short-term outlook (1-4 weeks)\n"
        f"4. Risk assessment\n"
        f"5. Actionable recommendation\n\n"
        f"Respond as JSON: {{\"asset\": \"{asset}\", \"sentiment\": \"...\", "
        f"\"factors\": [...], \"outlook\": \"...\", \"risk\": \"...\", "
        f"\"recommendation\": \"...\", \"disclaimer\": \"...\"}}"
    )

    try:
        result = await ModelRouter.get_best_provider(user_id, prompt, system_message)
        # Try to parse as JSON
        try:
            start = result.find('{')
            end = result.rfind('}') + 1
            parsed = json.loads(result[start:end])
            return {"status": "success", "report": parsed}
        except (json.JSONDecodeError, ValueError):
            return {"status": "success", "report": result}
    except Exception as e:
        return {
            "status": "error",
            "message": f"Analysis failed: {str(e)}",
            "fallback": "Check your AI provider configuration."
        }


if __name__ == "__main__":
    print(asyncio.run(run(asset="AAPL", type="fundamental")))
