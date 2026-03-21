# main.py
# Entry point for the Sentiment & Emotion Analysis microservice.

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sentiment_analyser import analyse_sentiment
from emotion_detector import detect_emotion
from tone_adapter import get_tone_style
from session_tracker import record_emotion_log, get_mood_history
from pydantic import BaseModel, ConfigDict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#  This server runs on port 8001 so it can run at the same time
#  as feature 1's chatbot server on port 8000.
app = FastAPI(
    title='Coffee Sentiment Service',
    description=(
        'Feature 2 — Emotion & Sentiment Analysis for the AI-Powered '
        'Coffee Recommendation Chatbot. Analyses user messages to detect '
        'sentiment polarity and emotional state, then returns tone guidance '
        'for the chatbot and recommendation strategy for the product matcher.'
    ),
    version='1.0',
)

# Allow requests from the mobile app and other microservices
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.exception_handler(Exception)
def unhandled_exception_handler(request, exc):
    """Return 500 with error detail so we can see DB/connection errors."""
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


# Request body shape 
class TextInput(BaseModel):
    text: str
    session_id: str = ''

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'text': 'I am absolutely exhausted today, had the worst day.',
                'session_id': 'user_session_001',
            }
        }
    )


# MAIN ENDPOINT
# This is the endpoint Feature 1
# Returns everything: sentiment, emotion, intensity, tone style, keywords found.
@app.post(
    '/analyze/sentiment',
    summary='Full Sentiment + Emotion Analysis',
    description=(
        'Main endpoint — analyses sentiment polarity AND detects the '
        'specific emotion. Returns tone style for the chatbot and '
        'keyword evidence for explainability.'
    ),
)
def analyze_full(request: TextInput):
    '''
    Week 6 test cases:

    Test 1 — Tired:
      Input:  {"text": "I am absolutely exhausted today", "session_id": "test1"}
      Expect: {"sentiment": "Negative", "mood": "Tired", "intensity": > 0.7}

    Test 2 — Happy:
      Input:  {"text": "I am feeling fantastic and full of energy!", "session_id": "test1"}
      Expect: {"sentiment": "Positive", "mood": "Happy", "intensity": > 0.8}

    Test 3 — Stressed:
      Input:  {"text": "So much work to do, feeling overwhelmed", "session_id": "test1"}
      Expect: {"sentiment": "Negative", "mood": "Stressed", "intensity": > 0.6}

    Test 4 — Neutral/Calm:
      Input:  {"text": "I want a coffee please", "session_id": "test1"}
      Expect: {"sentiment": "Neutral", "mood": "Calm"}
    '''

    # Step 1: Get sentiment polarity (Positive / Neutral / Negative)
    sentiment_result = analyse_sentiment(request.text)

    # Step 2: Get specific emotion (Happy, Tired, Stressed, etc.)
    emotion_result = detect_emotion(request.text)

    # Step 3: Get the tone style the chatbot should use
    tone = get_tone_style(emotion_result['emotion'])
    tone_style_name = tone.get('style', 'friendly')

    # Step 4: Persist to PostgreSQL (emotion_logs + sessions_mood_summary) if session_id provided
    persisted = False
    persist_error = None
    if request.session_id:
        try:
            record_emotion_log(
                session_id=request.session_id,
                message_text=request.text,
                sentiment_polarity=sentiment_result['polarity'],
                sentiment_score=sentiment_result['score'],
                emotion_label=emotion_result['emotion'],
                intensity=emotion_result['intensity'],
                detection_method=emotion_result['method'],
                keywords_found=emotion_result.get('keywords'),
                tone_style=tone_style_name,
            )
            persisted = True
        except Exception as e:
            logger.warning("Failed to persist emotion log: %s", e, exc_info=True)
            persist_error = str(e)

    # Return the full analysis result
    out = {
        'sentiment':      sentiment_result['polarity'],    # e.g. 'Negative'
        'mood':           emotion_result['emotion'],       # e.g. 'Tired'
        'intensity':      emotion_result['intensity'],     # e.g. 0.87
        'score':          sentiment_result['score'],       # e.g. -0.62 (VADER compound)
        'tone_style':     tone,                            # full tone profile dict
        'keywords_found': emotion_result['keywords'],      # e.g. ['exhausted', 'worst']
        'method':         emotion_result['method'],        # 'keyword' or 'ml_model'
    }
    if request.session_id:
        out['persisted'] = persisted
        if persist_error:
            out['persist_error'] = persist_error
    return out


# EMOTION-ONLY ENDPOINT
# Returns just the emotion breakdown 
@app.post(
    '/analyze/emotion',
    summary='Emotion Detection Only',
    description='Returns the specific emotion state without full sentiment analysis.',
)
def analyze_emotion_only(request: TextInput):
    '''
    Returns only the emotion breakdown.
    Useful for the admin dashboard (FR2 admin view).
    '''
    return detect_emotion(request.text)


# MOOD HISTORY ENDPOINT 
# Returns how the user's mood has changed during the conversation
@app.get(
    '/mood/history/{session_id}',
    summary='Get Session Mood History',
    description='Returns all mood entries recorded for a session. Use after running the 4 test cases.',
)
def mood_history(session_id: str):
    '''
    After running all 4 test cases with session_id "test1",
    call GET /mood/history/test1 to see all 4 recorded mood entries.
    '''
    return {
        'session_id': session_id,
        'history':    get_mood_history(session_id),
    }


# HEALTH CHECK 
@app.get('/', summary='Health Check')
def health():
    return {
        'status':  'Sentiment service is running!',
        'port':    8001,
        'owner':   'IT24102854 - Bandara M.R.C.D.',
        'feature': 'Feature 2 — Emotion & Sentiment Analysis',
        'docs':    'http://127.0.0.1:8001/docs',
    }
