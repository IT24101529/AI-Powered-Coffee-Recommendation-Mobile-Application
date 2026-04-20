"""
Database models for the Chatbot Core and Intent Handler service.
Tables: chatbot_sessions, intents, user_queries, responses, context_variables
"""
import os
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey
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
# Stores each chatbot conversation session with its current state.
class ChatbotSession(Base):
    __tablename__ = 'chatbot_sessions'

    session_id          = Column(String(64), primary_key=True, index=True)
    state               = Column(String(20), default='IDLE')        # IDLE, GATHERING, CONFIRM, DONE
    step                = Column(String(30), nullable=True)         # ask_mood, ask_temp, ask_health, etc.
    mood                = Column(String(20), nullable=True)         # Detected mood
    temp_pref           = Column(String(20), nullable=True)         # Hot / Cold / No preference
    last_recommendation = Column(Text, nullable=True)               # JSON of last recommended product
    created_at          = Column(DateTime, default=datetime.utcnow)

    # Relationships
    queries             = relationship('UserQuery', back_populates='session')
    context_variables   = relationship('ContextVariable', back_populates='session')


# ── TABLE 2: Intents ─────────────────────────────────────────────
# Lookup table for all recognized intent types.
class Intent(Base):
    __tablename__ = 'intents'

    intent_id   = Column(Integer, primary_key=True, autoincrement=True)
    intent_name = Column(String(50), unique=True, nullable=False)   # e.g. 'Greeting', 'Suggest'
    intent_type = Column(String(30), nullable=True)                 # e.g. 'action', 'query'
    description = Column(Text, nullable=True)

    # Relationships
    queries     = relationship('UserQuery', back_populates='intent')
    responses   = relationship('Response', back_populates='intent')


# ── TABLE 3: User Queries ────────────────────────────────────────
# Logs every message the user sends and its classified intent.
class UserQuery(Base):
    __tablename__ = 'user_queries'

    query_id   = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey('chatbot_sessions.session_id'), nullable=False, index=True)
    user_input = Column(Text, nullable=False)
    intent_id  = Column(Integer, ForeignKey('intents.intent_id'), nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session    = relationship('ChatbotSession', back_populates='queries')
    intent     = relationship('Intent', back_populates='queries')


# ── TABLE 4: Responses ───────────────────────────────────────────
# Template or generated responses associated with each intent.
class Response(Base):
    __tablename__ = 'responses'

    response_id   = Column(Integer, primary_key=True, autoincrement=True)
    intent_id     = Column(Integer, ForeignKey('intents.intent_id'), nullable=False)
    response_text = Column(Text, nullable=False)
    response_type = Column(String(30), nullable=True)  # e.g. 'template', 'generated', 'fallback'

    # Relationships
    intent        = relationship('Intent', back_populates='responses')


# ── TABLE 5: Context Variables ───────────────────────────────────
# Key-value store for arbitrary session context (e.g. sugar_pref, caffeine_pref).
class ContextVariable(Base):
    __tablename__ = 'context_variables'

    context_id     = Column(Integer, primary_key=True, autoincrement=True)
    session_id     = Column(String(64), ForeignKey('chatbot_sessions.session_id'), nullable=False, index=True)
    variable_name  = Column(String(50), nullable=False)
    variable_value = Column(Text, nullable=True)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    session        = relationship('ChatbotSession', back_populates='context_variables')


# ── Helper Functions ─────────────────────────────────────────────
def create_tables():
    """Creates all chatbot tables in PostgreSQL. Safe to call multiple times."""
    Base.metadata.create_all(bind=engine)
    print('[ChatbotDB] All tables created (or already exist).')


def get_db():
    """Provides a database session for FastAPI dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_intents(db):
    """Seeds the intents lookup table with the standard chatbot intents."""
    intent_definitions = [
        ('Greeting',  'action', 'User greets the chatbot'),
        ('Suggest',   'action', 'User asks for a coffee recommendation'),
        ('Order',     'action', 'User wants to place an order'),
        ('Browse',    'query',  'User wants to browse the menu'),
        ('Question',  'query',  'User asks a question about coffee or the menu'),
        ('Feedback',  'action', 'User provides positive feedback'),
        ('Complaint', 'action', 'User provides negative feedback or complaint'),
        ('Goodbye',   'action', 'User ends the conversation'),
        ('Unknown',   'other',  'Unrecognized or unclear intent'),
    ]
    for name, itype, desc in intent_definitions:
        existing = db.query(Intent).filter_by(intent_name=name).first()
        if not existing:
            db.add(Intent(intent_name=name, intent_type=itype, description=desc))
    db.commit()
    print('[ChatbotDB] Intents seeded.')


if __name__ == '__main__':
    create_tables()
    db = SessionLocal()
    seed_intents(db)
    db.close()
    print('[ChatbotDB] Setup complete!')
