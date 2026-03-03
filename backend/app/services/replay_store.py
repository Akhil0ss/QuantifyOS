import sqlite3
import os
import json
import uuid
import time
from typing import List, Dict, Any, Optional
from app.core.saas import WorkspaceManager

class ReplayStore:
    """
    Handles local SQLite persistence for deterministic replay mode.
    Stores full execution snapshots: prompts, LLM responses, memory states, and tool versions.
    """
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        wm = WorkspaceManager(workspace_id)
        self.db_path = wm.get_path("replay.db")
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Replay Sessions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS replay_sessions (
                    session_id TEXT PRIMARY KEY,
                    task_id TEXT,
                    workspace_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT,
                    original_result TEXT
                )
            """)
            
            # LLM Calls
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS llm_calls (
                    call_id TEXT PRIMARY KEY,
                    session_id TEXT,
                    sequence INTEGER,
                    prompt_hash TEXT,
                    prompt_text TEXT,
                    system_message TEXT,
                    response_text TEXT,
                    provider TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(session_id) REFERENCES replay_sessions(session_id)
                )
            """)
            
            # Memory Snapshots
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS memory_snapshots (
                    session_id TEXT PRIMARY KEY,
                    snapshot_json TEXT,
                    FOREIGN KEY(session_id) REFERENCES replay_sessions(session_id)
                )
            """)
            
            # Tool Versions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tool_versions (
                    session_id TEXT,
                    tool_name TEXT,
                    version TEXT,
                    file_hash TEXT,
                    file_path TEXT,
                    PRIMARY KEY (session_id, tool_name),
                    FOREIGN KEY(session_id) REFERENCES replay_sessions(session_id)
                )
            """)
            
            conn.commit()

    def start_session(self, task_id: str) -> str:
        """Starts a new replay recording session."""
        session_id = str(uuid.uuid4())
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO replay_sessions (session_id, task_id, workspace_id, status) VALUES (?, ?, ?, ?)",
                (session_id, task_id, self.workspace_id, "recording")
            )
            conn.commit()
        return session_id

    def finish_session(self, session_id: str, original_result: str):
        """Marks a recording session as complete."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE replay_sessions SET status = ?, original_result = ? WHERE session_id = ?",
                ("completed", original_result, session_id)
            )
            conn.commit()

    def record_llm_call(self, session_id: str, sequence: int, prompt_hash: str, prompt_text: str, 
                        system_message: Optional[str], response_text: str, provider: str):
        """Records a single LLM interaction for exact playback."""
        call_id = str(uuid.uuid4())
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO llm_calls 
                   (call_id, session_id, sequence, prompt_hash, prompt_text, system_message, response_text, provider) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (call_id, session_id, sequence, prompt_hash, prompt_text, system_message, response_text, provider)
            )
            conn.commit()

    def save_memory_snapshot(self, session_id: str, snapshot_json: str):
        """Stores the state of the topological memory graph prior to execution."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO memory_snapshots (session_id, snapshot_json) VALUES (?, ?)",
                (session_id, snapshot_json)
            )
            conn.commit()

    def save_tool_version(self, session_id: str, tool_name: str, version: str, file_hash: str, file_path: str):
        """Records the version of an evolved tool used during this session."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO tool_versions 
                   (session_id, tool_name, version, file_hash, file_path) 
                   VALUES (?, ?, ?, ?, ?)""",
                (session_id, tool_name, version, file_hash, file_path)
            )
            conn.commit()

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM replay_sessions WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def list_sessions(self) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM replay_sessions ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]

    def get_llm_calls(self, session_id: str) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM llm_calls WHERE session_id = ? ORDER BY sequence ASC", (session_id,))
            return [dict(row) for row in cursor.fetchall()]

    def get_memory_snapshot(self, session_id: str) -> Optional[str]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT snapshot_json FROM memory_snapshots WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            return row[0] if row else None
