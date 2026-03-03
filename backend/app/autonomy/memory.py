from typing import List, Dict, Any, Optional
import uuid
import re
from app.services.memory_store import SQLiteMemoryStore

# ────────────────────────────────────────────────────────
# SECURITY: Prompt Injection Mitigation
# Patterns that could hijack LLM instructions when injected from memory.
# ────────────────────────────────────────────────────────
_INJECTION_PATTERNS = [
    r"(?i)\bYou\s+are\b",
    r"(?i)\bSYSTEM\s*:",
    r"(?i)\bASSISTANT\s*:",
    r"(?i)\bUSER\s*:",
    r"(?i)\bIGNORE\s+(previous|above|all)",
    r"(?i)\bForget\s+(previous|everything|all)",
    r"(?i)\bOverride\b",
    r"(?i)\bDisregard\b",
    r"(?i)\bNew\s+instructions?\b",
    r"(?i)\bDo\s+not\s+follow\b",
    r"(?i)\bPretend\s+you\b",
    r"(?i)\bAct\s+as\b",
    r"(?i)\bRole\s*:\s*",
    r"(?i)\bInstruction\s*:\s*",
]

MEMORY_MAX_ENTRY_LENGTH = 500


def sanitize_memory_content(text: str) -> str:
    """
    Sanitizes memory content before injection into LLM prompts.

    1. Strips instruction-like patterns that could hijack the LLM.
    2. Removes markdown code blocks (potential payload containers).
    3. Truncates to MEMORY_MAX_ENTRY_LENGTH characters.
    4. Escapes prompt delimiters (triple backticks, XML-style tags).
    """
    if not text or not isinstance(text, str):
        return ""

    sanitized = text

    # Strip instruction-like patterns
    for pattern in _INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "[FILTERED]", sanitized)

    # Remove markdown code blocks
    sanitized = re.sub(r"```[\s\S]*?```", "[CODE_BLOCK_REMOVED]", sanitized)

    # Escape prompt delimiters
    sanitized = sanitized.replace("```", "")
    sanitized = re.sub(r"</?[A-Z_]+>", "", sanitized)  # Remove XML-style tags like </SYSTEM>

    # Remove control characters
    sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", sanitized)

    # Truncate
    if len(sanitized) > MEMORY_MAX_ENTRY_LENGTH:
        sanitized = sanitized[:MEMORY_MAX_ENTRY_LENGTH] + "..."

    return sanitized.strip()


class MemoryLayer:
    SEMANTIC = "semantic"
    PROCEDURAL = "procedural"
    EPISODIC = "episodic"
    KNOWLEDGE_GRAPH = "knowledge_graph"
    WORKING_STATE = "working_state"
    AUTOBIOGRAPHICAL = "autobiographical"
    EMOTIONAL = "emotional"

class TopologicalMemory:
    """
    Top-level Interface for the CEO's Memory Topology.
    Implements graph relationships and 7-layer categorization.
    """
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.store = SQLiteMemoryStore(workspace_id)

    def learn_concept(self, name: str, node_type: str, data: Dict[str, Any], layer: str = MemoryLayer.SEMANTIC):
        """
        Learns a new node/entity in the memory graph.
        """
        node_id = f"{node_type}_{uuid.uuid4().hex[:8]}"
        data["name"] = name
        self.store.add_node(node_id, node_type, data, layer=layer)
        return node_id

    def link(self, subject_id: str, predicate: str, object_id: str):
        """
        Creates a directed edge between two nodes.
        """
        self.store.add_relation(subject_id, predicate, object_id)

    def get_contextual_strategies(self, goal_description: str) -> List[str]:
        """
        Simple keyword-based strategy retrieval for now. 
        In full implementation, this would use vector embeddings.
        """
        lessons = self.store.query_nodes_by_type("strategy_lesson")
        relevant = []
        # Basic heuristic: check if any strategy goal pattern matches the current goal
        words = set(goal_description.lower().split())
        for lesson in lessons:
            pattern = lesson["data"].get("goal_pattern", "").lower()
            if any(word in pattern for word in words):
                raw_lesson = lesson["data"].get("lesson", "")
                # SECURITY: Sanitize before returning
                relevant.append(sanitize_memory_content(raw_lesson))
        return relevant

    def record_execution(self, task_id: str, goal: str, result: str, status: str):
        """
        Stores an episodic memory of a task completion.
        """
        task_node = self.learn_concept(goal, "episodic_task", {
            "task_id": task_id,
            "goal": goal,
            "result": result,
            "status": status
        }, layer=MemoryLayer.EPISODIC)
        return task_node

    def get_episodic_context(self, current_goal: str) -> List[Dict[str, Any]]:
        """
        Retrieves relevant episodic memories (past tasks) related to the current goal.
        All returned data is sanitized to prevent prompt injection.
        """
        tasks = self.store.query_nodes_by_type("episodic_task")
        relevant = []
        # Strip punctuation and lowercase
        clean_goal = "".join(c for c in current_goal.lower() if c.isalnum() or c.isspace())
        words = set(clean_goal.split())
        print(f"DEBUG MEMORY: Searching for keywords {words} in {len(tasks)} tasks")
        # Heuristic: search past task goals or results for overlapping keywords
        for task in tasks:
            goal_text = task["data"].get("goal", "").lower()
            result_text = task["data"].get("result", "").lower()
            if any(word in goal_text for word in words) or any(word in result_text for word in words):
                print(f"DEBUG MEMORY: Found match in task Goal: {goal_text[:30]}...")
                # SECURITY: Sanitize all fields before returning
                sanitized_data = {
                    "goal": sanitize_memory_content(task["data"].get("goal", "")),
                    "result": sanitize_memory_content(task["data"].get("result", "")),
                    "status": task["data"].get("status", ""),
                    "task_id": task["data"].get("task_id", ""),
                }
                relevant.append(sanitized_data)
        return relevant
