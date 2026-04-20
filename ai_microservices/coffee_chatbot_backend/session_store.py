"""
Session store with write-through persistence to PostgreSQL.
Keeps in-memory dict for fast access; writes to chatbot_sessions table for durability.
"""
import uuid
from datetime import datetime

# In-memory store (fast reads during conversation)
_sessions = {}

# ── Lazy DB imports (avoids circular imports at module load) ─────
_db_available = False

def _get_db_session():
    """Returns a new SQLAlchemy session, or None if DB is unavailable."""
    global _db_available
    try:
        from database import SessionLocal
        return SessionLocal()
    except Exception:
        _db_available = False
        return None


def _persist_create(session_id: str, data: dict):
    """Writes a new session row to PostgreSQL."""
    try:
        from database import ChatbotSession
        db = _get_db_session()
        if not db:
            return
        row = ChatbotSession(
            session_id=session_id,
            state=data.get('state', 'IDLE'),
            step=data.get('step'),
            mood=data.get('mood'),
            temp_pref=data.get('temp_pref'),
            last_recommendation=str(data.get('last_recommendation')) if data.get('last_recommendation') else None,
            created_at=datetime.fromisoformat(data['created_at']) if isinstance(data.get('created_at'), str) else datetime.utcnow(),
        )
        db.add(row)
        db.commit()
        db.close()
    except Exception as e:
        print(f'[SessionStore] DB persist_create error: {e}')


def _persist_update(session_id: str, updates: dict):
    """Updates an existing session row in PostgreSQL."""
    try:
        from database import ChatbotSession
        db = _get_db_session()
        if not db:
            return
        row = db.query(ChatbotSession).filter_by(session_id=session_id).first()
        if row:
            db_columns = {'state', 'step', 'mood', 'temp_pref', 'last_recommendation'}
            for key, value in updates.items():
                if key in db_columns:
                    if key == 'last_recommendation' and value is not None:
                        value = str(value)
                    setattr(row, key, value)
            db.commit()
        db.close()
    except Exception as e:
        print(f'[SessionStore] DB persist_update error: {e}')


def _persist_delete(session_id: str):
    """Removes a session row from PostgreSQL."""
    try:
        from database import ChatbotSession
        db = _get_db_session()
        if not db:
            return
        db.query(ChatbotSession).filter_by(session_id=session_id).delete()
        db.commit()
        db.close()
    except Exception as e:
        print(f'[SessionStore] DB persist_delete error: {e}')


# ── Public API (unchanged signatures) ───────────────────────────

def create_session() -> str:
    session_id = str(uuid.uuid4())
    data = {
        'state': 'IDLE',
        'step': None,
        'mood': None,
        'temp_pref': None,
        'sugar_pref': None,
        'caffeine_pref': None,
        'last_recommendation': None,
        'last_product_topic': None,
        'recommendation_history': [],
        'recommendation_category_history': [],
        'history': [],
        'created_at': datetime.now().isoformat()
    }
    _sessions[session_id] = data
    _persist_create(session_id, data)
    return session_id


def get_session(session_id: str) -> dict:
    return _sessions.get(session_id)


def update_session(session_id: str, updates: dict):
    if session_id in _sessions:
        _sessions[session_id].update(updates)
        _persist_update(session_id, updates)


def delete_session(session_id: str):
    if session_id in _sessions:
        del _sessions[session_id]
    _persist_delete(session_id)


def append_history(session_id: str, role: str, message: str):
    if session_id in _sessions:
        _sessions[session_id]['history'].append({
            'role': role,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
