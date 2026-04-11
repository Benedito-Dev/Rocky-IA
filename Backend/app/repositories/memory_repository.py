import sqlite3
from pathlib import Path
from difflib import SequenceMatcher

DB_PATH = Path(__file__).parent.parent.parent / "memory.db"
SIMILARITY_THRESHOLD = 0.85
LOOKBACK = 4

def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn

def _is_redundant(conn, role: str, content: str) -> bool:
    rows = conn.execute(
        "SELECT content FROM messages WHERE role = ? ORDER BY id DESC LIMIT ?",
        (role, LOOKBACK)
    ).fetchall()
    for (existing,) in rows:
        if existing == content:
            return True
        if SequenceMatcher(None, existing.lower(), content.lower()).ratio() >= SIMILARITY_THRESHOLD:
            return True
    return False

def load() -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT role, content FROM messages ORDER BY id"
        ).fetchall()
    return [{"role": r, "content": c} for r, c in rows]

def save_message(role: str, content: str, max_rows: int = 40) -> bool:
    with _connect() as conn:
        if _is_redundant(conn, role, content):
            return False
        conn.execute("INSERT INTO messages (role, content) VALUES (?, ?)", (role, content))
        conn.execute("""
            DELETE FROM messages WHERE id IN (
                SELECT id FROM messages ORDER BY id
                LIMIT MAX(0, (SELECT COUNT(*) FROM messages) - ?)
            )
        """, (max_rows,))
        conn.commit()
    return True

def trim_oldest(n: int):
    with _connect() as conn:
        conn.execute("""
            DELETE FROM messages WHERE id IN (
                SELECT id FROM messages ORDER BY id LIMIT ?
            )
        """, (n,))
        conn.commit()
