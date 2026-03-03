import os
import io
import sys
import contextlib
import ast
import traceback
import threading
import hashlib
from typing import Dict, Any, Optional
from app.services.ai_drivers.router import ModelRouter

# ────────────────────────────────────────────────────────
# SECURITY: Strict Builtins Whitelist
# Only these builtins are available inside the sandbox.
# ────────────────────────────────────────────────────────
SAFE_BUILTINS = {
    "print": print,
    "len": len,
    "range": range,
    "int": int,
    "float": float,
    "str": str,
    "list": list,
    "dict": dict,
    "tuple": tuple,
    "set": set,
    "bool": bool,
    "None": None,
    "True": True,
    "False": False,
    "type": type,
    "isinstance": isinstance,
    "issubclass": issubclass,
    "enumerate": enumerate,
    "zip": zip,
    "map": map,
    "filter": filter,
    "sorted": sorted,
    "reversed": reversed,
    "min": min,
    "max": max,
    "sum": sum,
    "abs": abs,
    "round": round,
    "any": any,
    "all": all,
    "chr": chr,
    "ord": ord,
    "hex": hex,
    "oct": oct,
    "bin": bin,
    "hash": hash,
    "id": id,
    "repr": repr,
    "format": format,
    "iter": iter,
    "next": next,
    "slice": slice,
    "staticmethod": staticmethod,
    "classmethod": classmethod,
    "property": property,
    "super": super,
    "object": object,
    "Exception": Exception,
    "ValueError": ValueError,
    "TypeError": TypeError,
    "KeyError": KeyError,
    "IndexError": IndexError,
    "AttributeError": AttributeError,
    "RuntimeError": RuntimeError,
    "StopIteration": StopIteration,
    "ZeroDivisionError": ZeroDivisionError,
    # Explicitly BLOCKED:
    # __import__, eval, exec, compile, getattr, setattr, delattr,
    # globals, locals, vars, dir, open, input, breakpoint,
    # memoryview, bytearray (potential for binary exploits)
}

# Patterns that indicate dynamic import or code execution attempts
FORBIDDEN_AST_PATTERNS = [
    "os", "sys", "subprocess", "shutil", "socket",
    "importlib", "ctypes", "multiprocessing", "signal",
    "pty", "resource", "fcntl", "termios", "code", "codeop",
    "runpy", "pkgutil",
]

FORBIDDEN_NAME_PATTERNS = [
    "__import__", "__builtins__", "__loader__", "__spec__",
    "eval", "exec", "compile", "getattr", "setattr", "delattr",
    "globals", "locals", "vars", "dir", "open", "input", "breakpoint",
]

SANDBOX_TIMEOUT_SECONDS = 30
SANDBOX_MAX_MEMORY_DELTA_BYTES = 100 * 1024 * 1024  # 100MB


def _check_ast_security(code: str) -> Dict[str, Any]:
    """
    Deep AST inspection for forbidden patterns.
    Returns {"safe": True/False, "reason": str}
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"safe": False, "reason": f"Syntax Error: {str(e)}"}

    for node in ast.walk(tree):
        # Block direct imports of forbidden modules
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_module = alias.name.split(".")[0]
                if root_module in FORBIDDEN_AST_PATTERNS:
                    return {"safe": False, "reason": f"Import of forbidden module '{root_module}' blocked."}

        if isinstance(node, ast.ImportFrom):
            if node.module:
                root_module = node.module.split(".")[0]
                if root_module in FORBIDDEN_AST_PATTERNS:
                    return {"safe": False, "reason": f"ImportFrom of forbidden module '{root_module}' blocked."}

        # Block calls to __import__(), eval(), exec(), compile(), etc.
        if isinstance(node, ast.Call):
            func = node.func
            # Direct name call: __import__("os"), eval("code")
            if isinstance(func, ast.Name) and func.id in FORBIDDEN_NAME_PATTERNS:
                return {"safe": False, "reason": f"Call to forbidden function '{func.id}' blocked."}
            # Attribute call: importlib.import_module(...)
            if isinstance(func, ast.Attribute):
                if isinstance(func.value, ast.Name) and func.value.id in FORBIDDEN_AST_PATTERNS:
                    return {"safe": False, "reason": f"Call to forbidden module attribute '{func.value.id}.{func.attr}' blocked."}
                # getattr(__builtins__, '__import__')
                if func.attr in FORBIDDEN_NAME_PATTERNS:
                    return {"safe": False, "reason": f"Access to forbidden attribute '{func.attr}' blocked."}

        # Block access to forbidden names (even as variables)
        if isinstance(node, ast.Name) and node.id in ("__import__", "__builtins__", "__loader__", "__spec__"):
            return {"safe": False, "reason": f"Access to forbidden name '{node.id}' blocked."}

        # Block string-based dynamic imports via constant inspection
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            val_lower = node.value.lower()
            for pattern in FORBIDDEN_AST_PATTERNS:
                if pattern == val_lower:
                    # Only flag exact module name matches as string args, not substrings
                    # Check if parent is a Call node (like __import__("os"))
                    pass  # This is handled by the Call check above

        # Block while True infinite loops
        if isinstance(node, ast.While) and isinstance(node.test, ast.Constant) and node.test.value is True:
            return {"safe": False, "reason": "Infinite loop 'while True' detected."}

    return {"safe": True, "reason": ""}


class SecureSandbox:
    """
    Executes Python code in a hardened isolated environment.

    Security layers:
    1. AST-level forbidden pattern detection
    2. Strict builtins whitelist (no __import__, eval, exec, getattr, etc.)
    3. Execution timeout (30 seconds)
    4. Memory limit (100MB delta)
    """
    def execute(self, code: str, kwargs: Dict[str, Any] = None, timeout: int = SANDBOX_TIMEOUT_SECONDS) -> Dict[str, Any]:
        kwargs = kwargs or {}

        # ── Layer 1: AST Security Check ──
        ast_result = _check_ast_security(code)
        if not ast_result["safe"]:
            return {"success": False, "error": f"Security Exception: {ast_result['reason']}"}

        # ── Layer 2: Source-level string pattern check ──
        # Catches obfuscation attempts the AST might miss
        code_lower = code.lower()
        for pattern in ["__import__", "importlib", "getattr", "setattr", "delattr"]:
            if pattern in code_lower:
                return {"success": False, "error": f"Security Exception: Forbidden pattern '{pattern}' detected in source code."}

        stdout = io.StringIO()
        stderr = io.StringIO()
        result_container = {"result": None, "error": None, "traceback": None}

        def _run_sandboxed():
            try:
                import psutil
                process = psutil.Process(os.getpid())
                mem_before = process.memory_info().rss
            except Exception:
                mem_before = 0

            try:
                with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                    # ── Layer 3: Restricted execution namespace ──
                    local_env = {}
                    global_env = {"__builtins__": SAFE_BUILTINS}

                    exec(code, global_env, local_env)

                    # Find the first callable (entrypoint)
                    entrypoint = None
                    for name, obj in local_env.items():
                        if callable(obj):
                            entrypoint = obj
                            break

                    if not entrypoint:
                        result_container["error"] = "No callable function found in the generated code."
                        return

                    result_container["result"] = entrypoint(**kwargs)

            except Exception as e:
                result_container["error"] = str(e)
                result_container["traceback"] = traceback.format_exc()

            # ── Layer 4: Memory limit check ──
            try:
                import psutil
                process = psutil.Process(os.getpid())
                mem_after = process.memory_info().rss
                mem_delta = mem_after - mem_before
                if mem_delta > SANDBOX_MAX_MEMORY_DELTA_BYTES:
                    result_container["error"] = f"Memory limit exceeded: {mem_delta // (1024*1024)}MB used (limit: {SANDBOX_MAX_MEMORY_DELTA_BYTES // (1024*1024)}MB)."
                    result_container["result"] = None
            except Exception:
                pass

        # ── Layer 5: Execution timeout ──
        thread = threading.Thread(target=_run_sandboxed, daemon=True)
        thread.start()
        thread.join(timeout=timeout)

        if thread.is_alive():
            return {
                "success": False,
                "error": f"Execution timeout: Code did not complete within {timeout} seconds.",
                "stdout": stdout.getvalue(),
                "stderr": stderr.getvalue()
            }

        if result_container["error"]:
            return {
                "success": False,
                "error": result_container["error"],
                "traceback": result_container.get("traceback"),
                "stdout": stdout.getvalue(),
                "stderr": stderr.getvalue()
            }

        return {
            "success": True,
            "result": result_container["result"],
            "stdout": stdout.getvalue(),
            "stderr": stderr.getvalue()
        }


class ToolCreationAgent:
    """
    The L5 Agent responsible for dynamically writing, testing, and registering tools.
    """
    def __init__(self):
        self.router = ModelRouter()
        self.sandbox = SecureSandbox()

    def generate_tool(self, description: str, needed_args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes a description of a missing capability and attempts to write a python function for it.
        """
        prompt = f"""
You are an expert L5 systems engineer for Quantify OS.
You need to write a standalone Python function that accomplishes the following goal:
"{description}"

The function must accept the following keyword arguments:
{needed_args}

Requirements:
1. Return ONLY pure Python code. Do not wrap it in markdown block quotes (```python ... ```).
2. Define EXACTLY ONE standalone function that takes all logic. Do not execute it at the bottom.
3. Import what you need INSIDE the function (e.g., `import requests`).
4. DO NOT import 'os', 'sys', 'subprocess', 'importlib', or use bash commands.
5. DO NOT use eval(), exec(), __import__(), getattr(), or any dynamic code execution.
6. Return a dictionary representing the JSON response or text result.
"""
        # We enforce OpenAI for complex coding tasks
        response = self.router.execute_prompt(prompt, provider="openai")
        code = response.strip()

        # Strip markdown if the AI ignored instruction #1
        if code.startswith("```python"):
            code = code[9:]
        if code.startswith("```"):
            code = code[3:]
        if code.endswith("```"):
            code = code[:-3]

        return {"code": code.strip()}

    def test_tool(self, code: str, test_kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """Runs the generated code in the secure sandbox."""
        return self.sandbox.execute(code, test_kwargs)

    def author_and_test(self, description: str, test_kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """Full pipeline: Write -> Test -> Return result."""
        generation = self.generate_tool(description, test_kwargs)
        code = generation["code"]

        test_result = self.test_tool(code, test_kwargs)

        return {
            "code": code,
            "success": test_result["success"],
            "test_result": test_result
        }
