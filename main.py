from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db, create_tables, seed_strategies
from feedback_store import save_feedback, get_all_feedback
from strategy_selector import select_strategy
from analytics import get_strategy_stats, get_overall_stats

app = FastAPI(title='Coffee Feedback & Learning Service', version='1.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

@app.on_event('startup')
def startup():
    create_tables()
    db = next(get_db())
    seed_strategies(db)


# ── REQUEST MODELS ───────────────────────────────────────────────
class FeedbackInput(BaseModel):
    session_id:      str
    product_name:    str
    strategy_used:   str            # 'content_based', 'mood_based', 'trending', 'hybrid'
    accepted:        bool           # Did user order it?
    rating:          Optional[float] = None   # 1-5 stars (if user gave explicit rating)
    user_mood:       Optional[str]   = 'Calm'
    weather_context: Optional[str]   = 'Warm'
    notes:           Optional[str]   = None

class StrategyRequest(BaseModel):
    session_id: str
    user_mood:  str = 'Calm'


# ── ENDPOINT 1: Submit Feedback ──────────────────────────────────
# Wijerathna calls this after every recommendation the user responds to.
@app.post('/feedback/submit')
def submit_feedback(feedback: FeedbackInput, db: Session = Depends(get_db)):
    print(f"[FEEDBACK] Received for product: {feedback.product_name}, strategy: {feedback.strategy_used}")
    try:
        result = save_feedback(db, feedback.dict())
        return {'success': True, 'message': 'Feedback recorded and strategy scores updated.', 'record_id': result}
    except Exception as e:
        print(f"[FEEDBACK] ERROR: {str(e)}")
        return {'success': False, 'message': str(e)}, 500


# ── ENDPOINT 2: Select Strategy ──────────────────────────────────
# Wijerathna calls this BEFORE making a recommendation.
# Returns which strategy to use (the bandit's decision).
@app.post('/strategies/select')
def get_strategy(request: StrategyRequest, db: Session = Depends(get_db)):
    chosen = select_strategy(db)
    return {
        'chosen_strategy': chosen,
        'description': {
            'content_based': 'Use Ekanayake cosine similarity matching',
            'mood_based':    'Use Bandara emotion as primary factor',
            'trending':      'Use Ishaak trending/popular items',
            'hybrid':        'Combine all strategies with equal weights',
        }.get(chosen, 'Unknown'),
    }


# ── ENDPOINT 3: Strategy Performance ────────────────────────────
@app.get('/feedback/analytics')
def analytics(db: Session = Depends(get_db)):
    return {
        'strategy_performance': get_strategy_stats(db),
        'overall':              get_overall_stats(db),
    }


# ── ENDPOINT 4: Get All Feedback (admin) ─────────────────────────
@app.get('/feedback/all')
def all_feedback(db: Session = Depends(get_db)):
    return get_all_feedback(db)


@app.get('/')
def health():
    return {'status': 'Feedback service is running!'}
