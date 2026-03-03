from typing import List, Dict, Any, Optional
from .base import AIProvider
import json

class MockAIDriver(AIProvider):
    def __init__(self, mode: str = "api", provider: str = "openai"):
        self.mode = mode
        self.provider = provider

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        # Universal Decomposition Prompt
        if "As a Universal Task Solver, decompose this goal" in prompt:
            return json.dumps({
                "goal": "Control ESP32 and log data",
                "confidence_score": 0.85,
                "steps": [
                    {
                        "step_id": 1,
                        "description": "Identify protocol and connect",
                        "required_capability": "mqtt_protocol",
                        "is_complex": True
                    },
                    {
                        "step_id": 2,
                        "description": "Log movement data",
                        "required_capability": "file_logging",
                        "is_complex": False
                    }
                ],
                "strategic_rationale": "Breaking down by protocol identification and data logging."
            })

        # Recursive/Sub-goal Decomposition
        if "Sub-goal: Identify protocol and connect" in prompt:
             return json.dumps({
                "goal": "Identify protocol and connect",
                "confidence_score": 0.9,
                "steps": [
                    {"step_id": 1.1, "description": "Scan MQTT ports", "required_capability": "mqtt_scan", "is_complex": False},
                    {"step_id": 1.2, "description": "Establish connection", "required_capability": "mqtt_connect", "is_complex": False}
                ]
            })

        # Alternative Strategy Prompt
        if "Provide an ALTERNATIVE strategy" in prompt:
            return json.dumps({
                "action": "bypass_retry",
                "description": "Attempt connection using default port 1883 immediately."
            })

        # CEO Planner Prompt with Decomposed Steps
        if "Structured Plan Steps:" in prompt:
            return json.dumps([
                {"step": "1.1", "tool": "mqtt_scan", "reason": "Identify robot protocol", "description": "Scan MQTT ports on 192.168.1.0/24"},
                {"step": "1.2", "tool": "mqtt_connect", "reason": "Control connection", "description": "Establish connection to ESP32 robot"},
                {"step": "2", "tool": "file_logging", "reason": "Data persistence", "description": "Log movement data to robot_history.json"}
            ])

        # Predictive Forecast Prompt
        if "Based on these technology trends" in prompt:
            return json.dumps([
                {
                    "capability_name": "local_llm_inference_optimizer",
                    "description": "Optimizes local LLM inference for edge devices.",
                    "trend_alignment_score": 0.92,
                    "justification": "Local LLM trend is surging at 0.91."
                }
            ])

        # Trend Analysis Prompt
        if "Identify 3-5 technology trends" in prompt:
            return json.dumps({
                "local_llm": 0.91,
                "vector_database_sync": 0.85,
                "autonomous_refactoring": 0.88
            })

        # Hardware Driver PLAN Prompt (from Engine)
        if "Plan a Python driver for:" in prompt:
            return json.dumps({
                "capability_name": "mqtt_smart_light_control",
                "description": "Controls ESP32 Smart Light via MQTT.",
                "required_libraries": ["paho-mqtt"],
                "is_hardware": True
            })

        # Hardware Modeling Prompt
        if "Identify:" in prompt and "Device Type" in prompt:
            return json.dumps({
                "device": "ESP32_Smart_Light",
                "protocol": "MQTT",
                "commands": ["turn_on", "turn_off"],
                "driver_needed": True,
                "params": { "topic": "home/livingroom/light" }
            })

        # Hardware Driver Plan Prompt
        if "Design a standalone Hardware Driver" in prompt:
             cap_name = prompt.split("GAP: ")[1].split("\n")[0].strip()
             return json.dumps({
                "file_path": f"app/tools/evolved_{cap_name.lower().replace(' ', '_')}.py",
                "dependencies": ["paho-mqtt"],
                "logic_plan": f"MQTT Driver for {cap_name}"
             })

        # Code Generation Prompt
        if "Follow these architecture rules:" in prompt:
             return """
import asyncio
async def run(**kwargs):
    print("MOCK: Running evolved module...")
    return {"status": "success", "data": kwargs}
"""

        # Module Design/Plan Prompt
        if "Design a standalone Python module" in prompt:
             cap_name = prompt.split("GAP: ")[1].split("\n")[0].strip()
             if "local_llm_inference_optimizer" in cap_name:
                 return json.dumps({
                    "file_path": "app/tools/evolved_local_llm_inference_optimizer.py",
                    "dependencies": [],
                    "logic_plan": "Optimizes local LLM inference using quantization and KV caching."
                 })
             return json.dumps({
                "file_path": f"app/tools/evolved_{cap_name.lower().replace(' ', '_')}.py",
                "dependencies": [],
                "logic_plan": f"Plan for {cap_name}"
             })

        # Evolution Reflection Prompt
        if "Extract a single, concise, generalized \"Strategy Lesson\"" in prompt:
             return json.dumps({
                "lesson_learned": "User company confirmed as SpotNet Services." if "SpotNet" in prompt else "",
                "category": "general",
                "confidence": "high"
            })

        # Mocking planning for Step 1
        if "My company is SpotNet Services" in prompt:
            if "break this goal into a sequential plan" in prompt:
                return json.dumps([
                    {"step": 1, "tool": "none", "reason": "Acknowledge", "description": "Confirm the company name SpotNet Services"}
                ])
            return "Acknowledged. Your company is SpotNet Services. I have recorded this in my business memory graph."

        # Mocking planning for Step 2
        if "What is my company name?" in prompt:
            print(f"MOCK DRIVER: Check Step 2 Prompt. Contains 'SpotNet'? {'SpotNet' in prompt}")
            # Check if memory was injected into prompt (Planning Engine enhancement)
            # OR if it's the final synthesis step where episodic context is provided
            if "SpotNet Services" in prompt:
                if "break this goal into a sequential plan" in prompt:
                    return json.dumps([
                        {"step": 1, "tool": "none", "reason": "Recall", "description": "Answer based on memory"}
                    ])
                return "Your company name is SpotNet Services, as recorded in our previous interaction."
            else:
                if "break this goal into a sequential plan" in prompt:
                     return json.dumps([
                        {"step": 1, "tool": "none", "reason": "No Memory", "description": "State that I don't know"}
                    ])
                return "I'm sorry, I don't have that information in my memory yet."

        # Strategic Gap Analysis Prompt
        if "Analyze these system gaps through a \"Strategic Intelligence\" lens" in prompt:
             # Simulate prioritization logic
             if "hardware" in prompt.lower():
                 return json.dumps([
                    {
                        "capability_name": "hardware_control_optimized",
                        "description": "Optimized control for IoT hardware.",
                        "priority_score": 0.95,
                        "strategic_justification": "Directly aligns with hardware industry focus.",
                        "is_duplicate": False
                    },
                    {
                        "capability_name": "excel_automation",
                        "description": "Basic excel automation.",
                        "priority_score": 0.4,
                        "strategic_justification": "Low alignment with hardware focus.",
                        "is_duplicate": False
                    }
                ])
             return json.dumps([
                {
                    "capability_name": "data_analysis_pro",
                    "description": "Advanced data visualization.",
                    "priority_score": 0.85,
                    "strategic_justification": "General alignment with analytical goals.",
                    "is_duplicate": False
                }
            ])

        # Sample Input Generation Prompt
        if "Generate a JSON object of sample input arguments" in prompt:
             return json.dumps({"data": "sample_csv_data_for_testing"})

        # Standard generic response
        return "Quantify OS is an autonomous OS."

    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        return {"tool": None, "arguments": None, "content": "Execution complete."}

    async def validate_key(self) -> Optional[str]:
        return "mock-key"
