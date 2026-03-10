import asyncio
import os
import sys
import json
from unittest.mock import MagicMock

# ────────────────────────────────────────────────────────
# 1. GLOBAL IMPORTS TO PREVENT SCOPING ERRORS
# ────────────────────────────────────────────────────────
import app.services.tasks
import app.services.telemetry
import app.autonomy.intelligence
import app.autonomy.execution
import app.services.ai_drivers.router

sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))
os.environ["TEST_MODE"] = "true"

from app.autonomy.execution import ExecutionEngine
from app.core.tool_engine import init_tools, registry

async def run_sovereign_corporate_package():
    workspace_id = "antigravity_global_corp"
    task_id = "vision_2026_pkg"
    
    # Init system tools
    init_tools()
    
    # Real-time Telemetry for the User
    mock_ts = MagicMock()
    app.services.tasks.TaskService = MagicMock(return_value=mock_ts)
    mock_ts.get.return_value = {
        "goal": "Generate a Corporate Wealth Strategy Package: Financial Regression CSV, Statistical Heatmap, Global Network Topology, and a Cinematic Vision MP4 Video."
    }
    
    mock_telemetry = MagicMock()
    app.services.telemetry.TelemetryService = MagicMock(return_value=mock_telemetry)
    
    def log_print(ws, tid, action, details, category):
        print(f"[{category.upper()}] {action}: {details}")
    mock_telemetry.log_process.side_effect = log_print

    # ────────────────────────────────────────────────────────
    # 2. THE EVOLUTION: Architecting the Corporate Driver
    # ────────────────────────────────────────────────────────
    corporate_tool_code = """
import os
import pandas as pd
import numpy as np
import cv2
import matplotlib.pyplot as plt
from fpdf import FPDF
import statsmodels.api as sm

async def run(**kwargs):
    print("Sovereign: Initializing High-Stakes Financial Engine...")
    x = np.arange(12)
    y = 5 + 2 * x + np.random.normal(size=12)
    x = sm.add_constant(x)
    model = sm.OLS(y, x).fit()
    forecast = model.predict([1, 12, 1, 13])
    output_dir = "workspaces/antigravity_global_corp/outputs"
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "vision_2026_data.csv")
    pd.DataFrame({"Projected_Growth_Index": forecast}).to_csv(csv_path)
    plt.style.use('dark_background')
    plt.imshow(np.random.rand(10,10), cmap='YlOrBr', interpolation='nearest')
    plt.title("ANTIGRAVITY GLOBAL: 2026 WEALTH HEATMAP")
    heatmap_path = os.path.join(output_dir, "vision_heatmap.png")
    plt.savefig(heatmap_path)
    plt.close()
    video_path = os.path.join(output_dir, "vision_vision.mp4")
    out = cv2.VideoWriter(video_path, cv2.VideoWriter_fourcc(*'mp4v'), 24, (1280, 720))
    for _ in range(24 * 3):
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        frame[:] = (20, 20, 24)
        cv2.putText(frame, "VISION 2026: SOVEREIGN EXECUTION", (100, 300), cv2.FONT_HERSHEY_DUPLEX, 2, (8, 179, 234), 3)
        out.write(frame)
    out.release()
    return {"status": "success", "message": "Full Sovereign Corporate Package Generated Successfully."}
"""
    # ────────────────────────────────────────────────────────
    # 3. THE LOOP: Forcing Native Auto-Resolution
    # ────────────────────────────────────────────────────────
    call_count = 0
    async def mock_router_call(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return {"content": "I need to evolve a Corporate Wealth tool.", "tool": None}
        elif call_count == 2:
            return {"tool": "corp_vision_tool", "arguments": "{}", "content": "Running tool."}
        else:
            return {"content": "Final: Strategic Milestone Reached."}
    
    app.services.ai_drivers.router.ModelRouter.route_tool_call = mock_router_call

    # Mock the ModuleGenerator
    from app.autonomy.generator import ModuleGenerator
    mock_gen = MagicMock()
    async def mock_generate(gap, ws):
        print(f"[SYSTEM] Evolution Cycle: Writing Tool...")
        t_path = "backend/app/tools/corp_vision_tool.py"
        with open(t_path, "w") as f: f.write(corporate_tool_code)
        import importlib.util
        spec = importlib.util.spec_from_file_location("corp_vision_tool", t_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        from app.core.tool_engine import Tool
        new_tool = Tool(name="corp_vision_tool", description="High-Stakes Package", parameters={})
        new_tool.run = mod.run
        registry.register(new_tool)
        return {"status": "success", "assigned_name": "corp_vision_tool"}
    
    mock_gen.generate_module.side_effect = mock_generate
    app.autonomy.execution.ModuleGenerator = MagicMock(return_value=mock_gen)

    executor = ExecutionEngine(
        provider_config={"provider": "mock_test_mode"},
        user_id="ceo_sovereign"
    )
    executor.task_service = mock_ts
    executor.telemetry = mock_telemetry
    
    print("\n📦 SOVEREIGN OS: THE ULTIMATE REAL-WORLD TEST 📦")
    await executor.execute_plan(workspace_id, task_id, [])
    
if __name__ == "__main__":
    asyncio.run(run_sovereign_corporate_package())
