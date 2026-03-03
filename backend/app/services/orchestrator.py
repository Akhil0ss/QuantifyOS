import asyncio
from app.services.entities import ConfigService
from app.autonomy.planning import PlanningEngine
from app.autonomy.execution import ExecutionEngine
from app.autonomy.evolution import EvolutionEngine
from app.services.tasks import TaskService

async def run_autonomy_loop(workspace_id: str, task_id: str, user_uid: str):
    """
    Background worker that runs the autonomy loop out-of-band of the HTTP request.
    1. Fetch AI Config
    2. Generate Plan
    3. Execute Plan
    """
    print(f"Starting autonomy loop for task {task_id}")
    task_service = TaskService()
    try:
        # Update status to acknowledge starting
        task_service.update_status(task_id, "running", result="Initializing Orchestrator...")
        
        # Fetch configurations
        config_service = ConfigService()
        ai_config = config_service.get_ai_config(user_uid)
        
        if not ai_config or not ai_config.get("fallback_pool"):
            task_service.update_status(task_id, "failed", result="No active AI provider configured for this user.")
            return
            
        active_id = ai_config.get("active_provider_id")
        provider_def = next((p for p in ai_config["fallback_pool"] if p.get("id") == active_id), ai_config["fallback_pool"][0])

        task = task_service.get(task_id)
        if not task:
            print("Task not found in DB")
            return
            
        goal = task["goal"]
        
        # --- STABILITY: Replay Recording Setup ---
        from app.services.replay_store import ReplayStore
        from app.services.ai_drivers.router import set_replay_session
        from app.services.memory_store import SQLiteMemoryStore
        
        replay_store = ReplayStore(workspace_id)
        session_id = replay_store.start_session(task_id)
        
        # 1. Snapshot Topological Memory Graph
        memory_store = SQLiteMemoryStore(workspace_id)
        snapshot_json = memory_store.export_snapshot()
        replay_store.save_memory_snapshot(session_id, snapshot_json)
        
        # 2. Activate ContextVar for Router
        set_replay_session(session_id, workspace_id)
        
        # 3. Snapshot Available Tool Versions
        import os, json
        from app.core.saas import WorkspaceManager
        import hashlib
        wm = WorkspaceManager(workspace_id)
        idx_path = wm.get_path("capability_index.json")
        if os.path.exists(idx_path):
            with open(idx_path, 'r') as f:
                cap_idx = json.load(f)
                for tool_name, cap_data in cap_idx.items():
                    if cap_data.get("available") and cap_data.get("file_path"):
                        fpath = cap_data["file_path"]
                        if os.path.exists(fpath):
                            with open(fpath, 'r') as tf:
                                fhash = hashlib.sha256(tf.read().encode()).hexdigest()
                            replay_store.save_tool_version(
                                session_id, tool_name, cap_data.get("version", "v1"), fhash, fpath
                            )

        # 1. Planning Phase
        # Check if we already have an approved plan
        plan = task.get("approved_plan")
        if not plan:
            task_service.update_status(task_id, "running", result=f"Generating plan using {provider_def.get('provider')}...")
            planner = PlanningEngine(provider_def, user_id=user_uid)
            plan = await planner.generate_plan(workspace_id=workspace_id, task_id=task_id, goal=goal)
            
            # --- Phase 27: Risk Evaluation ---
            from app.autonomy.risk import RiskEngine
            risk_engine = RiskEngine()
            risk_report = risk_engine.evaluate_plan(plan)
            
            if risk_report["is_high_risk"] and task.get("status") != "approved":
                # Pause and request approval
                task_service.update(
                    {
                        "status": "awaiting_approval", 
                        "result": f"RISK ALERT: {risk_report['summary']}",
                        "approved_plan": plan # Save plan for later
                    }, 
                    task_id
                )
                
                # Notify via WhatsApp
                try:
                    from app.services.whatsapp_service import WhatsAppService
                    wa = WhatsAppService(user_uid)
                    await wa.notify_ceo_event(
                        f"⚠️ RISK ALERT: Your CEO has generated a plan with high-stakes actions:\n\n"
                        f"{risk_report['summary']}\n\n"
                        f"Please go to the Dashboard to Review & Approve, or reply 'Proceed' here."
                    )
                except Exception as wa_err:
                    print(f"Failed to send risk notification: {wa_err}")
                
                return # Exit loop until approved
        
        print(f"Executing plan: {plan}")

        # 2. Execution Phase
        task_service.update_status(task_id, "running", result="Executing plan steps...")
        executor = ExecutionEngine(provider_def, user_id=user_uid)
        await executor.execute_plan(workspace_id, task_id, plan)

        # 3. Evolutionary Reflection (Post-Execution)
        # Re-fetch task to get final result
        completed_task = task_service.get(task_id)
        
        # --- STABILITY: Finalize Replay Recording ---
        final_status = completed_task.get("status", "unknown")
        final_result = completed_task.get("result", "")
        replay_store.finish_session(session_id, original_result=final_result)
        
        evolution = EvolutionEngine(provider_def, user_id=user_uid)
        await evolution.reflect_on_task(
            workspace_id=workspace_id,
            task_id=task_id,
            goal=goal,
            status=final_status,
            result=final_result
        )

    except Exception as e:
        print(f"Autonomy loop failed: {e}")
        task_service.update_status(task_id, "failed", result=f"System Error: {str(e)}")
        
        # Trigger evolutionary reflection on failure too
        try:
            evolution = EvolutionEngine(provider_def, user_id=user_uid)
            await evolution.reflect_on_task(
                workspace_id=workspace_id,
                task_id=task_id,
                goal=task.get("goal") if 'task' in locals() and task else "Unknown Goal",
                status="failed",
                result=f"System Error: {str(e)}"
            )
        except Exception as reflect_err:
            print(f"Failed to reflect on error: {reflect_err}")
