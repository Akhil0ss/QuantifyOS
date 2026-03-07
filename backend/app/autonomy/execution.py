import json
import time
import os
import asyncio
from typing import List, Dict, Any, Optional
from app.services.ai_drivers.router import ModelRouter
from app.core.tool_engine import registry
from app.services.tasks import TaskService
from app.services.telemetry import TelemetryService
from app.autonomy.intelligence import IntelligenceEngine
from app.services.base_rtdb import BaseRTDBService

class CredentialRequester:
    """
    Sovereign V15.1: Handles human-in-the-loop API key acquisition.
    """
    def __init__(self, user_id: str, workspace_id: str):
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.rtdb = BaseRTDBService(f"api_requests/{user_id}")

    async def request_and_wait(self, service_name: str, description: str) -> Optional[str]:
        """
        Pushes a request to RTDB and polls for a response.
        """
        request_id = f"req_{int(time.time())}"
        request_data = {
            "id": request_id,
            "service": service_name,
            "description": description,
            "status": "pending",
            "timestamp": int(time.time() * 1000)
        }
        
        print(f"SOVEREIGN: Requesting API key for {service_name}...")
        self.rtdb.set(request_data, request_id)
        
        # Poll for completion (max 5 minutes)
        timeout = 300
        start = time.time()
        while time.time() - start < timeout:
            response = self.rtdb.get(request_id)
            if response and response.get("status") == "completed":
                key = response.get("api_key")
                # Cleanup
                self.rtdb.remove(request_id)
                return key
            elif response and response.get("status") == "denied":
                self.rtdb.remove(request_id)
                return None
                
            await asyncio.sleep(5)
            
        print(f"SOVEREIGN: API request for {service_name} timed out.")
        self.rtdb.remove(request_id)
        return None

class ExecutionEngine:
    """
    Executes a pre-generated plan sequentially.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str = "default_user"):
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        self.task_service = TaskService()
        self.telemetry = TelemetryService()
        self.user_id = user_id

    async def execute_plan(self, workspace_id: str, task_id: str, plan: List[Dict[str, Any]]):
        """
        Iterates through the steps in a plan and executes them.
        Implements V15 "Never Say No" Logic + Sovereign API Acquisition.
        """
        task = self.task_service.get(task_id)
        goal = task["goal"]
        context = ""
        success_count = 0
        start_time = time.time()
        intelligence = IntelligenceEngine(workspace_id)
        cred_requester = CredentialRequester(self.user_id, workspace_id)

        # Update status to show we are executing the plan
        self.task_service.update_status(task_id, "running", result="Plan generated. Starting execution...")

        # V15 Dynamic ReAct Loop
        max_iterations = 15
        iteration = 0
        from app.autonomy.generator import ModuleGenerator
        
        while iteration < max_iterations:
            iteration += 1
            print(f"Dynamic Execution Iteration {iteration}")
            self.telemetry.log_process(workspace_id, task_id, f"Iteration {iteration}", "Analyzing current context and determining next action...", "thought")
            
            available_tools = registry.get_openai_tools()
            
            ai_decision = await ModelRouter.route_tool_call(
                user_id=self.user_id,
                goal=f"Determine the NEXT immediate step to achieve: {goal}. If the goal is completely achieved, return a textual confirmation. If you are stuck or need a new capability not in the tools list, explicitly request a new tool by describing it.",
                tools=available_tools,
                context=context
            )
            
            if isinstance(ai_decision, dict) and ai_decision.get("tool"):
                tool_name = ai_decision["tool"]
                try:
                    tool_args = json.loads(ai_decision["arguments"])
                except:
                    tool_args = ai_decision["arguments"]
                
                self.telemetry.log_process(workspace_id, task_id, "Tool Execution Start", {"tool": tool_name, "args": tool_args}, "tool_call")
                
                tool = registry.get_tool(tool_name)
                if tool:
                    try:
                        tool_result = await tool.run(**tool_args)
                        context += f"\nIteration {iteration} Result ({tool_name}): {str(tool_result)}"
                        self.telemetry.log_process(workspace_id, task_id, "Tool Execution Complete", str(tool_result), "tool_result")
                    except Exception as e:
                        error_str = str(e)
                        # Sovereign V15.1: API Key Acquisition Logic
                        if "api key" in error_str.lower() or "credentials" in error_str.lower() or "unauthorized" in error_str.lower():
                            self.telemetry.log_process(workspace_id, task_id, "Pause & Request", f"Tool {tool_name} requires missing credentials. Requesting from user...", "system")
                            
                            service_suggestion = tool_name.split('_')[0].capitalize()
                            new_key = await cred_requester.request_and_wait(service_suggestion, f"API Key required for tool: {tool_name}")
                            
                            if new_key:
                                # Apply the key (temporary injection for this run)
                                self.telemetry.log_process(workspace_id, task_id, "Key Received", "Credential acquired. Retrying tool execution...", "system")
                                # We retry the SAME iteration logic with the new key injected into environment for this process
                                os.environ[f"{service_suggestion.upper()}_API_KEY"] = new_key
                                iteration -= 1 # Re-run this iteration
                                continue
                            else:
                                context += f"\nIteration {iteration} Failed ({tool_name}): User denied or timed out credential request."
                        else:
                            context += f"\nIteration {iteration} Failed ({tool_name}): {error_str}"
                        self.telemetry.log_process(workspace_id, task_id, "Tool Error", error_str, "error")
                else:
                    context += f"\nIteration {iteration} Failed: Tool {tool_name} not found."
            else:
                # AI responded with text (either done, or needs a new tool)
                content = ai_decision.get('content') if isinstance(ai_decision, dict) else str(ai_decision)
                
                # Check if it looks like a completion statement
                final_flags = ["complete", "done", "achieved", "success", "finished", "here is the final"]
                if any(f in content.lower() for f in final_flags) and iteration > 1:
                    self.telemetry.log_process(workspace_id, task_id, "Loop Termination", "Goal achieved or max effort reached.", "thought")
                    context += f"\nIteration {iteration} Final Conclusion: {content}"
                    break
                    
                # Otherwise, it might be requesting a new tool (Mid-Flight Evolution)
                self.telemetry.log_process(workspace_id, task_id, "Mid-Flight Evolution Triggered", f"AI requested new capability: {content}", "system")
                context += f"\nIteration {iteration} Status: Triggering Module Generator for missing capability..."
                
                generator = ModuleGenerator(self.provider.config if hasattr(self.provider, 'config') else {}, self.user_id)
                gap_def = {
                    "capability_name": f"dynamic_tool_{iteration}",
                    "description": content,
                    "is_hardware": "hardware" in content.lower() or "mqtt" in content.lower() or "modbus" in content.lower()
                }
                
                try:
                    new_module = await generator.generate_module(gap_def, workspace_id)
                    if new_module and new_module.get("status") == "success":
                        context += f"\nIteration {iteration} Result: Successfully generated and loaded new tool '{new_module['assigned_name']}'."
                        self.telemetry.log_process(workspace_id, task_id, "Module Generated", f"New tool ready: {new_module['assigned_name']}", "system")
                    else:
                        context += f"\nIteration {iteration} Failed: Could not generate tool. {new_module.get('error', '')}"
                except Exception as e:
                    context += f"\nIteration {iteration} Failed: Generator crashed. {str(e)}"

        # Final result synthesis
        self.telemetry.log_process(workspace_id, task_id, "Synthesizing", "Compiling final answer...", "thought")
        
        # Inject Episodic Memories for Synthesis
        from app.autonomy.memory import TopologicalMemory
        memory = TopologicalMemory(workspace_id)
        episodic_memories = memory.get_episodic_context(goal)
        mem_context = ""
        if episodic_memories:
            mem_context = "\nRelevant Past Context:\n" + "\n".join([f"- {m['goal']}: {m['result']}" for m in episodic_memories])

        try:
            final_answer = await self.provider.generate_text(
                prompt=f"Goal: {goal}\n{mem_context}\nExecution History: {context}\nProvide a natural, conversational final response to the user. Do not mention technical tools or step numbers. Just confirm the outcome or ask follow-up questions if needed.",
                system_message="You are a proactive, conversational CEO. Speak like a human business partner, not a robot."
            )
        except Exception as e:
            print(f"EXECUTOR: Primary provider failed during synthesis: {e}. Falling back to pool...")
            from app.services.ai_drivers.router import ModelRouter
            final_answer = await ModelRouter.get_best_provider(
                self.user_id, 
                prompt=f"Goal: {goal}\n{mem_context}\nExecution History: {context}\nProvide a natural, conversational final response to the user.",
                system_message="You are a proactive, conversational CEO."
            )
        
        self.telemetry.log_process(workspace_id, task_id, "Task Completed", "Execution loops finished successfully.", "system")
        self.task_service.update_status(task_id, "done", result=final_answer)

        # Record intelligence (assume success if we reached here)
        duration = time.time() - start_time
        intelligence.record_task_result(True, duration)

        # --- Phase 24: WhatsApp Notification ---
        try:
            from app.services.whatsapp_service import get_whatsapp_service
            service = await get_whatsapp_service(workspace_id)
            if service.is_running and await service.session_manager.is_logged_in():
                # Notify the user on the primary device
                # We use a summarized version of the final answer
                summary = final_answer[:150] + "..." if len(final_answer) > 150 else final_answer
                await service.notify_ceo_event("Task Completed", f"Goal: {goal}\n\nResult:\n{summary}")
        except Exception as e:
            print(f"WhatsApp notification failed: {str(e)}")

