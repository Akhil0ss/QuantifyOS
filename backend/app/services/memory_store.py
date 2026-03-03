import sqlite3
import os
import json
from typing import List, Dict, Any, Optional
from app.core.saas import WorkspaceManager

class SQLiteMemoryStore:
    """
    Handles local persistence for the Topological Memory graph using SQLite.
    Stores nodes and triplets (relationships).
    """
    def __init__(self, workspace_id: str):
        # We store the memory in the isolated workspace data directory
        wm = WorkspaceManager(workspace_id)
        self.db_path = wm.get_path(f"memory.db")
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Nodes: id, type, data (JSON), timestamp
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS nodes (
                    id TEXT PRIMARY KEY,
                    type TEXT,
                    data TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Triplets: subject_id, predicate, object_id
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS triplets (
                    subject_id TEXT,
                    predicate TEXT,
                    object_id TEXT,
                    FOREIGN KEY(subject_id) REFERENCES nodes(id),
                    FOREIGN KEY(object_id) REFERENCES nodes(id)
                )
            """)
            # Layer Index: node_id, layer (Semantic, Procedural, etc.)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS layers (
                    node_id TEXT,
                    layer TEXT,
                    FOREIGN KEY(node_id) REFERENCES nodes(id)
                )
            """)
            conn.commit()

    def add_node(self, node_id: str, node_type: str, data: Dict[str, Any], layer: Optional[str] = None):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO nodes (id, type, data) VALUES (?, ?, ?)",
                (node_id, node_type, json.dumps(data))
            )
            if layer:
                cursor.execute(
                    "INSERT OR REPLACE INTO layers (node_id, layer) VALUES (?, ?)",
                    (node_id, layer)
                )
            conn.commit()

    def add_relation(self, subject_id: str, predicate: str, object_id: str):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO triplets (subject_id, predicate, object_id) VALUES (?, ?, ?)",
                (subject_id, predicate, object_id)
            )
            conn.commit()

    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT type, data FROM nodes WHERE id = ?", (node_id,))
            row = cursor.fetchone()
            if row:
                return {"type": row[0], "data": json.loads(row[1])}
        return None

    def query_nodes_by_type(self, node_type: str) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, data FROM nodes WHERE type = ?", (node_type,))
            return [{"id": row[0], "data": json.loads(row[1])} for row in cursor.fetchall()]

    def get_related_nodes(self, node_id: str, predicate: Optional[str] = None) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            query = "SELECT object_id, predicate FROM triplets WHERE subject_id = ?"
            args = [node_id]
            if predicate:
                query += " AND predicate = ?"
                args.append(predicate)
            
            cursor.execute(query, tuple(args))
            results = []
            for row in cursor.fetchall():
                node_data = self.get_node(row[0])
                if node_data:
                    results.append({"id": row[0], "predicate": row[1], **node_data})
            return results

    def export_snapshot(self) -> str:
        """Serializes the entire memory graph into a JSON string for replay snapshots."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get all nodes
            cursor.execute("SELECT id, type, data, timestamp FROM nodes")
            nodes = [
                {"id": r[0], "type": r[1], "data": json.loads(r[2]), "timestamp": r[3]} 
                for r in cursor.fetchall()
            ]
            
            # Get all triplets
            cursor.execute("SELECT subject_id, predicate, object_id FROM triplets")
            triplets = [
                {"subject_id": r[0], "predicate": r[1], "object_id": r[2]} 
                for r in cursor.fetchall()
            ]
            
            # Get all layers
            cursor.execute("SELECT node_id, layer FROM layers")
            layers = [{"node_id": r[0], "layer": r[1]} for r in cursor.fetchall()]
            
            snapshot = {
                "nodes": nodes,
                "triplets": triplets,
                "layers": layers
            }
            return json.dumps(snapshot)

