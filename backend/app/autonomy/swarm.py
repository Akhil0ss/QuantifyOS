from typing import Dict, Any, List, Optional
from app.services.base_rtdb import BaseRTDBService
import time
import uuid
import re

# ────────────────────────────────────────────────────────
# SECURITY: Swarm message constraints
# ────────────────────────────────────────────────────────
SWARM_MAX_MESSAGE_LENGTH = 5000
SWARM_CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class SwarmOrchestrator(BaseRTDBService):
    def __init__(self):
        super().__init__("swarms")

    def spawn_agent(self, workspace_id: str, parent_task_id: str, role: str, goal: str) -> str:
        agent_id = str(uuid.uuid4())
        agent_data = {
            "id": agent_id,
            "parent_task_id": parent_task_id,
            "role": role,
            "goal": goal,
            "status": "pending",
            "created_at": int(time.time() * 1000),
            "updated_at": int(time.time() * 1000)
        }
        
        # Save to DB
        self.set(agent_data, f"{workspace_id}/agents/{agent_id}")
        
        self.log_event(workspace_id, agent_id, "spawn", f"Spawned sub-agent ({role}) for task {parent_task_id}")
        
        # Log spawn via telemetry
        self._log_telemetry(workspace_id, f"SPAWN: agent={agent_id} role={role} parent_task={parent_task_id}")
        
        return agent_id

    def offer_bounty(self, workspace_id: str, agent_id: str, target_agent_id: str, amount: float, task_description: str):
        """
        S-Tier: Agent negotiation.
        Registers a bounty offer from one agent to another.
        """
        from app.services.wallet import WalletService
        wallet = WalletService()
        
        # In this implementation, the user_id is the root of workspace_id
        user_id = workspace_id.split('_')[0] if '_' in workspace_id else workspace_id
        
        if wallet.transfer_between_agents(user_id, agent_id, target_agent_id, amount, task_description):
            self.log_event(workspace_id, agent_id, "bounty_offered", f"Offered {amount} to {target_agent_id} for: {task_description}")
            return True
        return False

    def update_agent_status(self, workspace_id: str, agent_id: str, status: str, result: Optional[str] = None):
        updates = {
            "status": status,
            "updated_at": int(time.time() * 1000)
        }
        if result:
            updates["result"] = result
            
        self.update(updates, f"{workspace_id}/agents/{agent_id}")
        self.log_event(workspace_id, agent_id, "status_change", f"Status updated to: {status}")

    def terminate_agent(self, workspace_id: str, agent_id: str, reason: str = "Completed", caller_id: str = ""):
        """
        Terminates an agent.
        SECURITY: Requires caller_id for authority verification.
        Only the parent task owner or 'system' can terminate an agent.
        """
        if not caller_id:
            self.log_event(workspace_id, agent_id, "terminate_rejected", "No caller_id provided.")
            self._log_telemetry(workspace_id, f"TERMINATE REJECTED: agent={agent_id} reason=no_caller_id")
            return False

        # Verify caller authority
        agent_data = self.get(f"{workspace_id}/agents/{agent_id}")
        if agent_data:
            parent_task = agent_data.get("parent_task_id", "")
            # Allow: system, the parent task owner, or the agent itself
            allowed_callers = {"system", parent_task, agent_id}
            if caller_id not in allowed_callers:
                self.log_event(workspace_id, agent_id, "terminate_rejected",
                               f"Unauthorized caller: {caller_id}")
                self._log_telemetry(workspace_id,
                    f"TERMINATE REJECTED: agent={agent_id} caller={caller_id} reason=unauthorized")
                return False

        self.update_agent_status(workspace_id, agent_id, "terminated", result=reason)
        self.log_event(workspace_id, agent_id, "terminate", f"Agent terminated by {caller_id}: {reason}")
        self._log_telemetry(workspace_id, f"TERMINATE: agent={agent_id} by={caller_id} reason={reason}")
        return True

    def broadcast_message(self, workspace_id: str, sender_id: str, receiver_id: str, message: str) -> Optional[str]:
        """
        Sends a message between swarm agents.
        SECURITY: Validates sender exists, enforces message length limits,
        and strips control characters.
        """
        # ── SECURITY: Validate sender existence ──
        sender_data = self.get(f"{workspace_id}/agents/{sender_id}")
        if not sender_data and sender_id != "system":
            self.log_event(workspace_id, sender_id, "message_rejected",
                          f"Sender check failed: agent {sender_id} not found")
            self._log_telemetry(workspace_id,
                f"MESSAGE REJECTED: sender={sender_id} reason=sender_not_found")
            return None

        # ── SECURITY: Message length limit ──
        if len(message) > SWARM_MAX_MESSAGE_LENGTH:
            self.log_event(workspace_id, sender_id, "message_rejected",
                          f"Message too long: {len(message)} > {SWARM_MAX_MESSAGE_LENGTH}")
            self._log_telemetry(workspace_id,
                f"MESSAGE REJECTED: sender={sender_id} reason=too_long ({len(message)} chars)")
            return None

        # ── SECURITY: Strip control characters ──
        clean_message = SWARM_CONTROL_CHAR_PATTERN.sub("", message)

        msg_id = str(uuid.uuid4())
        msg_data = {
            "id": msg_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "message": clean_message,
            "timestamp": int(time.time() * 1000)
        }
        
        self.set(msg_data, f"{workspace_id}/messages/{msg_id}")
        self._log_telemetry(workspace_id, f"MESSAGE: {sender_id} -> {receiver_id} (len={len(clean_message)})")
        return msg_id

    def list_active_agents(self, workspace_id: str) -> List[Dict[str, Any]]:
        agents_data = self.get(f"{workspace_id}/agents")
        if not agents_data:
            return []
            
        agents = list(agents_data.values())
        return sorted(agents, key=lambda x: x.get("created_at", 0), reverse=True)

    def get_messages(self, workspace_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        messages_data = self.get(f"{workspace_id}/messages")
        if not messages_data:
            return []
            
        messages = list(messages_data.values())
        messages.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return messages[:limit]
        
    def log_event(self, workspace_id: str, agent_id: str, event_type: str, details: str):
        log_id = str(uuid.uuid4())
        log_data = {
            "agent_id": agent_id,
            "type": event_type,
            "details": details,
            "timestamp": int(time.time() * 1000)
        }
        self.set(log_data, f"{workspace_id}/logs/{log_id}")

    def get_logs(self, workspace_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        logs_data = self.get(f"{workspace_id}/logs")
        if not logs_data:
            return []
            
        logs = list(logs_data.values())
        logs.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return logs[:limit]

    def _log_telemetry(self, workspace_id: str, message: str):
        """Logs swarm events via TelemetryService."""
        try:
            from app.services.telemetry import TelemetryService
            telemetry = TelemetryService()
            telemetry.log_system_event("system", "Swarm", f"[{workspace_id}] {message}")
        except Exception:
            pass
