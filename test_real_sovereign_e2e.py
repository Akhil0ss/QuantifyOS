import asyncio
import os
import sys
import json
from unittest.mock import MagicMock, patch

# ────────────────────────────────────────────────────────
# 1. SOVEREIGN OS END-TO-END SYSTEM BOOTSTRAP
# ────────────────────────────────────────────────────────
# Ensure we are in the right directory and path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))
os.environ["TEST_MODE"] = "true"

from app.autonomy.execution import ExecutionEngine
from app.autonomy.generator import ModuleGenerator
from app.core.tool_engine import init_tools, registry

async def run_end_to_end_corporate_test():
    workspace_id = "global_sovereign_hq"
    task_id = "real_world_corp_task"
    
    # Initialize base tools
    init_tools()
    
    # Telemetry and Task Mocks
    import app.services.tasks
    import app.services.telemetry
    
    mock_ts = MagicMock()
    app.services.tasks.TaskService = MagicMock(return_value=mock_ts)
    mock_ts.get.return_value = {
        "goal": "Generate a Corporate Intelligence Package: Multi-variable Regression, Market Heatmap, and an Investor Vision Video."
    }
    
    mock_telemetry = MagicMock()
    app.services.telemetry.TelemetryService = MagicMock(return_value=mock_telemetry)
    
    # Live Telemetry Stream
    def log_print(ws, tid, action, details, category):
        print(f"[{category.upper()}] {action}: {details}")
    mock_telemetry.log_process.side_effect = log_print

    # ────────────────────────────────────────────────────────
    # 2. THE PARTIAL MOCK: Forcing Real Logic with Fake Inputs
    # ────────────────────────────────────────────────────────
    # We mock the AI Provider's 'generate_text' so it returns our 
    # high-complexity code, but uses the REAL Generator/Resolver/Registry.
    
    # The Tool Code (Requires statsmodels, which is not in the Docker image)
    hard_tool_code = """
import os
import asyncio
import pandas as pd
import numpy as np
import cv2
import matplotlib.pyplot as plt
import statsmodels.api as sm

async def run(**kwargs):
    print("Sovereign: Executing High-Stakes Financial Modeling...")
    
    # Use Statsmodels (The Target Dependency)
    x = np.linspace(0, 10, 100)
    y = 3 + 0.5 * x + np.random.normal(0, 1, 100)
    x = sm.add_constant(x)
    results = sm.OLS(y, x).fit()
    
    output_dir = "workspaces/global_sovereign_hq/outputs"
    os.makedirs(output_dir, exist_ok=True)
    
    # Artifact 1: Data
    csv_p = os.path.join(output_dir, "corp_stats.csv")
    pd.DataFrame({"params": results.params}).to_csv(csv_p)
    
    # Artifact 2: Heatmap
    heatmap_p = os.path.join(output_dir, "corp_heatmap.png")
    plt.imshow(np.random.rand(5,5), cmap='hot')
    plt.title("CORPORATE HEATMAP 2026")
    plt.savefig(heatmap_p)
    plt.close()
    
    # Artifact 3: Video
    video_p = os.path.join(output_dir, "corp_vision.mp4")
    out = cv2.VideoWriter(video_p, cv2.VideoWriter_fourcc(*'mp4v'), 24, (640, 480))
    for _ in range(48):
        f = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(f, "SOVEREIGN VISION", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 2)
        out.write(f)
    out.release()
    
    print("Sovereign: All High-Stakes Artifacts Rendered.")
    return {"status": "success", "msg": "Corporate package generated."}
"""

    # Mock the ModelRouter's decisions
    from app.services.ai_drivers.router import ModelRouter
    call_count = 0
    async def mock_router_decision(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return {"content": "I need to evolve a corporate_strategy_tool.", "tool": None}
        elif call_count == 2:
            return {"tool": "dynamic_tool_1", "arguments": "{}", "content": "Running tool."}
        else:
            return {"content": "Goal achieved. All dependencies resolved. Task success."}
    
    ModelRouter.route_tool_call = mock_router_decision

    # Mock the Providder to return Plan and Code
    from app.services.ai_drivers.router import ModelRouter as ModelRouterForMock
    # We need to find the provider instance or mock the Router to return a provider with mocked methods
    mock_provider = MagicMock()
    async def mock_gen_text(prompt, **kwargs):
        if "JSON object" in prompt:
            # Plan
            return json.dumps({
                "file_path": "backend/app/tools/dynamic_tool_1.py",
                "dependencies": ["statsmodels"],
                "logic_plan": "Generate financial artifacts with regression."
            })
        else:
            # Code
            return hard_tool_code
    
    mock_provider.generate_text.side_effect = mock_gen_text
    
    # Inject mock provider into the system
    with patch('app.services.ai_drivers.router.ModelRouter.get_provider_from_config', return_value=mock_provider):
        
        executor = ExecutionEngine(
            provider_config={"provider": "mock_test_mode"},
            user_id="ceo_sovereign"
        )
        executor.task_service = mock_ts
        executor.telemetry = mock_telemetry
        
        print("\n🏢 SOVEREIGN OS: REAL-WORLD END-TO-END EXECUTION 🏢")
        print("-" * 60)
        
        await executor.execute_plan(workspace_id, task_id, [])

if __name__ == "__main__":
    asyncio.run(run_end_to_end_corporate_test())
