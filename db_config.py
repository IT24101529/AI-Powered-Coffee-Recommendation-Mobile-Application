# db_config.py
# PostgreSQL connection settings for Feature 2 — Emotion & Sentiment Analysis.

import os

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', '5432'))
DB_NAME = os.environ.get('DB_NAME', 'coffee_chatbot')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')


def _quote_dsn_value(value: str) -> str:
    """Quote value for libpq if it contains spaces or special characters."""
    s = str(value).strip()
    if not s or all(c.isalnum() or c in '_.-' for c in s):
        return s
    # Escape single quotes by doubling them (libpq convention)
    escaped = s.replace('\\', '\\\\').replace("'", "''")
    return f"'{escaped}'"


def get_connection_string():
    return (
        f'host={_quote_dsn_value(DB_HOST)} port={DB_PORT} '
        f'dbname={_quote_dsn_value(DB_NAME)} '
        f'user={_quote_dsn_value(DB_USER)} password={_quote_dsn_value(DB_PASSWORD)}'
    )
