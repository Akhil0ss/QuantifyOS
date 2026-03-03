from typing import Dict, Any
from app.services.base_rtdb import BaseRTDBService

class UserService(BaseRTDBService):
    """
    Manages user profiles and their specific autonomy preferences/safeguards.
    """
    def __init__(self):
        super().__init__("users")

    def get_autonomy_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieves the exact autonomy control panel configuration for the user.
        """
        ref = self.db.reference(f"users/{user_id}/autonomy")
        prefs = ref.get()
        if not prefs:
            return {
                "auto_retry_limit": 2,
                "financial_override": True, # Require manual approval for spending
                "background_polling": False, # Prevent AI from starting tasks on its own
                "autonomy_level": "medium"
            }
        return prefs

    def update_autonomy_preferences(self, user_id: str, new_prefs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates the autonomy configuration.
        """
        ref = self.db.reference(f"users/{user_id}/autonomy")
        # Ensure only expected keys are saved
        safe_prefs = {
            "auto_retry_limit": int(new_prefs.get("auto_retry_limit", 2)),
            "financial_override": bool(new_prefs.get("financial_override", True)),
            "background_polling": bool(new_prefs.get("background_polling", False)),
            "autonomy_level": str(new_prefs.get("autonomy_level", "medium"))
        }
        ref.set(safe_prefs)
        return safe_prefs
