import asyncio
import os
import sys
import json
from unittest.mock import MagicMock

# Environment Setup
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))
os.environ["TEST_MODE"] = "true"

from app.autonomy.execution import ExecutionEngine
from app.core.tool_engine import init_tools, registry

async def run_corporate_sovereignty_test():
    workspace_id = "enterprise_hq"
    task_id = "corp_vision_2030"
    
    # Initialize tools (loads existing ones)
    init_tools()
    
    from app.services.tasks import TaskService
    from app.services.telemetry import TelemetryService
    
    # Mocking DB/Telemetry for clean log output
    mock_ts = MagicMock()
    app.services.tasks.TaskService = MagicMock(return_value=mock_ts)
    mock_ts.get.return_value = {
        "goal": "Analyze 5 years of fictitious company revenue, predict 24 months of growth using Linear Regression, and generate a full investor package (CSV, Heatmap, PDF Report, and Vision Video)."
    }
    
    mock_telemetry = MagicMock()
    app.services.telemetry.TelemetryService = MagicMock(return_value=mock_telemetry)
    
    # Stream telemetry to console
    def log_print(ws, tid, action, details, category):
        print(f"[{category.upper()}] {action}: {details}")
    mock_telemetry.log_process.side_effect = log_print

    # 1. Mock the ModuleGenerator to architect a tool requiring scikit-learn
    from app.autonomy.generator import ModuleGenerator
    mock_generator = MagicMock()
    async def mock_generate_module(gap, workspace_id):
        print(f"[SYSTEM] ModuleGenerator: Architecting tool for '{gap['capability_name']}'...")
        source_code = """
import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt
from fpdf import FPDF
import cv2

async def run(**kwargs):
    print("Sovereign: Initializing Corporate Intelligence...")
    years = np.array([2021, 2022, 2023, 2024, 2025]).reshape(-1, 1)
    revs = np.array([1.2, 1.5, 2.1, 2.8, 3.5])
    model = LinearRegression().fit(years, revs)
    prediction = model.predict(np.array([[2026], [2027]]))
    os.makedirs("workspaces/enterprise_hq/outputs", exist_ok=True)
    pd.DataFrame({"Year": [2026, 2027], "Predicted_Rev": prediction}).to_csv("workspaces/enterprise_hq/outputs/strategy_data.csv")
    print("Sovereign: Rendering Corporate Vision Package...")
    return {"status": "success", "package": "Investor Vision 2026/2027", "csv": "workspaces/enterprise_hq/outputs/strategy_data.csv"}
"""
        # Save mock tool to app/tools
        tool_dir = "backend/app/tools"
        os.makedirs(tool_dir, exist_ok=True)
        with open(os.path.join(tool_dir, "corp_gen_tool.py"), "w") as f: f.write(source_code)
        
        # We don't register it yet – the ExecutionEngine will try to import it and fail,
        # then it will try to install deps.
        return {"success": True, "status": "success", "assigned_name": "corp_gen_tool"}

    mock_generator.generate_module.side_effect = mock_generate_module
    
    import app.autonomy.execution
    app.autonomy.execution.ModuleGenerator = MagicMock(return_value=mock_generator)

    # 2. Mock AI Router to decide on evolution then execution
    from app.services.ai_drivers.router import ModelRouter
    call_count = 0
    async def mock_router_call(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return {"content": "I need a corporate regression tool.", "tool": None}
        elif call_count == 2:
            # Re-register the tool manually for the mock run since we are skipping real Generator internals
            from backend.app.tools import corp_gen_tool
            from app.core.tool_engine import Tool
            new_tool = Tool(name="corp_gen_tool", description="Strategy", parameters={})
            new_tool.run = corp_gen_tool.run
            registry.register(new_tool)
            return {"tool": "corp_gen_tool", "arguments": "{}", "content": "Running tool."}
        else:
            return {"content": "Final: Package complete."}

    ModelRouter.route_tool_call = mock_router_call
    
    executor = ExecutionEngine(
        provider_config={"provider": "mock_test_mode"},
        user_id="ceo_sovereign"
    )
    executor.task_service = mock_ts
    executor.telemetry = mock_telemetry
    
    print("\n🏢 SOVEREIGN OS: CORPORATE SOVEREIGNTY STRESS TEST 🏢")
    await executor.execute_plan(workspace_id, task_id, [])
    
if __name__ == "__main__":
    asyncio.run(run_corporate_sovereignty_test())
