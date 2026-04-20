"""
Session mood tracker with write-through persistence to PostgreSQL.
Keeps in-memory dict for fast access; writes to emotion_logs and session_mood_summary tables.
"""
from datetime import datetime

# In-memory store: { session_id: [{'emotion': ..., 'score': ..., 'time': ...}, ...] }
_mood_history = {}


# ── Lazy DB helpers ──────────────────────────────────────────────
def _get_db_session():
    """Returns a new SQLAlchemy session, or None if DB is unavailable."""
    try:
        from database import SessionLocal
        return SessionLocal()
    except Exception:
        return None


def _ensure_sentiment_session(db, session_id):
    """Creates a sentiment_sessions row if it doesn't exist yet."""
    try:
        from database import SentimentSession
        existing = db.query(SentimentSession).filter_by(session_id=session_id).first()
        if not existing:
            db.add(SentimentSession(session_id=session_id, state='active'))
            db.commit()
    except Exception as e:
        print(f'[SessionTracker] DB ensure_session error: {e}')


def _persist_emotion_log(session_id, emotion, score):
    """Writes an emotion log entry to PostgreSQL."""
    try:
        from database import EmotionLog
        db = _get_db_session()
        if not db:
            return
        _ensure_sentiment_session(db, session_id)
        log = EmotionLog(
            session_id=session_id,
            message_text='',           # Will be enriched by main.py if needed
            sentiment_score=score,
            emotion_label=emotion,
            detection_method='tracker',
        )
        db.add(log)
        db.commit()
        db.close()
    except Exception as e:
        print(f'[SessionTracker] DB persist_emotion_log error: {e}')


def _update_mood_summary(session_id, current_mood, score):
    """Updates (or creates) the session_mood_summary row."""
    try:
        from database import SessionMoodSummary
        db = _get_db_session()
        if not db:
            return
        summary = db.query(SessionMoodSummary).filter_by(session_id=session_id).first()
        history = _mood_history.get(session_id, [])
        dominant = _compute_dominant(history)
        trend = _compute_trend(history)

        if summary:
            summary.current_mood = current_mood
            summary.dominant_mood = dominant
            summary.mood_trend = trend
            summary.message_count = len(history)
            summary.last_score = score
            summary.updated_at = datetime.utcnow()
        else:
            db.add(SessionMoodSummary(
                session_id=session_id,
                current_mood=current_mood,
                dominant_mood=dominant,
                mood_trend=trend,
                message_count=len(history),
                last_score=score,
            ))
        db.commit()
        db.close()
    except Exception as e:
        print(f'[SessionTracker] DB update_mood_summary error: {e}')


def _compute_dominant(history):
    """Returns the most frequent emotion in the history."""
    if not history:
        return 'Calm'
    counts = {}
    for entry in history:
        e = entry['emotion']
        counts[e] = counts.get(e, 0) + 1
    return max(counts, key=counts.get)


def _compute_trend(history):
    """Computes whether mood is improving, worsening, or stable."""
    if len(history) < 2:
        return 'stable'
    recent_scores = [h.get('score', 0) for h in history[-5:]]
    if len(recent_scores) < 2:
        return 'stable'
    delta = recent_scores[-1] - recent_scores[0]
    if delta > 0.15:
        return 'improving'
    elif delta < -0.15:
        return 'worsening'
    return 'stable'


# ── Public API (unchanged signatures) ───────────────────────────

def record_mood(session_id: str, emotion: str, score: float):
    '''
    Adds a new mood entry to the session's history.
    Called after every message analysis.
    '''
    if session_id not in _mood_history:
        _mood_history[session_id] = []

    _mood_history[session_id].append({
        'emotion':   emotion,
        'score':     score,
        'timestamp': datetime.now().isoformat()
    })

    # Persist to DB
    _persist_emotion_log(session_id, emotion, score)
    _update_mood_summary(session_id, emotion, score)


def get_mood_history(session_id: str) -> list:
    '''Returns the full mood history list for a session.'''
    return _mood_history.get(session_id, [])


def get_current_mood(session_id: str) -> str:
    '''Returns the most recently detected mood for a session.'''
    history = _mood_history.get(session_id, [])
    if not history:
        return 'Calm'
    return history[-1]['emotion']


def get_dominant_mood(session_id: str) -> str:
    '''
    Returns the most frequently detected mood in the session.
    Useful for long conversations where mood fluctuates.
    '''
    return _compute_dominant(_mood_history.get(session_id, []))


def clear_session(session_id: str):
    '''Removes mood history when a session ends.'''
    if session_id in _mood_history:
        del _mood_history[session_id]
