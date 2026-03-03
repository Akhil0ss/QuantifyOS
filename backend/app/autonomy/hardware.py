import json
import os
import time
from typing import Dict, Any, List, Optional
from app.services.telemetry import TelemetryService
from app.services.ai_drivers.router import ModelRouter

class HardwareIntelligenceEngine:
    """
    Manages hardware discovery, protocol mapping, and driver requirements.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str):
        self.user_id = user_id
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        self.telemetry = TelemetryService()
        self.protocol_file = "protocol_memory.json"
        self.hw_history_file = "hardware_evolution.json"
        self.device_registry = "hardware_devices.json"

    def _get_protocols(self) -> Dict[str, Any]:
        if os.path.exists(self.protocol_file):
            with open(self.protocol_file, "r") as f:
                return json.load(f)
        return {}

    def _log_hw_event(self, event: Dict[str, Any]):
        history = []
        if os.path.exists(self.hw_history_file):
            with open(self.hw_history_file, "r") as f:
                history = json.load(f)
        event["timestamp"] = time.time()
        history.append(event)
        with open(self.hw_history_file, "w") as f:
            json.dump(history, f, indent=2)

    async def detect_and_model_device(self, raw_input: str) -> Dict[str, Any]:
        """
        Analyzes raw detection strings (logs, configs) to model a hardware device.
        """
        protocols = self._get_protocols()
        
        prompt = f"""
        User wants to connect to a new device or service.
        INPUT: {raw_input}
        
        KNOWN PROTOCOLS:
        {json.dumps(protocols, indent=2)}
        
        Identify:
        1. Device Type (e.g., IoT Sensor, Robot, API)
        2. Connection Protocol
        3. Required Commands
        4. Driver Gap (True if we don't have a specific way to talk to this yet)
        
        Return JSON:
        {{
            "device": "name",
            "protocol": "string",
            "commands": ["list"],
            "driver_needed": boolean,
            "params": {{ "baud": 115200, "topic": "root/topic/.." }}
        }}
        """
        
        response = await self.provider.generate_text(prompt)
        try:
            model = json.loads(response[response.find('{'):response.rfind('}')+1])
            self._log_hw_event({
                "action": "device_modeling",
                "device": model["device"],
                "protocol": model["protocol"],
                "success": True
            })
            return model
        except Exception as e:
            return {"error": str(e)}

    async def generate_driver_plan(self, device_model: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a technical plan for a hardware driver.
        """
        protocols = self._get_protocols()
        protocol_data = protocols.get(device_model["protocol"], {})
        
        prompt = f"""
        Plan a Python driver for: {device_model['device']}
        PROTOCOL: {device_model['protocol']}
        PROTOCOL DETAILS: {json.dumps(protocol_data)}
        COMMANDS: {json.dumps(device_model['commands'])}
        PARAMS: {json.dumps(device_model['params'])}
        
        The driver must use libraries like:
        - paho-mqtt (for MQTT)
        - pyserial (for Serial)
        - pymodbus (for Modbus)
        - requests (for REST)
        
        Return JSON:
        {{
            "capability_name": "string",
            "description": "string",
            "required_libraries": ["list"],
            "is_hardware": true
        }}
        """
        
        response = await self.provider.generate_text(prompt)
        try:
            return json.loads(response[response.find('{'):response.rfind('}')+1])
        except Exception as e:
            return {"error": str(e)}

if __name__ == "__main__":
    # Test stub
    pass
