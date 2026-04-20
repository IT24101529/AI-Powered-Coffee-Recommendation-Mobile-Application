from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentiment_analyser import analyse_sentiment
from emotion_detector import detect_emotion
from tone_adapter import get_tone_style
from session_tracker import record_mood, get_mood_history

app = FastAPI(title='Coffee Sentiment Service', version='1.0')


# ── Startup: create tables & seed keywords ──────────────────────
@app.on_event('startup')
def on_startup():
    try:
        from database import create_tables, seed_emotion_keywords, SessionLocal
        create_tables()
        db = SessionLocal()
        seed_emotion_keywords(db)
        db.close()
    except Exception as e:
        print(f'[SentimentService] DB startup warning (non-fatal): {e}')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# Define the shape of the incoming request
class TextInput(BaseModel):
    text: str              # The message text to analyse
    session_id: str = ''   # Optional: used to track mood over time


# ── MAIN ENDPOINT ────────────────────────────────────────────────
# This is the endpoint Wijerathna calls after every user message.
# It returns everything: sentiment, emotion, intensity, tone style.
@app.post('/analyze/sentiment')
def analyze_full(request: TextInput):
    # Step 1: Get sentiment polarity (Positive / Neutral / Negative)
    sentiment_result = analyse_sentiment(request.text)

    # Step 2: Get specific emotion (Happy, Tired, Stressed, etc.)
    emotion_result = detect_emotion(request.text)

    # Step 3: Get the tone style the chatbot should use
    tone = get_tone_style(emotion_result['emotion'])

    # Step 4: Save mood to session history if session_id is provided
    if request.session_id:
        record_mood(request.session_id, emotion_result['emotion'], sentiment_result['score'])

    # Return the full analysis result
    return {
        'sentiment':  sentiment_result['polarity'],   # e.g. 'Negative'
        'mood':       emotion_result['emotion'],      # e.g. 'Tired'
        'intensity':  emotion_result['intensity'],    # e.g. 0.87
        'score':      sentiment_result['score'],      # e.g. -0.62 (VADER compound)
        'method':     emotion_result.get('method', 'unknown'),
        'tone_style': tone,                           # e.g. 'gentle'
        'keywords_found': emotion_result['keywords'] # e.g. ['exhausted', 'worst']
    }


# ── EMOTION-ONLY ENDPOINT ────────────────────────────────────────
# Returns just the emotion breakdown (used for analytics / admin).
@app.post('/analyze/emotion')
def analyze_emotion_only(request: TextInput):
    return detect_emotion(request.text)


# ── MOOD HISTORY ENDPOINT ────────────────────────────────────────
# Returns how the user's mood has changed during the conversation.
@app.get('/mood/history/{session_id}')
def mood_history(session_id: str):
    return {'session_id': session_id, 'history': get_mood_history(session_id)}


# ── HEALTH CHECK ─────────────────────────────────────────────────
@app.get('/')
def health():
    return {'status': 'Sentiment service is running!'}
