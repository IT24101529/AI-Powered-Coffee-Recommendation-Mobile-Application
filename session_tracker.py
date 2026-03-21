# session_tracker.py
# Records mood and full emotion analysis to PostgreSQL (Feature 2 schema).
# Tables: emotion_logs, sessions_mood_summary. Sessions table ensured on first use.

from db import get_connection, ensure_session
from psycopg2.extras import RealDictCursor

# Emotion → recommendation_strategy (for emotion_logs.recommendation_strategy)
EMOTION_TO_STRATEGY = {
    'Tired':    'energizing',
    'Stressed': 'calming',
    'Happy':    'celebratory',
    'Sad':      'comforting',
    'Excited':  'bold',
    'Calm':     'standard',
    'Anxious':  'calming',
}


def record_mood(session_id: str, emotion: str, score: float):
    '''
    Legacy: adds a new mood entry. Prefer record_emotion_log() for full DB write.
    Kept for backward compatibility; now a no-op if you use record_emotion_log.
    '''
    pass


def record_emotion_log(
    session_id: str,
    message_text: str,
    sentiment_polarity: str,
    sentiment_score: float,
    emotion_label: str,
    intensity: float,
    detection_method: str,
    keywords_found: list | None,
    tone_style: str,
):
    '''
    Inserts one row into emotion_logs and upserts sessions_mood_summary.
    Call this after each analysis when session_id is provided.
    '''
    recommendation_strategy = EMOTION_TO_STRATEGY.get(emotion_label, 'standard')
    keywords_arr = keywords_found if keywords_found is not None else []

    with get_connection() as conn:
        ensure_session(conn, session_id)

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO emotion_logs (
                    session_id, message_text, sentiment_polarity, sentiment_score,
                    emotion_label, intensity, detection_method, keywords_found,
                    tone_style, recommendation_strategy
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING log_id, created_at
                """,
                (
                    session_id,
                    message_text,
                    sentiment_polarity,
                    sentiment_score,
                    emotion_label,
                    intensity,
                    detection_method,
                    keywords_arr,
                    tone_style,
                    recommendation_strategy,
                ),
            )
            row = cur.fetchone()
            log_id = row[0] if row else None

        # Upsert sessions_mood_summary: current_mood, dominant_mood, mood_trend, message_count, last_score
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sessions_mood_summary (
                    session_id, current_mood, dominant_mood, mood_trend,
                    message_count, last_score, updated_at
                )
                VALUES (
                    %s, %s, %s, 'stable', 1, %s, NOW()
                )
                ON CONFLICT (session_id) DO UPDATE SET
                    current_mood   = EXCLUDED.current_mood,
                    last_score     = EXCLUDED.last_score,
                    message_count  = sessions_mood_summary.message_count + 1,
                    updated_at     = NOW(),
                    dominant_mood  = (
                        SELECT emotion_label
                        FROM (
                            SELECT emotion_label, COUNT(*) AS cnt
                            FROM emotion_logs
                            WHERE session_id = EXCLUDED.session_id
                            GROUP BY emotion_label
                            ORDER BY cnt DESC
                            LIMIT 1
                        ) t
                    ),
                    mood_trend     = CASE
                        WHEN sessions_mood_summary.last_score IS NOT NULL
                             AND EXCLUDED.last_score > sessions_mood_summary.last_score
                        THEN 'improving'
                        WHEN sessions_mood_summary.last_score IS NOT NULL
                             AND EXCLUDED.last_score < sessions_mood_summary.last_score
                        THEN 'declining'
                        ELSE sessions_mood_summary.mood_trend
                    END
                """,
                (session_id, emotion_label, emotion_label, sentiment_score),
            )

    return log_id


def get_mood_history(session_id: str) -> list:
    '''Returns mood history for the session from emotion_logs (DB).'''
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT emotion_label AS emotion, sentiment_score AS score, created_at AS timestamp
                FROM emotion_logs
                WHERE session_id = %s
                ORDER BY created_at ASC
                """,
                (session_id,),
            )
            rows = cur.fetchall()
    # Normalise for API: timestamp as ISO string
    return [
        {
            'emotion': r['emotion'],
            'score': float(r['score']) if r['score'] is not None else 0.0,
            'timestamp': r['timestamp'].isoformat() if hasattr(r['timestamp'], 'isoformat') else str(r['timestamp']),
        }
        for r in rows
    ]


def get_current_mood(session_id: str) -> str:
    '''Returns the most recently detected mood for the session (from DB).'''
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT current_mood FROM sessions_mood_summary WHERE session_id = %s
                """,
                (session_id,),
            )
            row = cur.fetchone()
    return row[0] if row else 'Calm'


def get_dominant_mood(session_id: str) -> str:
    '''Returns the most frequently detected mood in the session (from DB).'''
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT dominant_mood FROM sessions_mood_summary WHERE session_id = %s
                """,
                (session_id,),
            )
            row = cur.fetchone()
    return row[0] if row else 'Calm'


def clear_session(session_id: str):
    '''Removes mood history when a session ends (delete from DB).'''
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM sessions_mood_summary WHERE session_id = %s",
                (session_id,),
            )
            cur.execute(
                "DELETE FROM emotion_logs WHERE session_id = %s",
                (session_id,),
            )
            cur.execute(
                "DELETE FROM sessions WHERE session_id = %s",
                (session_id,),
            )
