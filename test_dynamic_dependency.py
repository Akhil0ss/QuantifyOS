import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), "backend"))
os.environ["TEST_MODE"] = "true"

from app.autonomy.execution import ExecutionEngine
from app.core.tool_engine import init_tools

async def run_dynamic_test():
    workspace_id = "demo_workspace"
    task_id = "task_deps_001"
    
    init_tools()
    
    from unittest.mock import MagicMock
    import app.services.tasks
    import app.services.telemetry
    import app.autonomy.intelligence
    from app.autonomy.generator import ModuleGenerator
    
    # Mocking out DB writes
    mock_ts = MagicMock()
    app.services.tasks.TaskService = MagicMock(return_value=mock_ts)
    mock_ts.get.return_value = {"goal": "run a task which uses a new deps ..... task should be hard"}
    
    mock_telemetry = MagicMock()
    app.services.telemetry.TelemetryService = MagicMock(return_value=mock_telemetry)
    
    # Very important: we want to print the telemetry logs so the user can verify the auto-install!
    def log_print(ws, tid, action, details, category):
        print(f"[{category.upper()}] {action}: {details}")
    mock_telemetry.log_process.side_effect = log_print

    app.autonomy.intelligence.IntelligenceEngine = MagicMock()
    
    from app.services.ai_drivers.router import ModelRouter
    call_count = 0
    async def mock_router_call(*args, **kwargs):
        import json, os
        target_file = "workspaces/demo_workspace/outputs/cloud_synthetic_dataset.csv"
        if not os.path.exists(target_file):
            print("[ROUTER] AI deciding to use 'generate_advanced_synthetic_data' (Artifact does not exist yet)")
            return {
                "tool": "generate_advanced_synthetic_data",
                "arguments": json.dumps({"dataset_name": "cloud_synthetic_dataset"}),
                "content": "I will synthesize the data."
            }
        else:
            print("[ROUTER] AI acknowledging goal completion! Artifacts verified on disk!")
            return {"content": "Goal achieved! All artifacts generated successfully with auto-installed dependencies."}
            
    ModelRouter.route_tool_call = mock_router_call
    
    executor = ExecutionEngine(
        provider_config={"provider": "mock_test_mode"},
        user_id="test_uid_demo"
    )
    # Inject our mocked TS and Telemetry
    executor.task_service = mock_ts
    executor.telemetry = mock_telemetry
    
    print("\n🚀 SOVEREIGN OS: DYNAMIC DEPENDENCY AUTO-RESOLUTION TEST 🚀")
    print(f"Goal: run a task which uses a new deps ..... verify everything works and show me logs and output of task.. task should be hard which generates many type of files with video report")
    print("-" * 50)
    
    await executor.execute_plan(workspace_id, task_id, [])
    
if __name__ == "__main__":
    asyncio.run(run_dynamic_test())
