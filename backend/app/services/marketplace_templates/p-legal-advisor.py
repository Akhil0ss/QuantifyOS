"""
Marketplace Tool: Legal Contract Analyzer
Analyzes contracts and legal documents using AI for key terms, risks, and suggestions.
"""
import asyncio
from typing import Dict, Any
from app.services.ai_drivers.router import ModelRouter


async def run(user_id: str = "default", **kwargs) -> Dict[str, Any]:
    """
    Analyzes legal text for key clauses, risks, and plain-language summaries.
    """
    document_text = kwargs.get("text", "")
    doc_type = kwargs.get("type", "General Contract")

    if not document_text:
        return {"status": "error", "message": "No document text provided. Pass 'text' parameter."}

    system_message = (
        "You are a corporate legal advisor. Analyze the document and provide: "
        "clear summaries, risk flags, and actionable recommendations. "
        "Use plain language. Flag any unusual or potentially harmful clauses."
    )

    prompt = (
        f"Analyze this {doc_type}:\n\n"
        f"```\n{document_text[:10000]}\n```\n\n"
        f"Provide:\n"
        f"1. Plain-language summary (3-5 sentences)\n"
        f"2. Key terms and obligations\n"
        f"3. Risk flags (RED = Critical, YELLOW = Caution, GREEN = Standard)\n"
        f"4. Missing clauses that should be present\n"
        f"5. Negotiation suggestions\n"
        f"DISCLAIMER: This is AI analysis, not legal advice."
    )

    try:
        result = await ModelRouter.get_best_provider(user_id, prompt, system_message)
        return {
            "status": "success",
            "doc_type": doc_type,
            "analysis": result,
            "disclaimer": "This is AI-assisted analysis, not legal advice. Consult a qualified attorney.",
            "message": "Legal analysis complete."
        }
    except Exception as e:
        return {"status": "error", "message": f"Analysis failed: {str(e)}"}


if __name__ == "__main__":
    print(asyncio.run(run(text="This agreement is between Party A and Party B...", type="NDA")))
