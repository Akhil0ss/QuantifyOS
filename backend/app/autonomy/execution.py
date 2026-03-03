from typing import List, Dict, Any, Optional
from app.services.ai_drivers.router import ModelRouter
from app.core.tool_engine import registry
from app.services.tasks import TaskService
from app.services.telemetry import TelemetryService
from app.autonomy.intelligence import IntelligenceEngine
import json
import time

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
        Implements V15 "Never Say No" Logic.
        """
        task = self.task_service.get(task_id)
        goal = task["goal"]
        context = ""
        success_count = 0
        start_time = time.time()
        intelligence = IntelligenceEngine(workspace_id)

        # Update status to show we are executing the plan
        self.task_service.update_status(task_id, "running", result="Plan generated. Starting execution...")

        for step in plan:
            print(f"Executing step {step['step']}: {step['description']}")
            self.telemetry.log_process(workspace_id, task_id, f"Executing Step {step['step']}", step['description'], "system")
            
            # 1. Ask the AI to execute the specific tool for this step with current context
            available_tools = registry.get_openai_tools()
            
            # --- V13 Dynamic Tool Handling ---
            is_dynamic_tool = step.get("tool", "").startswith("dynamic_tool_")
            if is_dynamic_tool:
                self.telemetry.log_process(workspace_id, task_id, "Dynamic Tool Prepare", f"Setting up execution for generated tool {step['tool']}", "system")
                # For a dynamic tool, we might not have it in the standard registry schema yet.
                # So we ask the AI to generate the kwargs based on the goal and context, without a formal schema.
                ai_decision_prompt = f"Executing a newly written python tool for step: {step['description']}. OVERALL GOAL: {goal}. CONTEXT: {context}. What JSON arguments should be passed to the main function of this new tool? Return ONLY a valid JSON dictionary."
                from app.services.ai_drivers.router import ModelRouter
                ai_decision = await ModelRouter.get_best_provider(
                    self.user_id, 
                    prompt=ai_decision_prompt, 
                    system_message="Return ONLY JSON keyword arguments for a python function."
                )
                try:
                    # Clean up standard json block formatting
                    clean_json = ai_decision.replace("```json", "").replace("```", "").strip()
                    tool_args = json.loads(clean_json)
                    tool_name = step["tool"]
                    
                    self.telemetry.log_process(workspace_id, task_id, "Tool Exectuion Start", {"tool": tool_name, "args": tool_args, "is_dynamic": True}, "tool_call")
                    
                    # Execute via Sandbox
                    from app.autonomy.sandbox.tool_creator import SecureSandbox
                    sandbox = SecureSandbox()
                    tool_result = sandbox.execute(step["generated_code"], tool_args)
                    
                    context += f"\nStep {step['step']} Result (Dynamic Tool): {str(tool_result)}"
                    self.telemetry.log_process(workspace_id, task_id, "Tool Execution Complete", str(tool_result), "tool_result")
                    
                except Exception as e:
                    context += f"\nStep {step['step']} Failed: Failed to parse arguments or execute dynamic tool. Error: {str(e)}"
                    self.telemetry.log_process(workspace_id, task_id, "Tool Error", f"Dynamic execution failed: {str(e)}", "error")
            
            # --- Phase 25: Sub-Agent Delegation ---
            elif step.get("tool", "").startswith("delegate_to_"):
                role_key = step["tool"].replace("delegate_to_", "").upper()
                from app.autonomy.sub_agents import SubAgent, SubAgentRole
                
                role_config = getattr(SubAgentRole, role_key, None)
                if role_config:
                    self.telemetry.log_process(workspace_id, task_id, f"Delegating to {role_key}", f"Spawning specialized sub-agent for: {step['description']}", "thought")
                    sub_agent = SubAgent(role_config, self.provider.config if hasattr(self.provider, 'config') else {}, self.task_service.push.__self__.path.split('/')[-1]) # Hacky user_id retrieval
                    
                    # For sub-agents, we use the description from the plan as their goal
                    sub_goal = step["description"]
                    sub_result = await sub_agent.process_delegation(workspace_id, task_id, sub_goal)
                    
                    context += f"\nStep {step['step']} Departmental Result from {role_key}: {str(sub_result)}"
                    self.telemetry.log_process(workspace_id, task_id, f"Delegation Complete ({role_key})", str(sub_result), "tool_result")
                else:
                    self.telemetry.log_process(workspace_id, task_id, "Delegation Error", f"Unknown role requested: {role_key}", "error")
                    context += f"\nStep {step['step']} Failed: Unknown sub-agent role {role_key}."
                
            else:
                # Standard Execution Loop
                self.telemetry.log_process(workspace_id, task_id, "AI Deliberation", "Evaluating tool requirements and context...", "thought")
                
                from app.services.ai_drivers.router import ModelRouter
                ai_decision = await ModelRouter.route_tool_call(
                    user_id=self.user_id,
                    goal=f"Current Step: {step['description']}. OVERALL GOAL: {goal}",
                    tools=available_tools,
                    context=context
                )

                if isinstance(ai_decision, dict) and ai_decision.get("tool"):
                    tool_name = ai_decision["tool"]
                    try:
                        tool_args = json.loads(ai_decision["arguments"])
                    except:
                        tool_args = ai_decision["arguments"] # Handle if already a dict
                    
                    self.telemetry.log_process(workspace_id, task_id, "Tool Exectuion Start", {"tool": tool_name, "args": tool_args}, "tool_call")
                    
                    # 2. Run the tool
                    tool = registry.get_tool(tool_name)
                    if tool:
                        tool_result = await tool.run(**tool_args)
                        context += f"\nStep {step['step']} Result: {str(tool_result)}"
                        self.telemetry.log_process(workspace_id, task_id, "Tool Execution Complete", str(tool_result), "tool_result")
                    else:
                        context += f"\nStep {step['step']} Failed: Tool {tool_name} not found."
                        self.telemetry.log_process(workspace_id, task_id, "Tool Error", f"Tool {tool_name} not found in registry", "error")
                    content = ai_decision.get('content') if isinstance(ai_decision, dict) else str(ai_decision)
                    context += f"\nStep {step['step']} AI Response: {content}"
                    self.telemetry.log_process(workspace_id, task_id, "AI Output", content, "thought")
                    step_success = True # Interpret AI text as success for now
                
                # --- V15 Never Say No: Alternative Strategy Hook ---
                if not step_success:
                    self.telemetry.log_process(workspace_id, task_id, "Step Failed", f"Attempting Alternative Strategy for: {step['description']}", "thought")
                    
                    alt_prompt = f"Goal: {goal}. Previous Context: {context}. STEP FAILED: {step['description']}. Provide an ALTERNATIVE strategy to achieve this step or bypass it. Return JSON with 'action' and 'description'."
                    alt_decision = await self.provider.generate_text(alt_prompt)
                    # For V15, we just log and try to use it in the context for next step
                    context += f"\nStep {step['step']} Alternative Strategy Attempted: {alt_decision}"
                    self.telemetry.log_process(workspace_id, task_id, "Recovery", "Alternative strategy injected into context.", "system")
                else:
                    success_count += 1

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
