# Saves the complete context snapshot to the context_logs table.
# Also provides a function to retrieve the latest context for a session.

from database import ContextLog
from datetime import datetime

def save_context_log(
    db,
    session_id:     str,
    cache_id:       int,
    temp_tag:       str,
    condition_tag:  str,
    time_of_day:    str,
    weight_vector:  str,
    is_override:    bool = False,
) -> int:
    '''
    Saves one context snapshot to the context_logs table.
    Returns the auto-generated ID of the new row.
    '''
    log = ContextLog(
        session_id       = session_id,
        weather_cache_id = cache_id if cache_id else 0,
        temp_tag         = temp_tag,
        condition_tag    = condition_tag,
        time_of_day      = time_of_day,
        weight_vector    = weight_vector,
        is_override      = is_override,
        created_at       = datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    print(f'[ContextLogger] Saved log ID={log.id} for session={session_id}')
    return log.id


def get_latest_context(db, session_id: str) -> dict:
    '''
    Returns the most recent context log for a session.
    Used by GET /context/session/{session_id}.
    '''
    log = db.query(ContextLog).filter(
        ContextLog.session_id == session_id
    ).order_by(ContextLog.created_at.desc()).first()

    if not log:
        return None

    return {
        'session_id':    log.session_id,
        'temp_tag':      log.temp_tag,
        'condition_tag': log.condition_tag,
        'time_of_day':   log.time_of_day,
        'weight_vector': log.weight_vector,
        'is_override':   log.is_override,
        'created_at':    log.created_at.isoformat(),
    }


def get_all_logs_for_session(db, session_id: str) -> list:
    '''Returns all context snapshots for a session (audit trail).'''
    logs = db.query(ContextLog).filter(
        ContextLog.session_id == session_id
    ).order_by(ContextLog.created_at.asc()).all()

    return [
        {'id': l.id, 'temp_tag': l.temp_tag, 'condition_tag': l.condition_tag,
         'time_of_day': l.time_of_day, 'created_at': l.created_at.isoformat()}
        for l in logs
    ]