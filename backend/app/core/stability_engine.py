"""
Quantify OS — Universal Error Handling & Stability Engine
==========================================================
Ensures Quantify OS NEVER crashes. Tasks may fail, but the system remains operational.
Provides error classification, structured responses, retry strategies,
human assistance requests, error pattern learning, and safe failure mode.
"""

import os
import sys
import json
import time
import traceback
import functools
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime
from pathlib import Path


# ────────────────────────────────────────────────────────
# ERROR CLASSIFICATION
# ────────────────────────────────────────────────────────
class ErrorClass:
    DEPENDENCY = "dependency_error"
    API = "api_error"
    PERMISSION = "permission_error"
    HARDWARE = "hardware_error"
    RESOURCE = "resource_error"
    LOGIC = "logic_error"
    UNKNOWN = "unknown_error"


# Keywords mapped to error types for classification
ERROR_SIGNATURES = {
    ErrorClass.DEPENDENCY: [
        "ModuleNotFoundError", "ImportError", "No module named",
        "pip install", "package", "dependency", "not installed"
    ],
    ErrorClass.API: [
        "APIError", "RateLimitError", "AuthenticationError", "api_key",
        "HTTPError", "ConnectionError", "Timeout", "429", "401", "403", "500",
        "openai", "anthropic", "stripe"
    ],
    ErrorClass.PERMISSION: [
        "PermissionError", "AccessDenied", "Forbidden", "EACCES",
        "permission denied", "not authorized", "credentials"
    ],
    ErrorClass.HARDWARE: [
        "SerialException", "USBError", "DeviceNotFound", "ConnectionRefused",
        "mqtt", "serial", "usb", "device", "port", "hardware"
    ],
    ErrorClass.RESOURCE: [
        "MemoryError", "DiskFull", "OSError", "ResourceExhausted",
        "out of memory", "disk space", "file too large", "quota"
    ],
    ErrorClass.LOGIC: [
        "ValueError", "TypeError", "KeyError", "IndexError", "AttributeError",
        "ZeroDivisionError", "AssertionError", "RecursionError"
    ],
}

# Human-readable fix suggestions per error class
FIX_SUGGESTIONS = {
    ErrorClass.DEPENDENCY: "Allow automatic dependency installation or install manually with: pip install <package>",
    ErrorClass.API: "Check API key configuration in .env file. Verify API quota and rate limits.",
    ErrorClass.PERMISSION: "Check file/directory permissions. Run as administrator if needed.",
    ErrorClass.HARDWARE: "Connect the required device and confirm. Check port configuration.",
    ErrorClass.RESOURCE: "Free up system resources (memory/disk). Consider upgrading hardware.",
    ErrorClass.LOGIC: "The generated code has a logic error. The system will auto-fix and retry.",
    ErrorClass.UNKNOWN: "An unexpected error occurred. The system logged the error for analysis.",
}

# Errors that require human intervention
HUMAN_REQUIRED_ERRORS = {
    ErrorClass.PERMISSION: "Please provide the necessary permissions or credentials.",
    ErrorClass.HARDWARE: "Please connect the required device and confirm.",
    ErrorClass.API: "Please provide the required API key.",
}


# ────────────────────────────────────────────────────────
# ERROR PATTERN LEARNING
# ────────────────────────────────────────────────────────
class ErrorPatternMemory:
    """Learns from past errors to improve future handling."""
    
    PATTERNS_FILE = "error_patterns.json"
    
    @staticmethod
    def _load() -> Dict:
        if os.path.exists(ErrorPatternMemory.PATTERNS_FILE):
            try:
                with open(ErrorPatternMemory.PATTERNS_FILE, "r") as f:
                    return json.load(f)
            except: pass
        return {"patterns": {}, "fixes": {}, "stats": {"total_errors": 0, "auto_fixed": 0}}
    
    @staticmethod
    def _save(data: Dict):
        with open(ErrorPatternMemory.PATTERNS_FILE, "w") as f:
            json.dump(data, f, indent=2)
    
    @staticmethod
    def record_error(error_class: str, error_msg: str, component: str):
        """Records an error occurrence for pattern learning."""
        data = ErrorPatternMemory._load()
        key = f"{error_class}:{component}"
        
        if key not in data["patterns"]:
            data["patterns"][key] = {"count": 0, "last_seen": None, "samples": []}
        
        data["patterns"][key]["count"] += 1
        data["patterns"][key]["last_seen"] = datetime.now().isoformat()
        
        # Keep last 5 samples
        samples = data["patterns"][key]["samples"]
        samples.append(error_msg[:200])
        data["patterns"][key]["samples"] = samples[-5:]
        
        data["stats"]["total_errors"] += 1
        ErrorPatternMemory._save(data)
    
    @staticmethod
    def record_fix(error_class: str, component: str, fix_description: str):
        """Records a successful fix for pattern learning."""
        data = ErrorPatternMemory._load()
        key = f"{error_class}:{component}"
        
        if key not in data["fixes"]:
            data["fixes"][key] = {"count": 0, "strategies": []}
        
        data["fixes"][key]["count"] += 1
        strategies = data["fixes"][key]["strategies"]
        if fix_description not in strategies:
            strategies.append(fix_description)
            data["fixes"][key]["strategies"] = strategies[-10:]
        
        data["stats"]["auto_fixed"] += 1
        ErrorPatternMemory._save(data)
    
    @staticmethod
    def get_known_fix(error_class: str, component: str) -> Optional[str]:
        """Returns a known fix strategy if one exists."""
        data = ErrorPatternMemory._load()
        key = f"{error_class}:{component}"
        fixes = data.get("fixes", {}).get(key, {}).get("strategies", [])
        return fixes[-1] if fixes else None


# ────────────────────────────────────────────────────────
# STABILITY ENGINE (Core)
# ────────────────────────────────────────────────────────
class StabilityEngine:
    """
    Central stability engine for Quantify OS.
    Ensures the system NEVER crashes regardless of task failures.
    """
    
    @staticmethod
    def classify_error(error: Exception) -> str:
        """Classifies an error into a known category."""
        error_str = f"{type(error).__name__}: {str(error)}"
        
        for error_class, signatures in ERROR_SIGNATURES.items():
            for sig in signatures:
                if sig.lower() in error_str.lower():
                    return error_class
        
        return ErrorClass.UNKNOWN
    
    @staticmethod
    def classify_error_str(error_msg: str) -> str:
        """Classifies an error from its string representation."""
        for error_class, signatures in ERROR_SIGNATURES.items():
            for sig in signatures:
                if sig.lower() in error_msg.lower():
                    return error_class
        return ErrorClass.UNKNOWN
    
    @staticmethod
    def create_structured_response(
        error: Exception,
        task_goal: str = "",
        component: str = "unknown",
        partial_result: Any = None
    ) -> Dict[str, Any]:
        """Creates a user-friendly structured error response."""
        error_class = StabilityEngine.classify_error(error)
        error_msg = str(error)
        
        # Record for pattern learning
        ErrorPatternMemory.record_error(error_class, error_msg, component)
        
        # Check if human help needed
        needs_human = error_class in HUMAN_REQUIRED_ERRORS
        human_message = HUMAN_REQUIRED_ERRORS.get(error_class, None)
        
        # Check for known fix
        known_fix = ErrorPatternMemory.get_known_fix(error_class, component)
        
        response = {
            "success": False,
            "error_type": error_class,
            "reason": error_msg[:500],
            "explanation": StabilityEngine._explain_error(error_class, error_msg),
            "possible_fix": known_fix or FIX_SUGGESTIONS.get(error_class, ""),
            "needs_human_assistance": needs_human,
            "human_message": human_message,
            "partial_progress": partial_result,
            "next_steps": StabilityEngine._suggest_next_steps(error_class, task_goal),
            "system_status": "operational",  # OS is ALWAYS operational
            "timestamp": datetime.now().isoformat(),
        }
        
        return response
    
    @staticmethod
    def _explain_error(error_class: str, error_msg: str) -> str:
        """Creates a simple, human-readable error explanation."""
        explanations = {
            ErrorClass.DEPENDENCY: f"A required library is missing: {error_msg.split('No module named')[-1].strip() if 'No module named' in error_msg else error_msg[:100]}",
            ErrorClass.API: f"An external API call failed. This could be due to rate limits, invalid keys, or service outage.",
            ErrorClass.PERMISSION: f"The system doesn't have permission to access a required resource.",
            ErrorClass.HARDWARE: f"A hardware device is not connected or not responding.",
            ErrorClass.RESOURCE: f"System resources (memory or disk) are running low.",
            ErrorClass.LOGIC: f"The task encountered a code logic error: {error_msg[:150]}",
            ErrorClass.UNKNOWN: f"An unexpected error occurred: {error_msg[:150]}",
        }
        return explanations.get(error_class, error_msg[:200])
    
    @staticmethod
    def _suggest_next_steps(error_class: str, task_goal: str) -> List[str]:
        """Suggests actionable next steps based on error type."""
        steps = {
            ErrorClass.DEPENDENCY: [
                "The system will attempt to auto-install the missing package.",
                "If auto-install fails, install manually: pip install <package>",
                "Then retry the task."
            ],
            ErrorClass.API: [
                "Check your API credentials in the .env file.",
                "Verify your API quota hasn't been exceeded.",
                "The system will retry with an alternative provider if available."
            ],
            ErrorClass.PERMISSION: [
                "Grant the required permissions to the Quantify OS process.",
                "On Windows, try running as Administrator.",
                "Check file ownership and access controls."
            ],
            ErrorClass.HARDWARE: [
                "Connect the required hardware device.",
                "Check the port/connection settings.",
                "Retry the task after connecting."
            ],
            ErrorClass.RESOURCE: [
                "Free up disk space or memory.",
                "Close other applications to free resources.",
                "Consider processing the task in smaller chunks."
            ],
            ErrorClass.LOGIC: [
                "The system will auto-fix the code and retry.",
                "If the issue persists, try rephrasing your request.",
            ],
            ErrorClass.UNKNOWN: [
                "The error has been logged for analysis.",
                "Try the task again — transient errors often resolve on retry.",
                "If the issue persists, check the error logs."
            ],
        }
        return steps.get(error_class, steps[ErrorClass.UNKNOWN])


# ────────────────────────────────────────────────────────
# AUTO-RETRY WITH FALLBACK
# ────────────────────────────────────────────────────────
class RetryStrategy:
    """Implements automatic retry with fallback strategies."""
    
    MAX_RETRIES = 3
    
    @staticmethod
    async def execute_with_retry(
        func: Callable,
        *args,
        max_retries: int = 3,
        component: str = "unknown",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes a function with automatic retry and fallback.
        Never raises — always returns a structured response.
        """
        last_error = None
        partial_result = None
        
        for attempt in range(1, max_retries + 1):
            try:
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                # Record successful fix if this was a retry
                if attempt > 1 and last_error:
                    error_class = StabilityEngine.classify_error(last_error)
                    ErrorPatternMemory.record_fix(error_class, component, f"Succeeded on retry attempt {attempt}")
                
                return {"success": True, "result": result, "attempts": attempt}
            
            except Exception as e:
                last_error = e
                error_class = StabilityEngine.classify_error(e)
                
                # Don't retry permission/hardware errors — they need human intervention
                if error_class in (ErrorClass.PERMISSION, ErrorClass.HARDWARE):
                    break
                
                if attempt < max_retries:
                    # Brief pause before retry
                    import asyncio
                    await asyncio.sleep(0.5 * attempt)
        
        # All retries exhausted
        return StabilityEngine.create_structured_response(
            last_error, component=component, partial_result=partial_result
        )


# ────────────────────────────────────────────────────────
# GLOBAL EXCEPTION HANDLER MIDDLEWARE (FastAPI)
# ────────────────────────────────────────────────────────
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request


class StabilityMiddleware(BaseHTTPMiddleware):
    """
    Global exception handler that catches ALL unhandled exceptions.
    Ensures the backend NEVER crashes.
    """
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            # Classify and log
            error_class = StabilityEngine.classify_error(e)
            ErrorPatternMemory.record_error(error_class, str(e), f"API:{request.url.path}")
            
            # Log to production errors
            try:
                from app.core.error_logger import log_system_error
                log_system_error(f"API:{request.url.path}", str(e))
            except: pass
            
            # Return structured error — NEVER crash
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error_type": error_class,
                    "reason": str(e)[:500],
                    "explanation": StabilityEngine._explain_error(error_class, str(e)),
                    "possible_fix": FIX_SUGGESTIONS.get(error_class, ""),
                    "system_status": "operational",
                    "timestamp": datetime.now().isoformat(),
                }
            )


# ────────────────────────────────────────────────────────
# SAFE EXECUTION DECORATOR
# ────────────────────────────────────────────────────────
def safe_execute(component: str = "unknown"):
    """
    Decorator that wraps any function in a safety net.
    Catches all exceptions and returns structured error responses.
    The decorated function NEVER raises.
    """
    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                error_class = StabilityEngine.classify_error(e)
                ErrorPatternMemory.record_error(error_class, str(e), component)
                return StabilityEngine.create_structured_response(e, component=component)
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_class = StabilityEngine.classify_error(e)
                ErrorPatternMemory.record_error(error_class, str(e), component)
                return StabilityEngine.create_structured_response(e, component=component)
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator


# ────────────────────────────────────────────────────────
# HUMAN ASSISTANCE REQUEST
# ────────────────────────────────────────────────────────
class HumanAssistanceRequest:
    """Generates structured human assistance requests when the system can't auto-resolve."""
    
    REQUESTS_FILE = "human_assistance_queue.json"
    
    @staticmethod
    def request_help(
        error_class: str,
        task_goal: str,
        details: str,
        workspace_id: str = ""
    ) -> Dict:
        """Creates a help request for the user."""
        request = {
            "id": f"help_{int(time.time())}",
            "error_type": error_class,
            "task": task_goal,
            "message": HUMAN_REQUIRED_ERRORS.get(error_class, "Manual intervention required."),
            "details": details[:500],
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "workspace_id": workspace_id,
        }
        
        # Save to queue
        queue = []
        if os.path.exists(HumanAssistanceRequest.REQUESTS_FILE):
            try:
                with open(HumanAssistanceRequest.REQUESTS_FILE, "r") as f:
                    queue = json.load(f)
            except: pass
        
        queue.append(request)
        # Keep last 50
        with open(HumanAssistanceRequest.REQUESTS_FILE, "w") as f:
            json.dump(queue[-50:], f, indent=2)
        
        return request
    
    @staticmethod
    def get_pending() -> List[Dict]:
        """Returns all pending help requests."""
        if os.path.exists(HumanAssistanceRequest.REQUESTS_FILE):
            try:
                with open(HumanAssistanceRequest.REQUESTS_FILE, "r") as f:
                    return [r for r in json.load(f) if r.get("status") == "pending"]
            except: pass
        return []
    
    @staticmethod
    def resolve(request_id: str, resolution: str):
        """Marks a help request as resolved."""
        if not os.path.exists(HumanAssistanceRequest.REQUESTS_FILE):
            return
        with open(HumanAssistanceRequest.REQUESTS_FILE, "r") as f:
            queue = json.load(f)
        for req in queue:
            if req["id"] == request_id:
                req["status"] = "resolved"
                req["resolution"] = resolution
                req["resolved_at"] = datetime.now().isoformat()
        with open(HumanAssistanceRequest.REQUESTS_FILE, "w") as f:
            json.dump(queue, f, indent=2)
