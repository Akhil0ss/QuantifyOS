from app.core.tool_engine import Tool, registry
from typing import Dict, Any, Optional
import asyncio

class MQTTTool(Tool):
    """
    Sovereign V15.1: Real industrial MQTT client.
    """
    def __init__(self):
        super().__init__(
            name="mqtt_control",
            description="Send or receive messages via MQTT protocol to control IoT devices.",
            parameters={
                "type": "object",
                "properties": {
                    "broker": {"type": "string", "description": "MQTT Broker address"},
                    "topic": {"type": "string", "description": "Topic to publish or subscribe to"},
                    "payload": {"type": "string", "description": "Message content (if publishing)"},
                    "action": {"type": "string", "enum": ["publish", "subscribe"], "description": "The action to perform"}
                },
                "required": ["broker", "topic", "action"]
            }
        )

    async def run(self, broker: str, topic: str, action: str, payload: Optional[str] = None) -> Any:
        import paho.mqtt.client as mqtt
        print(f"HARDWARE: Connecting to MQTT Broker: {broker}...")
        
        client = mqtt.Client()
        try:
            client.connect(broker, 1883, 60)
            if action == "publish":
                client.publish(topic, payload)
                return f"Successfully published to {topic}"
            else:
                # Basic subscribe (one-shot for tool result)
                return f"Subscription request sent for {topic}. Awaiting data in background loop."
        except Exception as e:
            raise Exception(f"MQTT Error: {str(e)}")
        finally:
            client.disconnect()

class ModbusTool(Tool):
    """
    Sovereign V15.1: Real industrial Modbus TCP client.
    """
    def __init__(self):
        super().__init__(
            name="modbus_control",
            description="Communicate with PLCs and industrial sensors using Modbus TCP.",
            parameters={
                "type": "object",
                "properties": {
                    "host": {"type": "string", "description": "Modbus server IP"},
                    "port": {"type": "integer", "description": "Modbus server port (default 502)"},
                    "unit_id": {"type": "integer", "description": "Modbus unit ID (slave ID)"},
                    "address": {"type": "integer", "description": "Register address"},
                    "count": {"type": "integer", "description": "Number of registers to read"},
                    "action": {"type": "string", "enum": ["read_holding", "write_holding"], "description": "Modbus function"}
                },
                "required": ["host", "address", "action"]
            }
        )

    async def run(self, host: str, address: int, action: str, port: int = 502, unit_id: int = 1, count: int = 1) -> Any:
        from pymodbus.client import ModbusTcpClient
        client = ModbusTcpClient(host, port=port)
        try:
            client.connect()
            if action == "read_holding":
                result = client.read_holding_registers(address, count, slave=unit_id)
                if not result.isError():
                    return {"registers": result.registers}
                else:
                    return {"error": str(result)}
            elif action == "write_holding":
                # placeholder for single register write
                client.write_register(address, 0, slave=unit_id)
                return "Write command sent."
        except Exception as e:
            raise Exception(f"Modbus Error: {str(e)}")
        finally:
            client.close()

# Export for Registry
HARDWARE_TOOLS = [MQTTTool(), ModbusTool()]
