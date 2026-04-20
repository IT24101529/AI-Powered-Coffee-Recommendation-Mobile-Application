"""
Database models for the Feedback and Optimization Loop service.
Tables: feedback_sessions, feedback, strategy_scores
"""
import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:Admin@localhost:5432/coffee_db')

engine       = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


# ── TABLE 1: Feedback Sessions ───────────────────────────────────
# Tracks which user sessions have submitted feedback.
class FeedbackSession(Base):
    __tablename__ = 'feedback_sessions'

    session_id = Column(String(64), primary_key=True, index=True)
    user_id    = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    state      = Column(String(20), default='active')

    # Relationships
    feedback_records = relationship('FeedbackRecord', back_populates='session')


# ── TABLE 2: Feedback Records ────────────────────────────────────
# Every time a user rates a recommendation, one row is added here.
class FeedbackRecord(Base):
    __tablename__ = 'feedback_records'

    id              = Column(Integer, primary_key=True, index=True)
    session_id      = Column(String(64), ForeignKey('feedback_sessions.session_id'), nullable=True, index=True)
    user_id         = Column(String(64), nullable=True)         # Which user gave feedback
    product_id      = Column(String, nullable=True)             # FK to product
    product_name    = Column(String)                            # Which coffee was recommended
    strategy_used   = Column(String)                            # Which strategy made this recommendation
    rating          = Column(Float)                             # Explicit: 1-5 stars (nullable if implicit)
    accepted        = Column(Boolean)                           # Implicit: did the user order it? True/False
    user_mood       = Column(String)                            # The user's mood at the time
    weather_context = Column(String)                            # The weather at the time
    timestamp       = Column(DateTime, default=datetime.utcnow)
    notes           = Column(Text, nullable=True)               # Optional text feedback

    # Relationships
    session = relationship('FeedbackSession', back_populates='feedback_records',
                           foreign_keys=[session_id],
                           primaryjoin='FeedbackRecord.session_id == FeedbackSession.session_id')


# ── TABLE 3: Strategy Scores ─────────────────────────────────────
# One row per strategy. Updated after each feedback.
# The bandit algorithm reads these scores to decide which strategy to use.
class StrategyScore(Base):
    __tablename__ = 'strategy_scores'

    id             = Column(Integer, primary_key=True)
    strategy_used  = Column(String, unique=True)   # e.g. 'content_based', 'mood_based'
    total_attempts = Column(Integer, default=0)    # How many times this strategy was used
    total_accepted = Column(Integer, default=0)    # How many times user accepted
    total_rating   = Column(Float,   default=0.0)  # Sum of all star ratings
    success_rate   = Column(Float,   default=0.5)  # Calculated: accepted / attempts
    avg_rating     = Column(Float,   default=3.0)  # Calculated: total_rating / attempts
    last_updated   = Column(DateTime, default=datetime.utcnow)


def create_tables():
    Base.metadata.create_all(bind=engine)
    print('Feedback tables created!')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_strategies(db):
    '''
    Creates the initial strategy score rows if they don't exist.
    All strategies start with equal scores (fair competition).
    '''
    strategies = ['content_based', 'mood_based', 'trending', 'hybrid']
    for name in strategies:
        existing = db.query(StrategyScore).filter_by(strategy_used=name).first()
        if not existing:
            db.add(StrategyScore(strategy_used=name, success_rate=0.5, avg_rating=3.0))
    db.commit()
    print('Strategy scores initialised!')
