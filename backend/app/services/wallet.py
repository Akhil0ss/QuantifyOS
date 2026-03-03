from typing import Optional, Dict, Any, List
from .base_rtdb import BaseRTDBService
from firebase_admin import db
import time

# ────────────────────────────────────────────────────────
# SECURITY: Daily spend tracking reset interval (1 hour = 3600s)
# ────────────────────────────────────────────────────────
DAILY_RESET_INTERVAL = 86400  # 24 hours


class WalletService(BaseRTDBService):
    def __init__(self):
        super().__init__("wallets")

    def get_balance(self, user_id: str) -> float:
        balance_data = self.get(f"{user_id}/balance")
        if balance_data is None:
            # Initialize empty wallet
            self.set({"amount": 0.0}, f"{user_id}/balance")
            return 0.0
        return float(balance_data.get("amount", 0.0))

    def add_funds(self, user_id: str, amount: float, description: str, caller_identity: str = "system") -> str:
        current_balance = self.get_balance(user_id)
        new_balance = current_balance + amount

        # Add transaction record
        transaction = {
            "type": "credit",
            "amount": amount,
            "description": description,
            "caller_identity": caller_identity,
            "timestamp": int(time.time() * 1000)
        }
        transaction_id = self.push(transaction, f"{user_id}/transactions")

        # Update balance
        self.set({"amount": new_balance}, f"{user_id}/balance")

        # ── SECURITY: Telemetry logging ──
        try:
            from app.services.telemetry import TelemetryService
            telemetry = TelemetryService()
            telemetry.log_system_event(
                user_id, "Wallet",
                f"CREDIT: +{amount} by {caller_identity} — {description}",
                level="info"
            )
        except Exception:
            pass

        return transaction_id

    def deduct_funds(self, user_id: str, amount: float, description: str, caller_identity: str = "") -> bool:
        """
        Called by the Autonomy Engine when the agent invokes paid APIs/tools.

        SECURITY: Requires caller_identity. Enforces per-transaction spend_limit
        and cumulative daily spend cap.
        """
        # ── SECURITY: Caller identity is mandatory ──
        if not caller_identity or not caller_identity.strip():
            self._log_security_event(user_id, "DEDUCTION REJECTED: No caller identity provided", amount, caller_identity)
            return False

        current_balance = self.get_balance(user_id)
        if current_balance < amount:
            self._log_security_event(user_id, f"DEDUCTION REJECTED: Insufficient funds ({current_balance} < {amount})", amount, caller_identity)
            return False

        settings = self.get_settings(user_id)

        # ── SECURITY: Authorization check ──
        if not settings.get("authorized", False):
            self._log_security_event(user_id, "DEDUCTION REJECTED: Spend not authorized", amount, caller_identity)
            return False

        # ── SECURITY: Per-transaction spend limit ──
        spend_limit = settings.get("spend_limit", 0)
        if spend_limit > 0 and amount > spend_limit:
            self._log_security_event(
                user_id,
                f"DEDUCTION REJECTED: Amount {amount} exceeds per-transaction limit {spend_limit}",
                amount, caller_identity
            )
            return False

        # ── SECURITY: Cumulative daily spend cap ──
        daily_cap = settings.get("daily_spend_cap", 100.0)
        daily_spend = self._get_daily_spend(user_id)
        if daily_cap > 0 and (daily_spend + amount) > daily_cap:
            self._log_security_event(
                user_id,
                f"DEDUCTION REJECTED: Daily cap exceeded ({daily_spend} + {amount} > {daily_cap})",
                amount, caller_identity
            )
            return False

        # ── Execute deduction ──
        new_balance = current_balance - amount

        transaction = {
            "type": "debit",
            "amount": amount,
            "description": description,
            "caller_identity": caller_identity,
            "timestamp": int(time.time() * 1000)
        }
        self.push(transaction, f"{user_id}/transactions")
        self.set({"amount": new_balance}, f"{user_id}/balance")

        # Update daily spend tracker
        self._update_daily_spend(user_id, daily_spend + amount)

        # ── SECURITY: Telemetry logging with actor identity ──
        self._log_security_event(user_id, f"DEDUCTION APPROVED: -{amount}", amount, caller_identity)

        return True

    def transfer_between_agents(self, user_id: str, sender_agent_id: str, receiver_agent_id: str, amount: float, description: str) -> bool:
        """
        S-Tier: Inter-agent micro-transactions.
        Allows an agent to 'hire' another agent within the same user's workspace.
        """
        # 1. Deduct from sender
        success = self.deduct_funds(
            user_id, amount, 
            description=f"PAYMENT TO {receiver_agent_id}: {description}", 
            caller_identity=sender_agent_id
        )
        
        if success:
            # 2. Add to a separate 'agent_balances' if we want tracking, 
            # but for now we'll just log the 'credit' to the receiver's context.
            # In a full-blown economy, agents might have their own sub-accounts.
            transaction = {
                "type": "agent_transfer",
                "sender": sender_agent_id,
                "receiver": receiver_agent_id,
                "amount": amount,
                "description": description,
                "timestamp": int(time.time() * 1000)
            }
            self.push(transaction, f"{user_id}/agent_economy_logs")
            return True
        return False

    def get_transactions(self, user_id: str) -> List[Dict[str, Any]]:
        txs = self.get(f"{user_id}/transactions")
        if not txs:
            return []

        tx_list = []
        for tid, data in txs.items():
            data["id"] = tid
            tx_list.append(data)

        # Sort descending by timestamp
        tx_list.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return tx_list

    def set_spend_authorization(self, user_id: str, authorized: bool, limit: float = 0, daily_cap: float = 100.0):
        data = {
            "authorized": authorized,
            "spend_limit": limit,
            "daily_spend_cap": daily_cap
        }
        self.set(data, f"{user_id}/settings")

    def get_settings(self, user_id: str) -> Dict[str, Any]:
        settings = self.get(f"{user_id}/settings")
        if not settings:
            return {"authorized": False, "spend_limit": 0, "daily_spend_cap": 100.0}
        # Ensure defaults for new fields
        if "daily_spend_cap" not in settings:
            settings["daily_spend_cap"] = 100.0
        return settings

    # ── Private helpers ──

    def _get_daily_spend(self, user_id: str) -> float:
        """Returns cumulative spend for the current day, resetting if stale."""
        tracker = self.get(f"{user_id}/daily_spend")
        if not tracker:
            return 0.0

        # Reset if last update was more than 24 hours ago
        last_reset = tracker.get("last_reset", 0)
        now = int(time.time() * 1000)
        if now - last_reset > DAILY_RESET_INTERVAL * 1000:
            self._update_daily_spend(user_id, 0.0)
            return 0.0

        return float(tracker.get("total", 0.0))

    def _update_daily_spend(self, user_id: str, total: float):
        """Updates the cumulative daily spend tracker."""
        self.set({
            "total": total,
            "last_reset": int(time.time() * 1000)
        }, f"{user_id}/daily_spend")

    def _log_security_event(self, user_id: str, message: str, amount: float, caller_identity: str):
        """Logs wallet security events via TelemetryService."""
        try:
            from app.services.telemetry import TelemetryService
            telemetry = TelemetryService()
            telemetry.log_system_event(
                user_id, "Wallet-Security",
                f"[{caller_identity}] {message} (amount={amount})",
                level="warning" if "REJECTED" in message else "info"
            )
        except Exception:
            pass
