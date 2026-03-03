"""
Quantify OS — Dependency Resolver
==================================
Automatically detects and installs missing Python packages for evolved modules.
Ensures every generated module has its dependencies satisfied.
"""

import ast
import sys
import subprocess
import importlib
import re
from typing import List, Set, Dict, Tuple
from pathlib import Path

# Standard library module names (Python 3.10+) — these should NOT be pip-installed
STDLIB_MODULES = {
    "abc", "aifc", "argparse", "array", "ast", "asyncio", "atexit", "base64",
    "binascii", "bisect", "builtins", "calendar", "cgi", "cgitb", "chunk",
    "cmath", "cmd", "code", "codecs", "codeop", "collections", "colorsys",
    "compileall", "concurrent", "configparser", "contextlib", "contextvars",
    "copy", "copyreg", "cProfile", "crypt", "csv", "ctypes", "curses",
    "dataclasses", "datetime", "dbm", "decimal", "difflib", "dis", "distutils",
    "doctest", "email", "encodings", "enum", "errno", "faulthandler", "fcntl",
    "filecmp", "fileinput", "fnmatch", "fractions", "ftplib", "functools",
    "gc", "getopt", "getpass", "gettext", "glob", "grp", "gzip", "hashlib",
    "heapq", "hmac", "html", "http", "idlelib", "imaplib", "imghdr", "imp",
    "importlib", "inspect", "io", "ipaddress", "itertools", "json", "keyword",
    "lib2to3", "linecache", "locale", "logging", "lzma", "mailbox", "mailcap",
    "marshal", "math", "mimetypes", "mmap", "modulefinder", "multiprocessing",
    "netrc", "nis", "nntplib", "numbers", "operator", "optparse", "os",
    "ossaudiodev", "pathlib", "pdb", "pickle", "pickletools", "pipes", "pkgutil",
    "platform", "plistlib", "poplib", "posix", "posixpath", "pprint",
    "profile", "pstats", "pty", "pwd", "py_compile", "pyclbr", "pydoc",
    "queue", "quopri", "random", "re", "readline", "reprlib", "resource",
    "rlcompleter", "runpy", "sched", "secrets", "select", "selectors",
    "shelve", "shlex", "shutil", "signal", "site", "smtpd", "smtplib",
    "sndhdr", "socket", "socketserver", "sqlite3", "ssl", "stat", "statistics",
    "string", "stringprep", "struct", "subprocess", "sunau", "symtable",
    "sys", "sysconfig", "syslog", "tabnanny", "tarfile", "telnetlib", "tempfile",
    "termios", "test", "textwrap", "threading", "time", "timeit", "tkinter",
    "token", "tokenize", "tomllib", "trace", "traceback", "tracemalloc", "tty",
    "turtle", "turtledemo", "types", "typing", "unicodedata", "unittest",
    "urllib", "uu", "uuid", "venv", "warnings", "wave", "weakref", "webbrowser",
    "winreg", "winsound", "wsgiref", "xdrlib", "xml", "xmlrpc", "zipapp",
    "zipfile", "zipimport", "zlib", "_thread", "__future__",
}

# Common package name mapping (import name → pip package name)
PACKAGE_MAP = {
    "cv2": "opencv-python",
    "PIL": "Pillow",
    "sklearn": "scikit-learn",
    "bs4": "beautifulsoup4",
    "yaml": "pyyaml",
    "dotenv": "python-dotenv",
    "serial": "pyserial",
    "usb": "pyusb",
    "gi": "PyGObject",
    "wx": "wxPython",
    "attr": "attrs",
    "dateutil": "python-dateutil",
    "jose": "python-jose",
    "jwt": "PyJWT",
    "magic": "python-magic",
    "docx": "python-docx",
    "pptx": "python-pptx",
    "openpyxl": "openpyxl",
    "xlrd": "xlrd",
    "lxml": "lxml",
    "numpy": "numpy",
    "pandas": "pandas",
    "scipy": "scipy",
    "matplotlib": "matplotlib",
    "seaborn": "seaborn",
    "requests": "requests",
    "flask": "flask",
    "fastapi": "fastapi",
    "uvicorn": "uvicorn",
    "pydantic": "pydantic",
    "sqlalchemy": "sqlalchemy",
    "pymongo": "pymongo",
    "redis": "redis",
    "celery": "celery",
    "kafka": "kafka-python",
    "boto3": "boto3",
    "google": "google-cloud",
    "tensorflow": "tensorflow",
    "torch": "torch",
    "transformers": "transformers",
    "openai": "openai",
    "anthropic": "anthropic",
    "stripe": "stripe",
    "tweepy": "tweepy",
    "discord": "discord.py",
    "telegram": "python-telegram-bot",
    "paho": "paho-mqtt",
    "aiohttp": "aiohttp",
    "httpx": "httpx",
    "beautifulsoup4": "beautifulsoup4",
    "playwright": "playwright",
    "selenium": "selenium",
    "scrapy": "scrapy",
    "psutil": "psutil",
}

# Blocked packages (security risk)
BLOCKED_PACKAGES = {"os-sys", "malware", "exploit", "keylogger", "reverse-shell"}


class DependencyResolver:
    """Detects imports in generated code and auto-installs missing packages."""

    @staticmethod
    def extract_imports(code: str) -> Set[str]:
        """Extracts all top-level import names from Python source code."""
        imports = set()
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split(".")[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module.split(".")[0])
        except SyntaxError:
            # Fallback: regex-based extraction for broken code
            for match in re.finditer(r'^\s*(?:import|from)\s+(\w+)', code, re.MULTILINE):
                imports.add(match.group(1))
        return imports

    @staticmethod
    def find_missing(imports: Set[str]) -> List[str]:
        """Returns imports that are not installed and not in stdlib."""
        missing = []
        for name in imports:
            if name in STDLIB_MODULES:
                continue
            try:
                importlib.import_module(name)
            except ImportError:
                missing.append(name)
        return missing

    @staticmethod
    def get_pip_name(import_name: str) -> str:
        """Maps an import name to its pip package name."""
        return PACKAGE_MAP.get(import_name, import_name)

    @staticmethod
    def install_package(pip_name: str, target_dir: str = None) -> Tuple[bool, str]:
        """Installs a single package via pip. If target_dir is provided, installs there (workspace isolation)."""
        if pip_name.lower() in BLOCKED_PACKAGES:
            return False, f"BLOCKED: {pip_name} is not allowed for security reasons."
        
        try:
            cmd = [sys.executable, "-m", "pip", "install", pip_name, "--quiet"]
            if target_dir:
                os.makedirs(target_dir, exist_ok=True)
                cmd.extend(["--target", target_dir])
            
            result = subprocess.run(
                cmd,
                capture_output=True, text=True, timeout=120
            )
            if result.returncode == 0:
                location = f" to {target_dir}" if target_dir else " globally"
                return True, f"Installed {pip_name} successfully{location}."
            else:
                return False, f"Failed to install {pip_name}: {result.stderr[:200]}"
        except subprocess.TimeoutExpired:
            return False, f"Timeout installing {pip_name}."
        except Exception as e:
            return False, f"Error installing {pip_name}: {str(e)}"

    @staticmethod
    def resolve_all(code: str, workspace_id: str = None) -> Dict:
        """
        Full pipeline: Extract imports → Find missing → Install all → Report.
        If workspace_id is provided, installs to workspace-scoped lib directory.
        """
        imports = DependencyResolver.extract_imports(code)
        missing = DependencyResolver.find_missing(imports)

        # Determine target directory for workspace isolation
        target_dir = None
        if workspace_id:
            from app.core.saas import WorkspaceManager
            wm = WorkspaceManager(workspace_id)
            target_dir = wm.get_path("lib")

        report = {
            "total_imports": len(imports),
            "imports": list(imports),
            "missing": missing,
            "installed": [],
            "failed": [],
            "all_resolved": True,
            "target_dir": target_dir,
        }

        for name in missing:
            pip_name = DependencyResolver.get_pip_name(name)
            success, msg = DependencyResolver.install_package(pip_name, target_dir=target_dir)
            if success:
                report["installed"].append({"import": name, "package": pip_name, "message": msg})
            else:
                report["failed"].append({"import": name, "package": pip_name, "message": msg})
                report["all_resolved"] = False

        return report
