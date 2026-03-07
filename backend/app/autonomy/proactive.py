import asyncio
import time
from typing import Dict, Any, List
from app.services.base_rtdb import BaseRTDBService
from app.services.tasks import TaskService
from app.services.telemetry import TelemetryService

class ProactiveSuggestionEngine:
    """
    Analyzes user task patterns and proactively suggests recurring actions.
    Pushes suggestions to RTDB → Frontend shows them as notification cards.
    Runs as a background loop. The OS anticipates, not just reacts.
    """
    def __init__(self, user_id: str, workspace_id: str):
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.task_service = TaskService()
        self.suggestions_db = BaseRTDBService(f"suggestions/{workspace_id}")
        self.telemetry = TelemetryService()

    def _analyze_patterns(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detects recurring task patterns from history.
        Returns a list of suggested actions.
        """
        suggestions = []
        
        # Count goal keywords
        keyword_freq = {}
        for task in tasks:
            goal = task.get("goal", "")
            # Extract meaningful words (skip common ones)
            skip_words = {"the", "a", "an", "to", "from", "and", "or", "in", "on", "at", "for", "my", "me", "i"}
            words = [w.lower() for w in goal.split() if len(w) > 3 and w.lower() not in skip_words]
            for word in words:
                keyword_freq[word] = keyword_freq.get(word, 0) + 1

        # Find recurring themes (appeared 3+ times)
        recurring = {k: v for k, v in keyword_freq.items() if v >= 3}
        
        if recurring:
            top_themes = sorted(recurring.items(), key=lambda x: x[1], reverse=True)[:3]
            for theme, count in top_themes:
                # Find the most recent task with this theme
                matching_tasks = [t for t in tasks if theme in t.get("goal", "").lower()]
                if matching_tasks:
                    latest = sorted(matching_tasks, key=lambda t: t.get("created_at", 0), reverse=True)[0]
                    suggestions.append({
                        "type": "recurring_pattern",
                        "theme": theme,
                        "frequency": count,
                        "suggested_goal": latest.get("goal"),
                        "message": f"You've done tasks about '{theme}' {count} times. Want me to run it again?",
                        "confidence": min(count / 10.0, 0.95)
                    })

        # Check for tasks that haven't been done recently but were regular
        now_ms = int(time.time() * 1000)
        week_ms = 7 * 24 * 3600 * 1000
        recent_goals = set(t.get("goal", "") for t in tasks if (now_ms - t.get("created_at", 0)) < week_ms)
        older_goals = [t for t in tasks if t.get("goal", "") not in recent_goals and t.get("status") == "done"]
        
        # Find goals that were done frequently but not recently
        goal_counts = {}
        for t in older_goals:
            g = t.get("goal", "")
            goal_counts[g] = goal_counts.get(g, 0) + 1
        
        for goal, count in goal_counts.items():
            if count >= 2:
                suggestions.append({
                    "type": "missed_routine",
                    "suggested_goal": goal,
                    "message": f"You used to run '{goal[:50]}...' regularly but haven't this week. Should I run it?",
                    "confidence": min(count / 5.0, 0.8)
                })
                if len(suggestions) >= 5:
                    break

        return suggestions

    async def generate_suggestions(self):
        """Analyzes history and pushes suggestions to RTDB."""
        try:
            tasks = self.task_service.get_workspace_tasks(self.workspace_id)
            
            if len(tasks) < 5:
                return  # Not enough history to analyze
            
            suggestions = self._analyze_patterns(tasks)
            
            if suggestions:
                # Clear old suggestions
                self.suggestions_db.set({})
                
                for suggestion in suggestions:
                    suggestion["timestamp"] = int(time.time() * 1000)
                    suggestion["status"] = "pending"  # pending, accepted, dismissed
                    self.suggestions_db.push(suggestion)
                
                self.telemetry.log_process(
                    self.workspace_id, "proactive", 
                    "Suggestions Generated", 
                    f"Generated {len(suggestions)} proactive suggestions", 
                    "system"
                )
                print(f"PROACTIVE: Generated {len(suggestions)} suggestions for {self.workspace_id}")
                
        except Exception as e:
            print(f"PROACTIVE: Error generating suggestions: {e}")

    async def start_loop(self):
        """Background loop — generates suggestions every 6 hours."""
        print(f"PROACTIVE: Engine started for workspace {self.workspace_id}")
        while True:
            await self.generate_suggestions()
            await asyncio.sleep(6 * 3600)  # Every 6 hours
