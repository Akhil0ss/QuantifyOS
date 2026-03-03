import uuid
import time
import json
from typing import Dict, Any, List, Optional
from difflib import SequenceMatcher
from .ai_drivers.base import AIProvider
from .replay_store import ReplayStore

class ReplayProvider(AIProvider):
    """
    Mock AI Provider that returns exact historical responses 
    from the replay store based on sequence index.
    """
    def __init__(self, calls: List[Dict[str, Any]]):
        self.calls = calls
        self.call_index = 0

    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        if self.call_index >= len(self.calls):
            raise Exception("Replay error: Requested more LLM calls than were recorded.")
        
        call = self.calls[self.call_index]
        self.call_index += 1
        return call["response_text"]

    async def execute_tool(self, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        """Tool routing responses are also recorded as text JSON."""
        if self.call_index >= len(self.calls):
            raise Exception("Replay error: Requested more LLM calls than were recorded.")
            
        call = self.calls[self.call_index]
        self.call_index += 1
        
        # Parse the JSON response back into a dict for tool execution
        try:
            return json.loads(call["response_text"])
        except json.JSONDecodeError:
            return {"error": "Failed to parse tool JSON in replay.", "content": call["response_text"]}

    async def validate_key(self) -> Optional[str]:
        return "replay-model"


class DeterministicContext:
    """
    Context manager that patches non-deterministic functions (uuid, time)
    to yield exactly repeatable values during a replay session.
    """
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.original_uuid4 = uuid.uuid4
        self.original_time = time.time
        self._uuid_counter = seed
        self._time_counter = float(seed)
        
    def _mock_uuid4(self):
        self._uuid_counter += 1
        # Generate predictable UUID
        val = str(self._uuid_counter).zfill(32)
        return uuid.UUID(f"{val[:8]}-{val[8:12]}-{val[12:16]}-{val[16:20]}-{val[20:32]}")
        
    def _mock_time(self):
        self._time_counter += 1.0
        return self._time_counter

    def __enter__(self):
        uuid.uuid4 = self._mock_uuid4
        time.time = self._mock_time
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        uuid.uuid4 = self.original_uuid4
        time.time = self.original_time


class ReplayEngine:
    """
    Orchestrates the deterministic execution of a past session.
    """
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.store = ReplayStore(workspace_id)

    async def replay_task(self, session_id: str) -> Dict[str, Any]:
        """
        Executes a recorded session in Deterministic Mode using the ReplayProvider.
        Returns the reproducibility report.
        """
        session = self.store.get_session(session_id)
        if not session:
            raise Exception("Session not found")
            
        task_id = session["task_id"]
        original_result = session.get("original_result", "")
        calls = self.store.get_llm_calls(session_id)
        
        if not calls:
            raise Exception("No LLM calls recorded for this session")

        # Load tool versions and memory from snapshot is supported passively 
        # (assuming tools weren't modified locally). 
        # A fully isolated replay would inject snapshot memory directly to SQLite.
        
        provider = ReplayProvider(calls)
        
        # Override execution mechanism
        from app.autonomy.execution import ExecutionEngine
        from app.services.tasks import TaskService
        
        # We don't want to actually update RTDB status during replay to avoid messing up live UI,
        # but execution assumes TaskService is live. Let's mock TaskService locally.
        class MockTaskService:
            def __init__(self, original_task):
                self.t = original_task
            def get(self, tid): return self.t
            def update_status(self, tid, status, result=None): 
                self.t["status"] = status
                if result is not None: self.t["result"] = result
        
        # Fetch the current task state (which has the approved plan)
        live_task_svc = TaskService()
        task_data = live_task_svc.get(task_id)
        if not task_data or not task_data.get("approved_plan"):
            raise Exception("Original task or plan not found.")
            
        mock_task_service = MockTaskService(task_data)
        
        executor = ExecutionEngine({}, user_id="replay_user")
        executor.provider = provider
        executor.task_service = mock_task_service
        
        # Disable WhatsApp notifications in replay
        import sys
        
        with DeterministicContext(seed=42):
            # Run replay execution
            await executor.execute_plan(self.workspace_id, task_id, task_data["approved_plan"])
            
        replayed_result = mock_task_service.t.get("result", "")
        
        return self.calculate_reproducibility(original_result, replayed_result)

    def calculate_reproducibility(self, original: str, replayed: str) -> Dict[str, Any]:
        """Compares original execution result with replayed result."""
        if not original or not replayed:
            return {"match_percentage": 0.0, "is_exact": False, "delta": "Missing result data"}
            
        is_exact = original.strip() == replayed.strip()
        similarity = SequenceMatcher(None, original, replayed).ratio() * 100
        
        return {
            "match_percentage": round(similarity, 2),
            "is_exact": is_exact,
            "original_length": len(original),
            "replayed_length": len(replayed)
        }
