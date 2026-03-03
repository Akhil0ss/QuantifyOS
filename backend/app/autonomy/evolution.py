from typing import Dict, Any, List
from app.services.ai_drivers.router import ModelRouter
from app.services.telemetry import TelemetryService
from app.services.base_rtdb import BaseRTDBService
import json
import uuid

class EvolutionEngine:
    """
    Reflects on task execution traces (success or failure) to extract learned strategies.
    Stores these lessons in user-owned memory.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str = "default_user"):
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        self.telemetry = TelemetryService()
        self.strategy_db = BaseRTDBService("memory") # /memory/{workspace_id}/strategies
        self.user_id = user_id

    async def reflect_on_task(self, workspace_id: str, task_id: str, goal: str, status: str, result: str):
        """
        Gathers traces, analyzes them, and extracted learned rules.
        """
        print(f"Starting evolutionary reflection on task {task_id}")
        
        # 1. Fetch traces
        traces = self.telemetry.get_task_traces(workspace_id, task_id)
        if not traces:
            return

        # Format traces for the LLM
        trace_summary = "\n".join([f"[{t['category'].upper()}] {t['action']}: {str(t['details'])[:200]}" for t in traces])
        
        prompt = f"""
        Task Goal: {goal}
        Final Status: {status}
        Final Result: {result}
        
        Execution Trace:
        {trace_summary}
        
        You are the Evolutionary Learning Engine of an Autonomous OS.
        Analyze the execution trace. Did the agent encounter an error, use a tool incorrectly, or discover a highly effective pattern?
        Extract a single, concise, generalized "Strategy Lesson" from this execution that will help future agents avoid the same mistake or replicate the success.
        If the execution was trivial and no new lesson is needed, return an empty string.
        
        Format your response as a JSON object:
        {{
            "lesson_learned": "string or empty",
            "category": "tool_usage|error_recovery|efficiency|general",
            "confidence": "high|medium|low"
        }}
        """
        
        self.telemetry.log_process(workspace_id, task_id, "Evolution Started", "Reflecting on execution traces...", "system")
        
        try:
            response = await self.provider.generate_text(
                prompt=prompt,
                system_message="You are the self-improvement module. Extract actionable principles."
            )
        except Exception as e:
            print(f"EVOLUTION: Primary provider failed during reflection: {e}. Falling back to pool...")
            response = await ModelRouter.get_best_provider(
                self.user_id, 
                prompt=prompt,
                system_message="You are the self-improvement module."
            )
        
        try:
            data = json.loads(response[response.find('{'):response.rfind('}')+1])
            lesson = data.get("lesson_learned")
            
            from app.autonomy.memory import TopologicalMemory, MemoryLayer
            memory = TopologicalMemory(workspace_id)
            
            # 1. ALWAYS record the episodic task node
            task_node_id = memory.record_execution(task_id, goal, result, status)
            
            if lesson and lesson.strip():
                # 2. Learn the strategy lesson node
                strategy_node_id = memory.learn_concept(
                    name=f"Strategy: {goal[:20]}",
                    node_type="strategy_lesson",
                    data={
                        "lesson": lesson,
                        "goal_pattern": goal,
                        "category": data.get("category", "general"),
                        "confidence": data.get("confidence", "medium"),
                        "source_task": task_id
                    },
                    layer=MemoryLayer.PROCEDURAL
                )
                
                # 3. Link them in the topology
                memory.link(strategy_node_id, "optimizes", task_node_id)
                
                self.telemetry.log_process(workspace_id, task_id, "Strategy Learned (Topology)", lesson, "system")
                print(f"Learned new strategy in topology: {lesson}")
            else:
                self.telemetry.log_process(workspace_id, task_id, "Evolution Complete", "No novel strategy extracted.", "system")
                
        except Exception as e:
            self.telemetry.log_process(workspace_id, task_id, "Evolution Error", str(e), "error")
            print(f"Failed to extract strategy: {e}")
