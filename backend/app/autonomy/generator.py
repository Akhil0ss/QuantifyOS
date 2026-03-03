import json
import os
import time
import shutil
from typing import Dict, Any, List, Optional
from app.services.ai_drivers.router import ModelRouter
from app.autonomy.structural import StructuralEngine
from app.services.telemetry import TelemetryService
from app.autonomy.intelligence import IntelligenceEngine
from app.core.saas import WorkspaceManager
from app.core.security import SecurityEngine
from app.autonomy.dependency_resolver import DependencyResolver
from app.autonomy.capability_engine import CapabilityManager, CapabilityStatus

class ModuleGenerator:
    """
    Plans, generates, tests, and deploys new autonomous modules/tools.
    """
    def __init__(self, provider_config: Dict[str, Any], user_id: str):
        self.provider = ModelRouter.get_provider_from_config(provider_config, user_id=user_id)
        self.structural = StructuralEngine(user_id)
        self.telemetry = TelemetryService()
        self.user_id = user_id

    async def generate_module(self, gap: Dict[str, Any], workspace_id: str) -> Dict[str, Any]:
        """
        Takes a capability gap and generates a verifiable Python module.
        Uses versioned file names and archives previous versions.
        """
        wm = WorkspaceManager(workspace_id)
        intelligence = IntelligenceEngine(workspace_id)
        cap_mgr = CapabilityManager(workspace_id)
        cap_name = gap['capability_name'].lower().replace(' ', '_')
        cap_mgr.set_status(cap_name, CapabilityStatus.DRAFT, "Planning module...")
        self.telemetry.log_system_event(self.user_id, "Generator", f"Planning module for: {gap['capability_name']}")
        
        # ── VERSION GOVERNANCE: Timestamped file naming ──
        version_ts = int(time.time())
        versioned_name = f"evolved_{cap_name}_v{version_ts}"
        
        # Check for existing version and archive it
        self._archive_previous_version(wm, cap_name)
        
        # 1. Generate Module Plan
        is_hardware = gap.get("is_hardware", False)
        
        plan_prompt = f"""
        Design a standalone {'Hardware Driver' if is_hardware else 'Python module'} to solve this capability gap:
        GAP: {gap['capability_name']}
        DESCRIPTION: {gap['description']}
        {'ADDITIONAL HARDWARE INFO: ' + json.dumps(gap.get('hardware_context', {})) if is_hardware else ''}
        
        The module must:
        - Be a single file in '{wm.get_tool_path(f"{versioned_name}.py")}'
        - Include a main function `run(**kwargs)`
        - Include type hints and documentation.
        - Be compatible with the existing registry system.
        
        Return a JSON object:
        {{
            "file_path": "path",
            "dependencies": [],
            "logic_plan": "description"
        }}
        """
        
        # 2. Generate Code
        code_prompt = f"""
        Generate the Python source code for the following plan:
        GAP: {gap['capability_name']}
        
        Follow these architecture rules:
        - Use clean, modular code.
        - Use standard libraries if possible.
        - Handle errors gracefully.
        
        Return ONLY the raw Python source code. No markdown.
        """
        
        try:
            # Plan
            response = await self.provider.generate_text(prompt=plan_prompt, system_message="You are a Lead Software Architect.")
            plan = json.loads(response[response.find('{'):response.rfind('}')+1])
            
            # Code
            code = await self.provider.generate_text(prompt=code_prompt, system_message="You are an expert Python Developer.")
            code = code.strip()
            if code.startswith("```python"):
                 code = code[9:-3].strip()
            elif code.startswith("```"):
                 code = code[3:-3].strip()

            # Calculate module_name for imports (cross-platform)
            clean_path = os.path.normpath(plan['file_path']).replace('.py', '')
            module_name = clean_path.replace(os.sep, '.')

            # 3. Security Validation
            self.telemetry.log_system_event(self.user_id, "Generator", f"Scanning module {plan['file_path']} for security risks...")
            security = SecurityEngine(workspace_id)
            validation = security.validate_code(code)
            
            if not validation["is_safe"]:
                error_msg = f"SECURITY REJECTION: Unsafe patterns detected: {validation['alerts']}"
                print(f"GENERATOR: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "capability": gap['capability_name'],
                    "message": error_msg
                }

            # 4. Auto-Install Dependencies
            cap_mgr.set_status(cap_name, CapabilityStatus.INSTALLING, "Installing dependencies...")
            self.telemetry.log_system_event(self.user_id, "Generator", f"Resolving dependencies for {gap['capability_name']}...")
            dep_report = DependencyResolver.resolve_all(code)
            if dep_report["installed"]:
                pkg_names = [d['package'] for d in dep_report['installed']]
                self.telemetry.log_system_event(self.user_id, "Generator", f"Auto-installed: {', '.join(pkg_names)}")
            if not dep_report["all_resolved"]:
                failed_deps = [d['package'] for d in dep_report['failed']]
                self.telemetry.log_system_event(self.user_id, "Generator", f"WARNING: Could not install: {', '.join(failed_deps)}")

            # 5. Test in Sandbox
            cap_mgr.set_status(cap_name, CapabilityStatus.TESTING, "Running sandbox tests...")
            self.telemetry.log_system_event(self.user_id, "Generator", f"Testing module {plan['file_path']} in sandbox...")
            
            # Create a test for the module using absolute direct loading
            abs_mod_path = os.path.abspath(plan['file_path']).replace('\\', '/')
            test_code = f"""
import sys
import importlib.util
import pytest
import asyncio

# Direct load the module under test
spec = importlib.util.spec_from_file_location("test_mod", "{abs_mod_path}")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

@pytest.mark.asyncio
async def test_module_execution():
    # Simple smoke test
    result = await mod.run()
    assert result is not None
"""
            
            test_path = wm.get_path(f"test_evolved_{gap['capability_name'].lower().replace(' ', '_')}.py")
            
            # Apply patches (write files)
            await self.structural.apply_patch(plan['file_path'], code)
            await self.structural.apply_patch(test_path, test_code)
            
            # Run tests
            test_results = await self.structural.run_tests(test_path)
            
            if test_results["success"]:
                # --- NEW: Real Capability Verification ---
                self.telemetry.log_system_event(self.user_id, "Generator", f"Running real execution test for {gap['capability_name']}...")
                
                # 1. Generate Real Test Input
                input_prompt = f"Generate a JSON object of sample input arguments for the 'run' function of a module designed for: {gap['capability_name']}. Description: {gap['description']}"
                input_resp = await self.provider.generate_text(input_prompt)
                try:
                    test_args = json.loads(input_resp[input_resp.find('{'):input_resp.rfind('}')+1])
                except:
                    test_args = {}

                # 2. Execute Module
                start_time = time.time()
                try:
                    # Dynamic import and execution
                    # Ensure the current directory (project root) is in sys.path
                    import sys
                    import importlib.util
                    
                    if not os.path.exists(plan['file_path']):
                        raise Exception(f"File {plan['file_path']} not found before import.")
                    
                    # Direct loading from file location (bypass package issues)
                    module_name = gap['capability_name'].lower().replace(' ', '_')
                    spec = importlib.util.spec_from_file_location(module_name, plan['file_path'])
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)
                    
                    if asyncio.iscoroutinefunction(mod.run):
                        exec_result = await mod.run(**test_args)
                    else:
                        exec_result = mod.run(**test_args)
                    
                    execution_time = time.time() - start_time
                    success = exec_result is not None
                except Exception as e:
                    print(f"VERIFICATION: Real execution failed: {e}")
                    success = False
                    execution_time = time.time() - start_time

                # 3. Calculate Validation Score (Simple heuristic)
                val_score = 1.0 if success else 0.0
                if success and execution_time > 5: val_score -= 0.1 # Penalty for slowness
                
                # 4. Update Capability Index
                index_file = wm.get_path("capability_index.json")
                index = {}
                if os.path.exists(index_file):
                    with open(index_file, "r") as f:
                        index = json.load(f)
                
                cap_key = gap['capability_name'].lower().replace(' ', '_')
                
                if is_hardware:
                    if "hardware_capabilities" not in index:
                        index["hardware_capabilities"] = {}
                    index["hardware_capabilities"][cap_key] = {
                        "available": success,
                        "validation_score": val_score,
                        "last_tested": int(time.time()),
                        "file_path": plan['file_path'],
                        "version": version_ts,
                        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
                else:
                    # Store previous version path for rollback
                    previous_path = index.get(cap_key, {}).get("file_path")
                    index[cap_key] = {
                        "available": success,
                        "status": CapabilityStatus.WORKING if success else CapabilityStatus.FAILED,
                        "validation_score": val_score,
                        "last_tested": int(time.time()),
                        "file_path": plan['file_path'],
                        "version": version_ts,
                        "previous_version_path": previous_path,
                        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
                
                with open(index_file, "w") as f:
                    json.dump(index, f, indent=2)

                # Save dependencies to capability_dependencies.json
                cap_mgr.register_working(cap_key, plan['file_path'], val_score, dep_report.get('imports', [])) if success else cap_mgr.register_failed(cap_key, 'Execution test failed', 1)

                # 5. Update Reliability Log
                rel_file = wm.get_path("capability_reliability.json")
                reliability = {}
                if os.path.exists(rel_file):
                    with open(rel_file, "r") as f:
                        reliability = json.load(f)
                
                if cap_key not in reliability:
                    reliability[cap_key] = {"success_count": 0, "fail_count": 0, "avg_time": 0}
                
                stats = reliability[cap_key]
                if success:
                    stats["success_count"] += 1
                else:
                    stats["fail_count"] += 1
                
                total = stats["success_count"] + stats["fail_count"]
                stats["avg_time"] = (stats["avg_time"] * (total - 1) + execution_time) / total
                
                with open(rel_file, "w") as f:
                    json.dump(reliability, f, indent=2)

                intelligence.record_evolution_result(success)
                return {
                    "success": success,
                    "file_path": plan['file_path'],
                    "capability": gap['capability_name'],
                    "validation_score": val_score,
                    "message": "Module verified in sandbox and real execution." if success else "Module passed sandbox but FAILED real execution."
                }
            else:
                intelligence.record_evolution_result(False)
                return {
                    "success": False,
                    "error": test_results["error"],
                    "output": test_results["output"],
                    "capability": gap['capability_name'],
                    "message": f"Sandbox testing failed: {test_results['error']}\nOutput: {test_results['output']}"
                }

        except Exception as e:
            try:
                intelligence.record_evolution_result(False)
            except: pass
            return {
                "success": False, 
                "error": str(e), 
                "capability": gap['capability_name'],
                "message": f"Generation exception: {str(e)}"
            }

    def _archive_previous_version(self, wm: WorkspaceManager, cap_name: str):
        """
        Archives the previous version of a capability module before overwriting.
        """
        index_file = wm.get_path("capability_index.json")
        if not os.path.exists(index_file):
            return
        
        try:
            with open(index_file, "r") as f:
                index = json.load(f)
            
            existing = index.get(cap_name)
            if not existing or not existing.get("file_path"):
                return
            
            old_path = existing["file_path"]
            if not os.path.exists(old_path):
                return
            
            # Create archive directory
            archive_dir = wm.get_path("tools/archive")
            os.makedirs(archive_dir, exist_ok=True)
            
            # Copy to archive with version info
            archive_name = os.path.basename(old_path)
            archive_path = os.path.join(archive_dir, archive_name)
            shutil.copy2(old_path, archive_path)
            
            self.telemetry.log_system_event(
                self.user_id, "Generator",
                f"Archived previous version: {old_path} -> {archive_path}"
            )
        except Exception as e:
            print(f"GENERATOR: Failed to archive previous version: {e}")

    def rollback_capability(self, workspace_id: str, cap_name: str) -> Dict[str, Any]:
        """
        Rolls back a capability to its previous stable version.
        """
        wm = WorkspaceManager(workspace_id)
        index_file = wm.get_path("capability_index.json")
        
        if not os.path.exists(index_file):
            return {"success": False, "error": "No capability index found."}
        
        with open(index_file, "r") as f:
            index = json.load(f)
        
        cap_data = index.get(cap_name)
        if not cap_data:
            return {"success": False, "error": f"Capability '{cap_name}' not found in index."}
        
        previous_path = cap_data.get("previous_version_path")
        if not previous_path:
            return {"success": False, "error": "No previous version available for rollback."}
        
        # Check archive
        archive_dir = wm.get_path("tools/archive")
        archived_name = os.path.basename(previous_path)
        archived_path = os.path.join(archive_dir, archived_name)
        
        if not os.path.exists(archived_path):
            return {"success": False, "error": f"Archived file not found: {archived_path}"}
        
        # Restore: copy archived version to the current path
        current_path = cap_data["file_path"]
        try:
            shutil.copy2(archived_path, current_path)
            
            # Update index
            cap_data["file_path"] = current_path
            cap_data["status"] = CapabilityStatus.WORKING
            cap_data["rolled_back"] = True
            cap_data["rollback_from"] = cap_data.get("version")
            index[cap_name] = cap_data
            
            with open(index_file, "w") as f:
                json.dump(index, f, indent=2)
            
            self.telemetry.log_system_event(
                self.user_id, "Generator",
                f"ROLLBACK: Restored {cap_name} from {archived_path}"
            )
            
            return {"success": True, "message": f"Rolled back {cap_name} to previous version."}
        except Exception as e:
            return {"success": False, "error": f"Rollback failed: {str(e)}"}
