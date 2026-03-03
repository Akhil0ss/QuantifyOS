from typing import List, Dict, Any, Optional
import re


class RiskLevel:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RiskEngine:
    """
    Evaluates AI-generated plans for potential risks and high-stakes actions.
    Now persists results via TelemetryService.
    """
    
    def __init__(self, user_id: str = "system"):
        self.user_id = user_id
    
    # Keywords and patterns that trigger risk flags
    HIGH_RISK_KEYWORDS = [
        "delete", "rm -rf", "drop table", "truncate", "format",
        "send money", "transfer funds", "pay", "buy", "purchase",
        "unsubscribe", "close account", "terminate",
        "broadcast", "send email to all", "post to social"
    ]
    
    FINANCIAL_PATTERNS = [
        r"\$\d+", r"\d+\s?usd", r"\d+\s?gbp", r"\d+\s?eur", r"price", "cost"
    ]

    def evaluate_plan(self, plan: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes a list of steps and returns a risk report.
        """
        max_risk = RiskLevel.LOW
        flagged_steps = []
        summary = ""

        for step in plan:
            step_risk = self.evaluate_step(step)
            if step_risk["level"] != RiskLevel.LOW:
                flagged_steps.append({
                    "step": step.get("step"),
                    "risk": step_risk
                })
                # Upgrade max risk if necessary
                if self._get_risk_score(step_risk["level"]) > self._get_risk_score(max_risk):
                    max_risk = step_risk["level"]
                    summary = step_risk["reason"]

        result = {
            "risk_level": max_risk,
            "is_high_risk": self._get_risk_score(max_risk) >= self._get_risk_score(RiskLevel.HIGH),
            "flagged_steps": flagged_steps,
            "summary": summary if summary else "No significant risks detected."
        }
        
        # TELEMETRY: Persist risk evaluation
        self._log_evaluation(result)
        
        return result

    def evaluate_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates a single step.
        """
        description = step.get("description", "").lower()
        tool = step.get("tool", "").lower()
        
        # Check for critical deletion/destructive behavior
        if any(kw in description for kw in ["delete", "rm -rf", "drop table", "format"]):
            return {"level": RiskLevel.CRITICAL, "reason": "Potential destructive data operation detected."}
        
        # Check for financial transactions
        if any(re.search(pattern, description) for pattern in self.FINANCIAL_PATTERNS) or \
           any(kw in description for kw in ["pay", "buy", "transfer"]):
            return {"level": RiskLevel.HIGH, "reason": "High-stakes financial transaction detected."}
            
        # Check for external communication/broadcasts
        if any(kw in description for kw in ["email all", "broadcast", "post to social"]):
            return {"level": RiskLevel.MEDIUM, "reason": "External communication with multiple entities detected."}
            
        # Check for tool-based risks (e.g. system commands)
        if tool in ["terminal", "shell", "run_script"]:
            return {"level": RiskLevel.MEDIUM, "reason": "Direct system command execution."}

        return {"level": RiskLevel.LOW, "reason": "Safe action."}

    def _get_risk_score(self, level: str) -> int:
        scores = {
            RiskLevel.LOW: 0,
            RiskLevel.MEDIUM: 1,
            RiskLevel.HIGH: 2,
            RiskLevel.CRITICAL: 3
        }
        return scores.get(level, 0)

    def _log_evaluation(self, result: Dict[str, Any]):
        """Persists risk evaluation via TelemetryService."""
        try:
            from app.services.telemetry import TelemetryService
            telemetry = TelemetryService()
            level = "warning" if result["is_high_risk"] else "info"
            telemetry.log_system_event(
                self.user_id, "RiskEngine",
                f"Risk evaluation: {result['risk_level']} | {result['summary']} | flagged={len(result['flagged_steps'])}",
                level=level
            )
        except Exception:
            pass
