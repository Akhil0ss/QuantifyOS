from typing import List, Dict, Any, Optional
from .base import AIProvider
import json
import os

class MockAIDriver(AIProvider):
    def __init__(self, mode: str = "api", provider: str = "openai"):
        self.mode = mode
        self.provider = provider

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        # Code Generation Prompt
        if "Follow these architecture rules:" in prompt:
            code = """
import os
import json
import asyncio

async def run(**kwargs):
    print("MOCK: Running evolved module...")
    return {"status": "success", "data": kwargs}
"""
            return code

        # Synthesis Response Prompt
        if "Execution History:" in prompt and "Build an AI industry intelligence report." in prompt:
            return "Task completed successfully. I have created the ai_market_report.html, trend_chart.png, and the report_bundle.zip. You can download the artifacts from your workspace!"

        # Module Design/Plan Prompt
        if "Design a standalone Python module" in prompt:
             cap_name = prompt.split("GAP: ")[1].split("\n")[0].strip()
             if "web_scraper" in cap_name:
                 return json.dumps({
                    "file_path": "app/tools/evolved_web_scraper.py",
                    "dependencies": ["requests", "beautifulsoup4"],
                    "logic_plan": "Scrapes 10 AI sites."
                 })
             elif "trend_analyzer" in cap_name:
                 return json.dumps({
                    "file_path": "app/tools/evolved_trend_analyzer.py",
                    "dependencies": ["matplotlib"],
                    "logic_plan": "Analyzes trends and generates charts."
                 })
             elif "report_generator" in cap_name:
                 return json.dumps({
                    "file_path": "app/tools/evolved_report_generator.py",
                    "dependencies": [],
                    "logic_plan": "Generates HTML and ZIP package."
                 })
             return json.dumps({
                "file_path": f"app/tools/evolved_{cap_name.lower().replace(' ', '_')}.py",
                "dependencies": [],
                "logic_plan": f"Plan for {cap_name}"
             })

        # Standard generic response
        return "Quantify OS is an autonomous OS."

    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        if "Build an AI industry" in goal:
            iterations = context.count("Iteration ") if context else 0
            
            if iterations == 0:
                # Write plan to disk to fulfill Step 2
                plan_dir = "workspaces/default/outputs"
                os.makedirs(plan_dir, exist_ok=True)
                with open(os.path.join(plan_dir, "mission_plan.json"), "w") as f:
                    json.dump({"plan": "research, data collection, analysis, visualization, report"}, f)
                return {"content": "Backend must generate plan. Need web_scraper module.", "tool": None}

            elif iterations == 1:
                return {"tool": "web_scraper", "arguments": "{}", "content": "Running Scraper."}
                
            elif iterations == 2:
                # Fulfill step 4 manually here since the actual tool generation code in real ExecutionEngine will execute the dummy mod.run
                plan_dir = "workspaces/default/outputs"
                with open(os.path.join(plan_dir, "ai_tools.json"), "w") as f: json.dump({"tools": "10 scraped"}, f)
                with open(os.path.join(plan_dir, "ai_saas.json"), "w") as f: json.dump({"saas": "data"}, f)
                return {"content": "Data scraped. Need trend_analyzer module.", "tool": None}

            elif iterations == 3:
                return {"tool": "trend_analyzer", "arguments": "{}", "content": "Running Trend Analyzer."}

            elif iterations == 4:
                # Fulfill steps 5 and 6
                plan_dir = "workspaces/default/outputs"
                with open(os.path.join(plan_dir, "analysis.json"), "w") as f: json.dump({"analysis": "insights"}, f)
                with open(os.path.join(plan_dir, "trend_chart.png"), "w") as f: f.write("fake png data")
                return {"content": "Analysis and chart generated. Need report_generator module.", "tool": None}

            elif iterations == 5:
                return {"tool": "report_generator", "arguments": "{}", "content": "Running Report Generator."}

            elif iterations == 6:
                # Fulfill steps 7 and 8
                plan_dir = "workspaces/default/outputs"
                with open(os.path.join(plan_dir, "ai_market_report.html"), "w") as f: f.write("<html>REPORT</html>")
                import zipfile
                with zipfile.ZipFile(os.path.join(plan_dir, "report_bundle.zip"), 'w') as z:
                    z.writestr("ai_market_report.html", "<html>REPORT</html>")
                return {"content": "success: Artifacts packaged.", "tool": None}

        return {"tool": None, "arguments": None, "content": "Execution complete."}

    async def validate_key(self) -> Optional[str]:
        return "mock-key"
