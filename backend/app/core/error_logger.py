import json
import os
import time
from typing import Dict, Any

ERROR_FILE = "production_errors.json"

def log_system_error(component: str, error_msg: str, metadata: Dict[str, Any] = None):
    """
    Logs an error to the global production_errors.json file.
    """
    entry = {
        "timestamp": time.time(),
        "datetime": time.strftime('%Y-%m-%d %H:%M:%S'),
        "component": component,
        "error": error_msg,
        "metadata": metadata or {}
    }
    
    errors = []
    if os.path.exists(ERROR_FILE):
        try:
            with open(ERROR_FILE, "r") as f:
                errors = json.load(f)
        except:
            errors = []
            
    errors.append(entry)
    
    # Keep only last 100 errors
    if len(errors) > 100:
        errors = errors[-100:]
        
    with open(ERROR_FILE, "w") as f:
        json.dump(errors, f, indent=2)
