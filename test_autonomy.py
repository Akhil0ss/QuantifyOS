
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock environment
os.environ["TEST_MODE"] = "true"
os.environ["FIREBASE_SERVICE_ACCOUNT_JSON"] = "missing.json"
os.environ["FIREBASE_DATABASE_URL"] = "http://localhost:9000"

from unittest.mock import MagicMock
import app.services.tasks
import app.services.telemetry

# Global mock storage
MOCK_DB = {"status": "pending", "goal": "Check system health", "result": None}
MOCK_LOGS = []

# Mock TaskService
class MockTaskService:
    def create_task(self, ws, goal): return "demo_task_123"
    def update_status(self, tid, status, result=None):
        if tid == "demo_task_123":
            MOCK_DB["status"] = status
            if result: MOCK_DB["result"] = result
    def send_heartbeat(self, tid): pass
    def get(self, tid): return MOCK_DB if tid == "demo_task_123" else None

# Mock TelemetryService
class MockTelemetryService:
    def log_process(self, ws, tid, action, details, category="execution"):
        MOCK_LOGS.append({"action": action, "details": str(details), "category": category, "timestamp": 0})
    def get_task_traces(self, ws, tid): return MOCK_LOGS

# Mock ConfigService
class MockConfigService:
    def get_ai_config(self, uid):
        return {
            "active_provider_id": "mock_openai",
            "fallback_pool": [
                {
                    "id": "mock_openai",
                    "mode": "api",
                    "provider": "openai",
                    "performance_tier": "high"
                }
            ]
        }

# Mock ReplayStore
class MockReplayStore:
    def __init__(self, ws): pass
    def start_session(self, tid): return "mock_session"
    def save_memory_snapshot(self, sid, snap): pass
    def save_tool_version(self, sid, name, ver, fhash, fpath): pass
    def finish_session(self, sid, original_result=""): pass

# Mock SQLiteMemoryStore
class MockMemoryStore:
    def __init__(self, ws): pass
    def export_snapshot(self): return "{}"

# Inject Mocks
app.services.tasks.TaskService = MockTaskService
app.services.telemetry.TelemetryService = MockTelemetryService
import app.services.entities
app.services.entities.ConfigService = MockConfigService

import app.services.replay_store
app.services.replay_store.ReplayStore = MockReplayStore
import app.services.memory_store
app.services.memory_store.SQLiteMemoryStore = MockMemoryStore

# Mock WorkspaceManager to avoid path errors
import app.core.saas
class MockWM:
    def __init__(self, ws): pass
    def get_path(self, name): return "missing_path.json"
app.core.saas.WorkspaceManager = MockWM

# Mock Memory
class MockTopologicalMemory:
    def __init__(self, ws): pass
    def get_episodic_context(self, goal): return []
    def query_nodes_by_type(self, t): return []
    def get_contextual_strategies(self, goal): return []

# Mock Intelligence
class MockIntelligenceEngine:
    def __init__(self, ws): pass
    def record_task_result(self, success, duration): pass
    def record_evolution_result(self, success): pass
    def get_contextual_strategies(self, goal): return []

# Mock Evolution
class MockEvolutionEngine:
    def __init__(self, provider, user_id): pass
    async def reflect_on_task(self, **kwargs): pass

# Mock Planning
class MockPlanningEngine:
    def __init__(self, provider, user_id): pass
    async def generate_plan(self, **kwargs):
        return [{"step": "1", "tool": "none", "description": "Mock health check"}]

# Mock Risk
class MockRiskEngine:
    def evaluate_plan(self, plan):
        return {"is_high_risk": False, "summary": "Low risk mock"}

# Mock Execution
class MockExecutionEngine:
    def __init__(self, provider, user_id=None): pass
    async def execute_plan(self, workspace_id, task_id, plan):
        return "System check complete: All mock parameters optimal. Resiliency pulse active."

# Mock Module Generator
class MockModuleGenerator:
    def __init__(self, provider_config, user_id): pass
    async def generate_module(self, gap, workspace_id):
        return {"status": "success", "assigned_name": "mock_tool"}

# Inject Mocks
import app.autonomy.memory
app.autonomy.memory.TopologicalMemory = MockTopologicalMemory
import app.autonomy.intelligence
app.autonomy.intelligence.IntelligenceEngine = MockIntelligenceEngine
import app.autonomy.evolution
app.autonomy.evolution.EvolutionEngine = MockEvolutionEngine
import app.autonomy.planning
app.autonomy.planning.PlanningEngine = MockPlanningEngine
import app.autonomy.risk
app.autonomy.risk.RiskEngine = MockRiskEngine
import app.autonomy.execution
app.autonomy.execution.ExecutionEngine = MockExecutionEngine
import app.autonomy.generator
app.autonomy.generator.ModuleGenerator = MockModuleGenerator
import app.autonomy.execution
app.autonomy.execution.IntelligenceEngine = MockIntelligenceEngine
app.autonomy.execution.TaskService = MockTaskService
app.autonomy.execution.TelemetryService = MockTelemetryService

from app.services.orchestrator import run_autonomy_loop

async def run_demo():
    workspace_id = "demo_workspace"
    user_uid = "KWEKMDSFDCTrbWHFZPrYt4gtGAx1"
    goal = "Check system health and provide a summary."
    
    print(f"🚀 STARTING DEMO: {goal}")
    
    # 1. Create Task
    ts = MockTaskService()
    task_id = ts.create_task(workspace_id, goal)
    print(f"✅ Task Created: {task_id}")
    
    # 2. Run Autonomy Loop
    print("🧠 Engaging Autonomy Loop...")
    # Wrap in try/except to handle expected "mock" provider behavior
    try:
        await run_autonomy_loop(workspace_id, task_id, user_uid)
    except Exception as e:
        import traceback
        print(f"⚠️ Loop failed with error: {e}")
        traceback.print_exc()
    
    # 3. Retrieve Logs
    print("\n📜 EXECUTION LOGS:")
    telemetry = MockTelemetryService()
    traces = telemetry.get_task_traces(workspace_id, task_id)
    
    for t in traces:
        category = t.get('category', 'info').upper()
        action = t.get('action', '')
        details = t.get('details', '')
        print(f"[{category}] {action}: {details}")
        
    # 4. Final Result
    task = ts.get(task_id)
    print(f"\n🎯 FINAL RESULT: {task.get('result')}")
    print(f"📊 STATUS: {task.get('status')}")

if __name__ == "__main__":
    asyncio.run(run_demo())
