from typing import Dict, Any, List, Optional
from app.services.base_rtdb import BaseRTDBService
import time
import secrets
import string

class HardwareService(BaseRTDBService):
    def __init__(self):
        super().__init__("devices")

    def _generate_token(self, length: int = 32) -> str:
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for i in range(length))

    def register_device(self, workspace_id: str, name: str, device_type: str, description: str = "") -> Dict[str, Any]:
        device_id = f"dev_{self._generate_token(12)}"
        secret_token = self._generate_token(48)
        
        device_data = {
            "id": device_id,
            "name": name,
            "type": device_type,
            "description": description,
            "status": "offline",
            "token": secret_token, # Keep it simple for MVP, in prod hash this.
            "registered_at": int(time.time() * 1000),
            "last_ping": 0,
            "telemetry": {}
        }
        
        self.set(device_data, f"{workspace_id}/{device_id}")
        return device_data

    def get_devices(self, workspace_id: str) -> List[Dict[str, Any]]:
        devices_data = self.get(f"{workspace_id}")
        if not devices_data:
            return []
            
        devices = []
        for did, data in devices_data.items():
            # Don't return the secret token in regular listings
            safe_data = {k: v for k, v in data.items() if k != "token"}
            devices.append(safe_data)
            
        return sorted(devices, key=lambda x: x.get("registered_at", 0), reverse=True)

    def verify_and_ingest_telemetry(self, device_id: str, token: str, payload: Dict[str, Any]) -> bool:
        """
        Since webhooks are unauthenticated by the generic user auth, we check the DB across all workspaces
        to find the device and match the token. 
        Note: In a huge multi-tenant system, this is slow. We'd usually pass workspace_id in the webhook URL.
        For Quantify OS V11, we'll do a global search.
        """
        all_workspaces = self.get("") or {}
        
        for workspace_id, devices in all_workspaces.items():
            if device_id in devices:
                device = devices[device_id]
                if device.get("token") == token:
                    # Token matched! Ingest telemetry
                    updates = {
                        "last_ping": int(time.time() * 1000),
                        "status": "online",
                        "telemetry": payload
                    }
                    self.update(updates, f"{workspace_id}/{device_id}")
                    return True
        return False

    def send_command(self, workspace_id: str, device_id: str, command: str, params: Dict[str, Any] = None) -> bool:
        """
        Saves a pending command for the device. The device should poll this or we use WebSockets.
        For V11 MVP, we save it and assume the device dashboard checks it.
        """
        command_data = {
            "command": command,
            "params": params or {},
            "timestamp": int(time.time() * 1000),
            "status": "pending"
        }
        self.push(command_data, f"{workspace_id}/{device_id}/commands")
        return True
