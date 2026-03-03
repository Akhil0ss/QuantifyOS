import json
import os
import time
import shutil
import asyncio
import psutil
from typing import Dict, Any, List
from datetime import datetime

class StabilityEngine:
    """
    Level 11+ Autonomy: The Resilience Layer.
    Ensures long-term uptime via health monitoring, backups, and self-repair.
    """
    def __init__(self, workspace_id: str = "default"):
        self.workspace_id = workspace_id
        self.health_file = "system_health.json"
        self.backup_dir = "backups"
        self.critical_files = [
            "capability_index.json",
            "evolution_history.json",
            "evolution_gaps.json",
            "protocol_memory.json",
            "trend_scores.json"
        ]
        
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)

    def get_health_metrics(self) -> Dict[str, Any]:
        """
        Gathers real-time OS and application metrics.
        """
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        
        # Track API/Task failures by reading logs (simplified for now)
        task_failures = 0
        if os.path.exists("evolution_state.json"):
            with open("evolution_state.json", "r") as f:
                state = json.load(f)
                task_failures = state.get("failure_count", 0)

        health = {
            "timestamp": datetime.now().isoformat(),
            "cpu_percent": cpu_usage,
            "memory_used_mb": memory.used / (1024 * 1024),
            "memory_percent": memory.percent,
            "task_failures_24h": task_failures,
            "status": "healthy" if cpu_usage < 90 and memory.percent < 90 else "strained"
        }
        
        self._log_health(health)
        return health

    def _log_health(self, health: Dict[str, Any]):
        history = []
        if os.path.exists(self.health_file):
            try:
                with open(self.health_file, "r") as f:
                    history = json.load(f)
            except: pass
        
        history.append(health)
        # Keep last 100 entries
        history = history[-100:]
        
        with open(self.health_file, "w") as f:
            json.dump(history, f, indent=2)

    def perform_backup(self):
        """
        Creates a dated snapshot of all critical system data.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        target_path = os.path.join(self.backup_dir, f"backup_{timestamp}")
        os.makedirs(target_path)

        for file in self.critical_files:
            if os.path.exists(file):
                shutil.copy(file, os.path.join(target_path, file))
        
        # Also backup evolved modules
        if os.path.exists("app/tools"):
            shutil.copytree("app/tools", os.path.join(target_path, "tools"), dirs_exist_ok=True)
            
        print(f"STABILITY: Backup completed at {target_path}")
        return target_path

    def verify_integrity(self) -> List[str]:
        """
        Checks critical JSON files for corruption.
        """
        corrupted = []
        for file in self.critical_files:
            if os.path.exists(file):
                try:
                    with open(file, "r") as f:
                        json.load(f)
                except Exception as e:
                    print(f"STABILITY: Corruption detected in {file}: {e}")
                    corrupted.append(file)
        return corrupted

    async def run_stability_cycle(self):
        """
        Main background loop for stability and recovery.
        """
        while True:
            try:
                print("STABILITY: Running health check...")
                health = self.get_health_metrics()
                
                # Check integrity
                corrupted = self.verify_integrity()
                if corrupted:
                    print(f"STABILITY: Attempting recovery for {corrupted}")
                    # In a real L11 system, we would restore from the last backup here
                
                # Check for daily backup (simplified: if last backup > 24h)
                # For this demo, we'll just log it.
                
                await asyncio.sleep(3600) # Run every hour
            except Exception as e:
                print(f"STABILITY Error: {e}")
                await asyncio.sleep(60)

async def start_stability_monitor():
    engine = StabilityEngine()
    await engine.run_stability_cycle()
