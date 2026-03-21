# db.py
# PostgreSQL connection and helpers for Feature 2.
# Uses tables: sessions, emotion_logs, sessions_mood_summary (see feature2_schema.sql).

import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

from db_config import get_connection_string


@contextmanager
def get_connection():
    """Context manager for a single DB connection. Commits on success, rolls back on error."""
    conn = psycopg2.connect(get_connection_string())
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def ensure_session(conn, session_id: str):
    """Ensure a row exists in sessions (Feature 1 table). Idempotent."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO sessions (session_id, state)
            VALUES (%s, NULL)
            ON CONFLICT (session_id) DO NOTHING
            """,
            (session_id,),
        )
