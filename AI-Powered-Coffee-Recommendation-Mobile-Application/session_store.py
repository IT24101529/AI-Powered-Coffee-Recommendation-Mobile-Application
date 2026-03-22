# session_store.py
# Stores and manages session data for each user's conversation.
# Think of each session as a temporary notebook for one customer.

import uuid                # Generates unique IDs
from datetime import datetime

# This dictionary holds all active sessions in memory
# Key = session_id, Value = dict of session data
_sessions = {}

def create_session() -> str:
    session_id = str(uuid.uuid4())   # Generate a unique ID like '3f2a-...'
    _sessions[session_id] = {
        'state': 'IDLE',             # Starting state
        'step': None,                # Current question step
        'mood': None,                # Detected mood
        'temp_pref': None,           # Hot/Cold preference
        'last_recommendation': None, # Last suggested product
        'history': [],               # Full conversation history
        'created_at': datetime.now().isoformat()
    }
    return session_id

def get_session(session_id: str) -> dict:
    return _sessions.get(session_id)   # Returns None if session not found

def update_session(session_id: str, updates: dict):
    if session_id in _sessions:
        _sessions[session_id].update(updates)   # Merge updates into session

def delete_session(session_id: str):
    if session_id in _sessions:
        del _sessions[session_id]

def append_history(session_id: str, role: str, message: str):
    # role is either 'user' or 'bot'
    if session_id in _sessions:
        _sessions[session_id]['history'].append({
            'role': role,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
