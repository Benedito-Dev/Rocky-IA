import sqlite3
import logging
from pathlib import Path
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent.parent / "memory.db"
SIMILARITY_THRESHOLD = 0.85
MAX_FACTS = 50


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS long_term_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fact TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('preference', 'project', 'person', 'habit', 'context')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn


def _is_duplicate(conn: sqlite3.Connection, fact: str) -> bool:
    """Verifica se um fato similar ja existe na base (threshold 85%)."""
    rows = conn.execute(
        "SELECT fact FROM long_term_memory ORDER BY id DESC LIMIT ?",
        (MAX_FACTS,)
    ).fetchall()
    fact_lower = fact.lower()
    fact_words = set(fact_lower.split())
    for (existing,) in rows:
        if existing.lower() == fact_lower:
            return True
        existing_words = set(existing.lower().split())
        if fact_words and existing_words:
            intersection = fact_words & existing_words
            union = fact_words | existing_words
            jaccard = len(intersection) / len(union)
            if jaccard >= SIMILARITY_THRESHOLD:
                return True
        ratio = SequenceMatcher(None, existing.lower(), fact_lower).ratio()
        if ratio >= SIMILARITY_THRESHOLD:
            return True
    return False


def save_fact(fact: str, category: str) -> bool:
    """
    Salva um fato novo na long_term_memory.
    Retorna True se salvo, False se duplicata detectada.
    """
    valid_categories = {'preference', 'project', 'person', 'habit', 'context'}
    if category not in valid_categories:
        category = 'context'

    with _connect() as conn:
        if _is_duplicate(conn, fact):
            logger.debug(f"Fato duplicado ignorado: {fact[:60]}")
            return False
        conn.execute(
            "INSERT INTO long_term_memory (fact, category) VALUES (?, ?)",
            (fact, category)
        )
        conn.commit()
        logger.debug(f"Fato salvo [{category}]: {fact[:60]}")
    return True


def load_facts() -> list[dict]:
    """
    Carrega os fatos mais recentes (max MAX_FACTS), ordenados do mais recente para o mais antigo.
    Retorna lista de dicts com 'fact' e 'category'.
    """
    with _connect() as conn:
        rows = conn.execute(
            "SELECT fact, category FROM long_term_memory ORDER BY id DESC LIMIT ?",
            (MAX_FACTS,)
        ).fetchall()
    return [{"fact": f, "category": c} for f, c in rows]


def count() -> int:
    """Retorna o total de fatos salvos."""
    with _connect() as conn:
        result = conn.execute("SELECT COUNT(*) FROM long_term_memory").fetchone()
    return result[0] if result else 0
