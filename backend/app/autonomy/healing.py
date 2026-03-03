import json
from typing import Dict, Any, List, Optional
from app.services.ai_drivers.router import ModelRouter
from app.autonomy.structural import StructuralEngine
from app.services.telemetry import TelemetryService

class SelfHealingAgent:
    """
    Phase 28: Self-Healing & Error-Correction.
    Detects errors, analyzes code, and applies fixes autonomously.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str):
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        self.structural = StructuralEngine(user_id)
        self.telemetry = TelemetryService()

    async def heal_error(self, workspace_id: str, error_traceback: str, context_files: List[str]):
        """
        Analyzes the traceback and source code to propose and apply a fix.
        """
        self.telemetry.log_process(workspace_id, "self_healing", "Healing Initiated", f"Analyzing error: {error_traceback[:100]}...", "thought")
        
        # 1. Gather Code context
        code_context = self.structural.get_codebase_context(context_files)
        
        prompt = f"""
        You are an L7 Autonomous Self-Healing Agent. 
        A system error has occurred. Analyze the traceback and the provided source code to find the root cause and propose a fix.
        
        ERROR TRACEBACK:
        {error_traceback}
        
        SOURCE CODE CONTEXT:
        {code_context}
        
        Your task:
        1. Identify the file and line causing the error.
        2. Propose a code fix.
        3. Return the full content of the file after applying the fix.
        
        FORMAT: Return a JSON object:
        {{
            "root_cause": "description",
            "file_to_fix": "path/to/file.py",
            "fixed_content": "full updated file content"
        }}
        """
        
        response = await self.provider.generate_text(
            prompt=prompt,
            system_message="You are a senior systems engineer specializing in autonomous self-repair."
        )
        
        try:
            # Clean JSON response
            proposal = json.loads(response[response.find('{'):response.rfind('}')+1])
            file_path = proposal["file_to_fix"]
            new_content = proposal["fixed_content"]
            
            self.telemetry.log_process(workspace_id, "self_healing", "Fix Proposed", f"Root Cause: {proposal['root_cause']}", "system")
            
            # --- Phase 30: Sandboxed Validation ---
            # 1. Save current state
            original_content = await self.structural._safe_read(file_path)
            
            # 2. Apply fix
            await self.structural.apply_patch(file_path, new_content)
            
            # 3. Run tests
            self.telemetry.log_process(workspace_id, "self_healing", "Validation", "Running system tests in sandbox...", "thought")
            test_result = await self.structural.run_tests()
            
            if test_result["success"]:
                self.telemetry.log_process(workspace_id, "self_healing", "Success", f"Fix applied and verified for {file_path}.", "system")
                
                # --- Phase 28: Global SaaS Memory (User feedback) ---
                try:
                    from app.services.base_rtdb import BaseRTDBService
                    global_db = BaseRTDBService("global_evolution")
                    global_db.push({
                        "type": "bug_fix",
                        "root_cause": proposal["root_cause"],
                        "file": file_path,
                        "timestamp": json.dumps(test_result.get("timestamp", "")) # or current time
                    })
                except Exception as g_err:
                    print(f"Failed to record global healing lesson: {g_err}")
                
                return True
            else:
                # Rollback
                self.telemetry.log_process(workspace_id, "self_healing", "Validation Failed", f"Rollback initiated. Error: {test_result['error']}", "error")
                await self.structural.apply_patch(file_path, original_content)
                return False
                
        except Exception as e:
            self.telemetry.log_process(workspace_id, "self_healing", "Healing Failed", str(e), "error")
            return False
