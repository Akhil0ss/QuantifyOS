import asyncio
import time
from typing import Dict, Any, List, Optional
from app.services.base_rtdb import BaseRTDBService
from app.services.tasks import TaskService

class TaskScheduler:
    """
    Autonomous Task Scheduler — fires tasks on cron/time-based schedules.
    Persists schedules in RTDB so they survive server restarts.
    """
    def __init__(self, user_id: str, workspace_id: str):
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.rtdb = BaseRTDBService(f"schedules/{workspace_id}")
        self.task_service = TaskService()
        self.running = False

    def create_schedule(self, goal: str, schedule_type: str, schedule_config: Dict[str, Any]) -> str:
        """
        Creates a new scheduled task.
        schedule_type: 'daily', 'weekly', 'interval_hours', 'once_at'
        schedule_config: {'hour': 9, 'minute': 0} for daily, {'day': 'monday', 'hour': 9} for weekly, etc.
        """
        schedule_data = {
            "goal": goal,
            "schedule_type": schedule_type,
            "config": schedule_config,
            "workspace_id": self.workspace_id,
            "user_id": self.user_id,
            "enabled": True,
            "last_run": 0,
            "created_at": int(time.time() * 1000)
        }
        schedule_id = self.rtdb.push(schedule_data)
        print(f"SCHEDULER: Created schedule '{schedule_id}' for: {goal}")
        return schedule_id

    def delete_schedule(self, schedule_id: str):
        self.rtdb.remove(schedule_id)

    def list_schedules(self) -> List[Dict[str, Any]]:
        data = self.rtdb.get() or {}
        result = []
        for sid, sdata in data.items():
            sdata["id"] = sid
            result.append(sdata)
        return result

    def _should_fire(self, schedule: Dict[str, Any]) -> bool:
        """Checks if a schedule should fire based on current time."""
        import datetime
        now = datetime.datetime.now()
        stype = schedule.get("schedule_type")
        config = schedule.get("config", {})
        last_run = schedule.get("last_run", 0)
        
        # Prevent double-firing within 55 minutes
        if last_run and (time.time() * 1000 - last_run) < 55 * 60 * 1000:
            return False

        if stype == "daily":
            target_hour = config.get("hour", 9)
            target_minute = config.get("minute", 0)
            return now.hour == target_hour and now.minute == target_minute

        elif stype == "weekly":
            target_day = config.get("day", "monday").lower()
            target_hour = config.get("hour", 9)
            days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            return days[now.weekday()] == target_day and now.hour == target_hour

        elif stype == "interval_hours":
            interval_ms = config.get("hours", 6) * 3600 * 1000
            return (time.time() * 1000 - last_run) >= interval_ms

        elif stype == "once_at":
            target_ts = config.get("timestamp", 0)
            return time.time() * 1000 >= target_ts and last_run == 0

        return False

    async def _fire_schedule(self, schedule: Dict[str, Any]):
        """Creates a task from a schedule and triggers execution."""
        sid = schedule["id"]
        goal = schedule["goal"]
        
        print(f"SCHEDULER: Firing scheduled task: {goal}")
        task_id = self.task_service.create_task(self.workspace_id, f"[Scheduled] {goal}")
        
        # Mark as fired
        self.rtdb.update({"last_run": int(time.time() * 1000)}, sid)
        
        # Remove one-time schedules
        if schedule.get("schedule_type") == "once_at":
            self.rtdb.remove(sid)

        # Trigger execution
        from app.services.orchestrator import run_autonomy_loop
        asyncio.create_task(run_autonomy_loop(self.user_id, task_id, self.workspace_id))

    async def start_loop(self):
        """Background loop that checks schedules every 60 seconds."""
        self.running = True
        print(f"SCHEDULER: Started for workspace {self.workspace_id}")
        
        while self.running:
            try:
                schedules = self.list_schedules()
                for schedule in schedules:
                    if schedule.get("enabled") and self._should_fire(schedule):
                        await self._fire_schedule(schedule)
            except Exception as e:
                print(f"SCHEDULER: Error in loop: {e}")
            
            await asyncio.sleep(60)  # Check every minute
