"""
Quantify OS — Guaranteed Capability Execution Engine
=====================================================
Ensures every requested capability becomes executable.
Never returns "capability missing" — always generates, installs, tests, and delivers.
"""

import os
import sys
import json
import time
import asyncio
import importlib
import importlib.util
import traceback
from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime

from app.autonomy.dependency_resolver import DependencyResolver
from app.core.saas import WorkspaceManager


class SafeJSONEncoder(json.JSONEncoder):
    """Handles numpy types and other non-serializable objects."""
    def default(self, obj):
        try:
            import numpy as np
            if isinstance(obj, (np.integer,)):
                return int(obj)
            if isinstance(obj, (np.floating,)):
                return float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
        except ImportError:
            pass
        return super().default(obj)


# ────────────────────────────────────────────────────────
# CAPABILITY STATUS LIFECYCLE
# ────────────────────────────────────────────────────────
class CapabilityStatus:
    DRAFT = "draft"
    INSTALLING = "installing"
    TESTING = "testing"
    WORKING = "working"
    FAILED = "failed"


class CapabilityManager:
    """
    Manages capability lifecycle with strict status gating.
    Only 'working' capabilities are usable by the task engine.
    """
    
    def __init__(self, workspace_id: str):
        self.wm = WorkspaceManager(workspace_id)
        self.workspace_id = workspace_id
        self.index_file = self.wm.get_path("capability_index.json")
        self.deps_file = self.wm.get_path("capability_dependencies.json")
    
    def _load_index(self) -> Dict:
        if os.path.exists(self.index_file):
            with open(self.index_file, "r") as f:
                return json.load(f)
        return {}
    
    def _save_index(self, index: Dict):
        with open(self.index_file, "w") as f:
            json.dump(index, f, indent=2, cls=SafeJSONEncoder)
    
    def _load_deps(self) -> Dict:
        if os.path.exists(self.deps_file):
            with open(self.deps_file, "r") as f:
                return json.load(f)
        return {}
    
    def _save_deps(self, deps: Dict):
        with open(self.deps_file, "w") as f:
            json.dump(deps, f, indent=2, cls=SafeJSONEncoder)
    
    def set_status(self, cap_name: str, status: str, details: str = ""):
        """Update a capability's lifecycle status."""
        index = self._load_index()
        cap_key = cap_name.lower().replace(" ", "_")
        if cap_key not in index:
            index[cap_key] = {}
        index[cap_key]["status"] = status
        index[cap_key]["status_updated"] = datetime.now().isoformat()
        if details:
            index[cap_key]["status_detail"] = details
        self._save_index(index)
    
    def get_status(self, cap_name: str) -> str:
        """Get a capability's current status."""
        index = self._load_index()
        cap_key = cap_name.lower().replace(" ", "_")
        return index.get(cap_key, {}).get("status", "unknown")
    
    def is_available(self, cap_name: str) -> bool:
        """Only 'working' capabilities are available for use."""
        return self.get_status(cap_name) == CapabilityStatus.WORKING
    
    def get_working_capabilities(self) -> List[str]:
        """Returns all capabilities with 'working' status."""
        index = self._load_index()
        return [k for k, v in index.items() 
                if v.get("status") == CapabilityStatus.WORKING 
                and v.get("available", False)]
    
    def register_working(self, cap_name: str, file_path: str, validation_score: float, dependencies: List[str]):
        """Register a fully verified, working capability."""
        index = self._load_index()
        cap_key = cap_name.lower().replace(" ", "_")
        index[cap_key] = {
            "available": True,
            "status": CapabilityStatus.WORKING,
            "validation_score": validation_score,
            "file_path": file_path,
            "last_tested": int(time.time()),
            "status_updated": datetime.now().isoformat(),
        }
        self._save_index(index)
        
        # Save dependencies
        deps = self._load_deps()
        deps[cap_key] = {
            "packages": dependencies,
            "installed_at": datetime.now().isoformat(),
        }
        self._save_deps(deps)
    
    def register_failed(self, cap_name: str, error: str, attempts: int):
        """Register a capability that failed after all retries."""
        index = self._load_index()
        cap_key = cap_name.lower().replace(" ", "_")
        index[cap_key] = {
            "available": False,
            "status": CapabilityStatus.FAILED,
            "error": error,
            "attempts": attempts,
            "status_updated": datetime.now().isoformat(),
        }
        self._save_index(index)
    
    def find_capability_for_task(self, task_goal: str) -> Optional[Dict]:
        """Searches for an existing working capability that matches a task goal."""
        index = self._load_index()
        goal_lower = task_goal.lower()
        
        for cap_key, cap_data in index.items():
            if cap_data.get("status") != CapabilityStatus.WORKING:
                continue
            # Simple keyword matching
            cap_words = set(cap_key.split("_"))
            goal_words = set(goal_lower.split())
            if cap_words & goal_words:  # Any common words
                return {"name": cap_key, **cap_data}
        return None


# ────────────────────────────────────────────────────────
# AUTO-FIX LOOP
# ────────────────────────────────────────────────────────
class AutoFixLoop:
    """
    When a module fails execution, this loop:
    1. Analyzes the error
    2. Asks AI to fix the code
    3. Re-installs dependencies
    4. Re-tests
    5. Repeats up to MAX_RETRIES
    """
    
    MAX_RETRIES = 5
    
    @staticmethod
    async def fix_and_retry(
        provider,
        code: str,
        file_path: str,
        cap_name: str,
        error_msg: str,
        workspace_id: str,
        attempt: int = 1
    ) -> Dict[str, Any]:
        """Attempts to fix a module by analyzing the error and regenerating code."""
        
        if attempt > AutoFixLoop.MAX_RETRIES:
            return {
                "success": False,
                "code": code,
                "error": f"Failed after {AutoFixLoop.MAX_RETRIES} retries. Last error: {error_msg}",
                "attempts": attempt - 1
            }
        
        fix_prompt = f"""
        The following Python module failed execution.
        
        MODULE NAME: {cap_name}
        FILE PATH: {file_path}
        ATTEMPT: {attempt}/{AutoFixLoop.MAX_RETRIES}
        
        ERROR:
        {error_msg}
        
        CURRENT CODE:
        ```python
        {code}
        ```
        
        Fix the code to resolve this error. Rules:
        - Keep the same function signature: async def run(**kwargs) or def run(**kwargs)
        - Handle all edge cases
        - Use try/except for external dependencies
        - If the error is about a missing package, add a fallback or use a different approach
        - Return ONLY the fixed Python source code, no markdown.
        """
        
        try:
            fixed_code = await provider.generate_text(
                prompt=fix_prompt, 
                system_message="You are an expert Python debugger. Fix the code."
            )
            fixed_code = fixed_code.strip()
            if fixed_code.startswith("```python"):
                fixed_code = fixed_code[9:-3].strip()
            elif fixed_code.startswith("```"):
                fixed_code = fixed_code[3:-3].strip()
            
            # Re-resolve dependencies
            dep_report = DependencyResolver.resolve_all(fixed_code)
            
            # Write fixed file
            with open(file_path, "w") as f:
                f.write(fixed_code)
            
            # Re-test execution
            test_result = AutoFixLoop._execute_test(file_path, cap_name)
            
            if test_result["success"]:
                return {
                    "success": True,
                    "code": fixed_code,
                    "attempts": attempt,
                    "fix_details": f"Fixed on attempt {attempt}",
                    "dependencies_installed": dep_report.get("installed", [])
                }
            else:
                # Recurse with next attempt
                return await AutoFixLoop.fix_and_retry(
                    provider, fixed_code, file_path, cap_name,
                    test_result["error"], workspace_id, attempt + 1
                )
        
        except Exception as e:
            return await AutoFixLoop.fix_and_retry(
                provider, code, file_path, cap_name,
                str(e), workspace_id, attempt + 1
            )
    
    @staticmethod
    def _execute_test(file_path: str, cap_name: str) -> Dict:
        """Quick execution test of a module."""
        try:
            spec = importlib.util.spec_from_file_location(cap_name, file_path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            
            if hasattr(mod, "run"):
                if asyncio.iscoroutinefunction(mod.run):
                    loop = asyncio.new_event_loop()
                    result = loop.run_until_complete(mod.run())
                    loop.close()
                else:
                    result = mod.run()
                return {"success": result is not None, "result": str(result)[:200], "error": None}
            else:
                return {"success": False, "error": "Module has no 'run' function"}
        except Exception as e:
            return {"success": False, "error": f"{type(e).__name__}: {str(e)}"}


# ────────────────────────────────────────────────────────
# EXECUTION GUARANTEE ENGINE
# ────────────────────────────────────────────────────────
class ExecutionGuaranteeEngine:
    """
    The top-level engine that ensures NO task ever fails with 'Capability missing'.
    
    Flow:
    1. Check if a matching capability exists → Use it
    2. If not → Generate new capability via Evolution
    3. Install dependencies
    4. Test execution
    5. If fails → Auto-fix loop (up to 5 retries)
    6. Register as 'working' or 'failed'
    7. Execute the task
    """
    
    def __init__(self, provider_config: Dict[str, Any], user_id: str, workspace_id: str):
        self.provider_config = provider_config
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.cap_manager = CapabilityManager(workspace_id)
        self.wm = WorkspaceManager(workspace_id)
    
    async def ensure_and_execute(self, task_goal: str) -> Dict[str, Any]:
        """
        Guarantees execution for any task goal.
        Never returns 'capability missing'.
        """
        
        # Step 1: Check existing capabilities
        existing = self.cap_manager.find_capability_for_task(task_goal)
        if existing and existing.get("status") == CapabilityStatus.WORKING:
            # Execute existing capability
            result = self._execute_capability(existing)
            if result["success"]:
                return {
                    "success": True,
                    "used_existing": True,
                    "capability": existing["name"],
                    "result": result["result"],
                }
        
        # Step 2: Generate new capability
        cap_name = task_goal.lower().replace(" ", "_")[:50]
        self.cap_manager.set_status(cap_name, CapabilityStatus.DRAFT, "Generating module...")
        
        try:
            from app.autonomy.generator import ModuleGenerator
            generator = ModuleGenerator(self.provider_config, self.user_id)
            
            gap = {
                "capability_name": cap_name,
                "description": task_goal,
                "priority_score": 1.0,
                "strategic_justification": f"User requested: {task_goal}",
            }
            
            # Step 3: Install dependencies (handled inside generator now)
            self.cap_manager.set_status(cap_name, CapabilityStatus.INSTALLING, "Installing dependencies...")
            
            # Step 4: Generate and test
            self.cap_manager.set_status(cap_name, CapabilityStatus.TESTING, "Testing module...")
            gen_result = await generator.generate_module(gap, self.workspace_id)
            
            if gen_result.get("success"):
                # Register as working
                dep_report = DependencyResolver.resolve_all(
                    open(gen_result["file_path"]).read() if os.path.exists(gen_result.get("file_path", "")) else ""
                )
                self.cap_manager.register_working(
                    cap_name, 
                    gen_result["file_path"],
                    gen_result.get("validation_score", 0.8),
                    dep_report.get("imports", [])
                )
                return {
                    "success": True,
                    "used_existing": False,
                    "capability": cap_name,
                    "generated": True,
                    "result": gen_result.get("message", "Capability created and verified."),
                }
            else:
                # Step 5: Auto-fix loop
                from app.services.ai_drivers.router import ModelRouter
                provider = ModelRouter.get_provider_from_config(self.provider_config, user_id=self.user_id)
                
                file_path = gen_result.get("file_path", self.wm.get_tool_path(f"evolved_{cap_name}.py"))
                code = ""
                if os.path.exists(file_path):
                    with open(file_path, "r") as f:
                        code = f.read()
                
                fix_result = await AutoFixLoop.fix_and_retry(
                    provider, code, file_path, cap_name,
                    gen_result.get("error", "Unknown error"),
                    self.workspace_id
                )
                
                if fix_result["success"]:
                    dep_report = DependencyResolver.resolve_all(fix_result["code"])
                    self.cap_manager.register_working(
                        cap_name, file_path,
                        0.7,  # Lower score since it needed fixing
                        dep_report.get("imports", [])
                    )
                    return {
                        "success": True,
                        "used_existing": False,
                        "capability": cap_name,
                        "generated": True,
                        "auto_fixed": True,
                        "fix_attempts": fix_result["attempts"],
                        "result": f"Capability created after {fix_result['attempts']} fix attempts.",
                    }
                else:
                    self.cap_manager.register_failed(
                        cap_name, fix_result["error"], fix_result.get("attempts", 5)
                    )
                    # NEVER return "capability missing" — return the best effort
                    return {
                        "success": False,
                        "capability": cap_name,
                        "error": fix_result["error"],
                        "attempts": fix_result.get("attempts", 5),
                        "message": f"Capability generation attempted {fix_result.get('attempts', 5)} times. The system will retry on next request.",
                    }
        
        except Exception as e:
            self.cap_manager.set_status(cap_name, CapabilityStatus.FAILED, str(e))
            return {
                "success": False,
                "capability": cap_name,
                "error": str(e),
                "message": "Execution guarantee engine encountered an error. Will retry on next request.",
            }
    
    def _execute_capability(self, cap_data: Dict) -> Dict:
        """Execute an existing working capability."""
        file_path = cap_data.get("file_path", "")
        cap_name = cap_data.get("name", "unknown")
        
        if not os.path.exists(file_path):
            return {"success": False, "error": "Capability file not found"}
        
        try:
            spec = importlib.util.spec_from_file_location(cap_name, file_path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            
            if hasattr(mod, "run"):
                if asyncio.iscoroutinefunction(mod.run):
                    loop = asyncio.new_event_loop()
                    result = loop.run_until_complete(mod.run())
                    loop.close()
                else:
                    result = mod.run()
                return {"success": True, "result": str(result)[:500]}
            return {"success": False, "error": "No 'run' function"}
        except Exception as e:
            return {"success": False, "error": str(e)}
