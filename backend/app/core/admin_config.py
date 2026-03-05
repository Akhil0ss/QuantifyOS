import json
import os
from typing import Dict, Any

CONFIG_FILE = "system_config.json"

class SystemConfig:
    """
    Manages global platform toggles and emergency controls.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SystemConfig, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance

    def _load_config(self):
        self.default_config = {
            "evolution_enabled": True,
            "predictive_evolution_enabled": True,
            "hardware_control_enabled": True,
            "beta_mode": True,
            "maintenance_mode": False,
            "emergency_stop": False,
            "owner_email": os.getenv("OWNER_EMAIL", "test@example.com")
        }
        
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, "r") as f:
                try:
                    self.config = json.load(f)
                    # Merge with defaults in case new keys were added
                    for k, v in self.default_config.items():
                        if k not in self.config:
                            self.config[k] = v
                except:
                    self.config = self.default_config.copy()
        else:
            self.config = self.default_config.copy()
            self._save_config()

    def _save_config(self):
        with open(CONFIG_FILE, "w") as f:
            json.dump(self.config, f, indent=2)

    def get(self, key: str, default: Any = None) -> Any:
        return self.config.get(key, default)

    def update(self, key: str, value: Any):
        self.config[key] = value
        self._save_config()

    def get_all(self) -> Dict[str, Any]:
        return self.config

system_config = SystemConfig()
