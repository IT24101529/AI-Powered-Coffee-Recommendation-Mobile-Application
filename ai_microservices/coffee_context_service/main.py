# main.py
# FastAPI server for the Context-Aware Integration System.
# Runs on port 8002.
# 4 endpoints: /context/weather, /context/time, /context/all, /context/override

from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import os, json
from dotenv import load_dotenv

from database import get_db, create_tables
from weather_fetcher import get_weather
from time_classifier import get_full_time_context
from tag_classifier import classify_all, display_condition
from weight_calculator import compute_weight_vector
from context_logger import save_context_log, get_latest_context, get_all_logs_for_session
from rules_seeder import seed_rules
from decision_tree import predict_context_type

load_dotenv()
DEFAULT_LOCATION = os.getenv('DEFAULT_LOCATION', 'Kandy,LK')

app = FastAPI(title='Coffee Context-Aware Service', version='1.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

@app.on_event('startup')
def startup():
    create_tables()
    db = next(get_db())
    seed_rules()             # Seed rules if table is empty
    print('Context service started on port 8002!')


# ── REQUEST MODELS ───────────────────────────────────────────────
class OverrideInput(BaseModel):
    session_id:     str
    temperature:    float   # Temperature in °C to simulate
    condition:      str     # One of: Clear, Rain, Clouds, Thunderstorm
    location:       str = 'Override'


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENDPOINT 1: GET /context/weather
# Returns current weather data (with caching) for a location.
# Used for testing and admin viewing of raw weather data.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.get('/context/weather')
def get_weather_endpoint(
    location: str = Query(default=None, description='e.g. Kandy,LK or Colombo,LK'),
    db: Session = Depends(get_db)
):
    loc = location or DEFAULT_LOCATION
    weather = get_weather(db, loc)
    tags    = classify_all(weather['temperature_celsius'], weather['condition'])
    time_ctx = get_full_time_context()
    return {
        'location':             loc,
        'temperature_celsius':  weather['temperature_celsius'],
        'raw_condition':        weather['condition'],
        'raw_description':      weather['raw_description'],
        'humidity_percent':     weather['humidity_percent'],
        'temp_tag':             tags['temp_tag'],
        'condition_tag':        tags['condition_tag'],
        'condition_display':    display_condition(tags['condition_tag'], time_ctx['time_of_day']),
        'from_cache':           weather['from_cache'],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENDPOINT 2: GET /context/time
# Returns the current time-of-day context for Sri Lanka.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.get('/context/time')
def get_time_endpoint():
    return get_full_time_context()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENDPOINT 3: GET /context/all    ← THIS IS THE MAIN ENDPOINT
# Wijerathna calls this at the start of every recommendation flow.
# Returns the complete context snapshot including weight_vector.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.get('/context/all')
def get_full_context(
    session_id: str = Query(..., description='The active session ID from Feature 1'),
    location:   str = Query(default=None, description='Location override e.g. Colombo,LK'),
    db: Session = Depends(get_db)
):
<<<<<<< HEAD
    # ── Sub-step 0: Check for active override persistence ────────
    # If the user manually simulated weather, we stick to it for the session.
    latest = get_latest_context(db, session_id)
    if latest and latest.get('is_override'):
        print(f'[ContextAPI] Using existing override for session={session_id}')
        return {
            'weather':           latest['temp_tag'],
            'condition':         latest['condition_tag'],
            'condition_display': display_condition(latest['condition_tag'], latest['time_of_day']),
            'time_of_day':       latest['time_of_day'],
            'weight_vector':     json.loads(latest['weight_vector']) if isinstance(latest['weight_vector'], str) else latest['weight_vector'],
            'temperature_celsius': latest['temperature_celsius'],
            'is_override':       True,
            'location':          'Override'
        }

=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
    loc = location or DEFAULT_LOCATION

    # ── Sub-step 1: Get weather (cached or live) ─────────────────
    weather = get_weather(db, loc)
<<<<<<< HEAD
    if not weather:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Weather data for location '{loc}' is currently unavailable.")
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b

    # ── Sub-step 2: Get time context ─────────────────────────────
    time_ctx = get_full_time_context()

    # ── Sub-step 3: Classify raw values into tags ─────────────────
    tags = classify_all(weather['temperature_celsius'], weather['condition'])

    # ── Sub-step 4: Compute weight vector (fuzzy + rule + DT) ─────
    weight_result = compute_weight_vector(
        db            = db,
        temp_celsius  = weather['temperature_celsius'],
        condition_tag = tags['condition_tag'],
        temp_tag      = tags['temp_tag'],
        time_of_day   = time_ctx['time_of_day'],
        current_hour  = time_ctx['hour'],
    )

    # ── Sub-step 5: Save context snapshot to context_logs ─────────
    log_id = save_context_log(
        db            = db,
        session_id    = session_id,
        cache_id      = weather.get('cache_id'),
        temp_tag      = tags['temp_tag'],
        condition_tag = tags['condition_tag'],
        time_of_day   = time_ctx['time_of_day'],
        weight_vector = weight_result['weight_vector'],
        is_override   = False,
    )

    # ── Sub-step 6: Return structured response ────────────────────
    return {
        # Core fields (Wijerathna stores these in session state)
        'weather':        tags['temp_tag'],         # e.g. 'Cool'
        'condition':      tags['condition_tag'],    # e.g. 'Rainy'
        'condition_display': display_condition(tags['condition_tag'], time_ctx['time_of_day']),
        'time_of_day':    time_ctx['time_of_day'], # e.g. 'Morning'
        'weight_vector':  weight_result['weights_dict'],  # For Ekanayake

        # Enrichment data
        'temperature_celsius':  weather['temperature_celsius'],
        'recommended_type':     weight_result['recommended_type'],
        'location':             loc,
        'from_cache':           weather['from_cache'],

        # Explainability data (useful for debugging and presentation)
        'rule_match_type':  weight_result['rule_match_type'],
        'rule_confidence':  weight_result['rule_confidence'],
        'dt_context_type':  weight_result['dt_context_type'],
        'dt_confidence':    weight_result['dt_confidence'],
        'fuzzy_warmth':     weight_result['fuzzy_warmth'],
        'fuzzy_caffeine':   weight_result['fuzzy_caffeine'],
        'log_id':           log_id,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENDPOINT 4: POST /context/override  (FR3.5)
# Allows manual simulation of a weather condition.
# Used in testing and when the user provides explicit context.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.post('/context/override')
def override_context(override: OverrideInput, db: Session = Depends(get_db)):
    time_ctx = get_full_time_context()
    tags     = classify_all(override.temperature, override.condition)

    weight_result = compute_weight_vector(
        db            = db,
        temp_celsius  = override.temperature,
        condition_tag = tags['condition_tag'],
        temp_tag      = tags['temp_tag'],
        time_of_day   = time_ctx['time_of_day'],
        current_hour  = time_ctx['hour'],
    )

    log_id = save_context_log(
        db            = db,
        session_id    = override.session_id,
        cache_id      = None,
        temp_tag      = tags['temp_tag'],
        condition_tag = tags['condition_tag'],
        time_of_day   = time_ctx['time_of_day'],
        weight_vector = weight_result['weight_vector'],
        is_override   = True,
<<<<<<< HEAD
        temp_celsius  = override.temperature
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
    )

    return {
        'weather':       tags['temp_tag'],
        'condition':     tags['condition_tag'],
        'condition_display': display_condition(tags['condition_tag'], time_ctx['time_of_day']),
        'time_of_day':   time_ctx['time_of_day'],
        'weight_vector': weight_result['weights_dict'],
        'recommended_type': weight_result['recommended_type'],
        'is_override':   True,
<<<<<<< HEAD
        'temperature_celsius': override.temperature,
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        'log_id':        log_id,
    }


<<<<<<< HEAD
@app.delete('/context/override/{session_id}')
def reset_override(session_id: str, db: Session = Depends(get_db)):
    '''
    Clears the override for the session by saving a new 'Live' log entry.
    '''
    # We fetch the live context first
    loc = DEFAULT_LOCATION
    weather = get_weather(db, loc)
    
    if not weather:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Service unavailable: Cannot fetch live weather for reset.")
        
    time_ctx = get_full_time_context()
    tags     = classify_all(weather['temperature_celsius'], weather['condition'])
    
    weight_result = compute_weight_vector(
        db            = db,
        temp_celsius  = weather['temperature_celsius'],
        condition_tag = tags['condition_tag'],
        temp_tag      = tags['temp_tag'],
        time_of_day   = time_ctx['time_of_day'],
        current_hour  = time_ctx['hour'],
    )
    
    # Save a fresh snapshot with is_override=False to clear the session persistence
    save_context_log(
        db            = db,
        session_id    = session_id,
        cache_id      = weather.get('cache_id'),
        temp_tag      = tags['temp_tag'],
        condition_tag = tags['condition_tag'],
        time_of_day   = time_ctx['time_of_day'],
        weight_vector = weight_result['weight_vector'],
        is_override   = False,
        temp_celsius  = weather['temperature_celsius']
    )
    
    # Return the full context snapshot so the UI restores completely
    return get_full_context(session_id=session_id, db=db)


=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
# BONUS ENDPOINT: Retrieve past context for a session
@app.get('/context/session/{session_id}')
def get_session_context(session_id: str, db: Session = Depends(get_db)):
    latest = get_latest_context(db, session_id)
    all_logs = get_all_logs_for_session(db, session_id)
    return {'latest': latest, 'all_snapshots': all_logs}


@app.get('/')
def health():
    return {'status': 'Context service is running on port 8002!',
            'endpoints': ['/context/weather', '/context/time', '/context/all', '/context/override']}