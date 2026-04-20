"""
Database models for the Sentiment and Emotion Analysis service.
Tables: sentiment_sessions, emotion_logs, emotion_keywords, session_mood_summary, recommendation_feedback
"""
import os
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:Admin@localhost:5432/coffee_db')

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── TABLE 1: Sessions ────────────────────────────────────────────
class SentimentSession(Base):
    __tablename__ = 'sentiment_sessions'

    session_id = Column(String(64), primary_key=True, index=True)
    user_id    = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    state      = Column(String(20), default='active')

    # Relationships
    emotion_logs   = relationship('EmotionLog', back_populates='session')
    mood_summaries = relationship('SessionMoodSummary', back_populates='session')


# ── TABLE 2: Emotion Logs ────────────────────────────────────────
# Each row logs one emotion detection event for a user message.
class EmotionLog(Base):
    __tablename__ = 'emotion_logs'

    log_id                  = Column(Integer, primary_key=True, autoincrement=True)
    session_id              = Column(String(64), ForeignKey('sentiment_sessions.session_id'), nullable=False, index=True)
    keyword_id              = Column(Integer, ForeignKey('emotion_keywords.keyword_id'), nullable=True)
    message_text            = Column(Text, nullable=False)
    sentiment_polarity      = Column(String(20), nullable=True)     # Positive / Neutral / Negative
    sentiment_score         = Column(Float, nullable=True)          # VADER compound score
    emotion_label           = Column(String(20), nullable=True)     # Happy, Sad, Tired, etc.
    intensity               = Column(Float, nullable=True)          # 0.0 – 1.0
    detection_method        = Column(String(30), nullable=True)     # keyword, model, hybrid
    keywords_found          = Column(Text, nullable=True)           # JSON list of matched keywords
    tone_style              = Column(String(30), nullable=True)     # gentle, energetic, etc.
    recommendation_strategy = Column(String(30), nullable=True)     # mood_based, content_based, etc.
    created_at              = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship('SentimentSession', back_populates='emotion_logs')
    keyword = relationship('EmotionKeyword', back_populates='logs')


# ── TABLE 3: Emotion Keywords ────────────────────────────────────
# Lookup table of keywords used for keyword-based emotion detection.
class EmotionKeyword(Base):
    __tablename__ = 'emotion_keywords'

    keyword_id = Column(Integer, primary_key=True, autoincrement=True)
    emotion    = Column(String(20), nullable=False)     # e.g. 'Tired', 'Happy'
    keyword    = Column(String(50), nullable=False)     # e.g. 'exhausted', 'wonderful'
    weight     = Column(Float, default=1.0)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    logs = relationship('EmotionLog', back_populates='keyword')


# ── TABLE 4: Session Mood Summary ────────────────────────────────
# Aggregated mood statistics per session, updated after each message.
class SessionMoodSummary(Base):
    __tablename__ = 'session_mood_summary'

    summary_id    = Column(Integer, primary_key=True, autoincrement=True)
    session_id    = Column(String(64), ForeignKey('sentiment_sessions.session_id'), nullable=False, index=True)
    current_mood  = Column(String(20), nullable=True)
    dominant_mood = Column(String(20), nullable=True)
    mood_trend    = Column(String(20), nullable=True)   # improving, worsening, stable
    message_count = Column(Integer, default=0)
    last_score    = Column(Float, nullable=True)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    session = relationship('SentimentSession', back_populates='mood_summaries')


# ── TABLE 5: Recommendation Feedback ─────────────────────────────
# Feedback on recommendations, linked back to the emotion log that triggered them.
class RecommendationFeedback(Base):
    __tablename__ = 'recommendation_feedback'

    feedback_id   = Column(Integer, primary_key=True, autoincrement=True)
    log_id        = Column(Integer, ForeignKey('emotion_logs.log_id'), nullable=True)
    session_id    = Column(String(64), ForeignKey('sentiment_sessions.session_id'), nullable=False, index=True)
    rating        = Column(Float, nullable=True)             # 1-5 stars
    accepted      = Column(Boolean, nullable=True)           # Did user accept the recommendation?
    emotion_was   = Column(String(20), nullable=True)        # Emotion at the time
    strategy_used = Column(String(30), nullable=True)        # Which recommendation strategy
    submitted_at  = Column(DateTime, default=datetime.utcnow)


# ── Helper Functions ─────────────────────────────────────────────
def create_tables():
    """Creates all sentiment tables in PostgreSQL."""
    Base.metadata.create_all(bind=engine)
    print('[SentimentDB] All tables created (or already exist).')


def get_db():
    """Provides a database session for FastAPI dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_emotion_keywords(db):
    """
    Seeds the emotion_keywords table from the existing emotion_keywords.py dictionary.
    Only inserts keywords that don't already exist.
    """
    try:
        from emotion_keywords import EMOTION_KEYWORDS
    except ImportError:
        print('[SentimentDB] Could not import EMOTION_KEYWORDS, skipping seed.')
        return

    count = 0
    for emotion, keywords in EMOTION_KEYWORDS.items():
        if isinstance(keywords, dict):
            # If keywords are {word: weight} format
            for word, weight in keywords.items():
                existing = db.query(EmotionKeyword).filter_by(emotion=emotion, keyword=word).first()
                if not existing:
                    db.add(EmotionKeyword(emotion=emotion, keyword=word, weight=float(weight)))
                    count += 1
        elif isinstance(keywords, (list, set)):
            # If keywords are simple lists
            for word in keywords:
                existing = db.query(EmotionKeyword).filter_by(emotion=emotion, keyword=str(word)).first()
                if not existing:
                    db.add(EmotionKeyword(emotion=emotion, keyword=str(word), weight=1.0))
                    count += 1
    db.commit()
    print(f'[SentimentDB] Seeded {count} new emotion keywords.')


if __name__ == '__main__':
    create_tables()
    db = SessionLocal()
    seed_emotion_keywords(db)
    db.close()
    print('[SentimentDB] Setup complete!')
