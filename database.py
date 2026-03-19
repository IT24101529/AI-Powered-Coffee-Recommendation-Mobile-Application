import os
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Text, TIMESTAMP, Boolean
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()   # Read variables from .env file

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError('DATABASE_URL is not set in .env file!')

# Create the database engine (the actual connection to PostgreSQL)
engine = create_engine(DATABASE_URL, echo=False)

# SessionLocal is a factory for database sessions
# Each API call gets its own session — opened, used, then closed
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class for all table definitions
Base = declarative_base()

# ── TABLE 1: weather_cache ───────────────────────────────────────
# Stores raw weather API responses.
# Before making an API call, we check if there's a recent entry here.
# If expires_at is in the future, we reuse it (saves API quota).
class WeatherCache(Base):
    __tablename__ = 'weather_cache'

    id                  = Column(Integer, primary_key=True, index=True)
    location            = Column(String(100), nullable=False, index=True)
    temperature_celsius = Column(Float, nullable=False)
    condition           = Column(String(30), nullable=False)
    humidity_percent    = Column(Integer, nullable=True)
    wind_speed_ms       = Column(Float, nullable=True)    # Wind speed in m/s
    raw_description     = Column(String(100), nullable=True)  # e.g. 'light rain'
    fetched_at          = Column(TIMESTAMP, default=datetime.utcnow)
    expires_at          = Column(TIMESTAMP, nullable=False)   # fetched_at + 5 min


# ── TABLE 2: context_logs ───────────────────────────────────────
# Records every context snapshot generated for a session.
# This is the main output table of Feature 3.
# Linked to sessions (Feature 1) and weather_cache by Foreign Keys.
class ContextLog(Base):
    __tablename__ = 'context_logs'

    id               = Column(Integer, primary_key=True, index=True)
    session_id       = Column(String(64), nullable=False, index=True)
    weather_cache_id = Column(Integer, nullable=False)  # FK → weather_cache.id
    temp_tag         = Column(String(10), nullable=False)   # Hot/Warm/Cool/Cold
    condition_tag    = Column(String(15), nullable=False)   # Sunny/Rainy/Cloudy/Stormy
    time_of_day      = Column(String(15), nullable=False)   # Morning/Afternoon/Evening/Night/Late Night
    weight_vector    = Column(Text, nullable=False)         # JSON string of weights
    is_override      = Column(Boolean, default=False)       # True if user manually set context
    created_at       = Column(TIMESTAMP, default=datetime.utcnow)


# ── TABLE 3: context_rules ──────────────────────────────────────
# The rule engine knowledge base.
# Each row is one if-then rule: if (weather=X AND temp=Y AND time=Z) then use these weights.
# Seeded by rules_seeder.py in Step 4.
class ContextRule(Base):
    __tablename__ = 'context_rules'

    id               = Column(Integer, primary_key=True, index=True)
    weather_condition = Column(String(15), nullable=False)  # Sunny/Rainy/Cloudy/Stormy/Any
    temp_tag         = Column(String(10), nullable=False)   # Hot/Warm/Cool/Cold/Any
    time_of_day      = Column(String(15), nullable=False)   # Morning/Afternoon/Evening/Night/Any
    recommended_type = Column(String(60), nullable=False)   # e.g. 'Comfort drinks, warm lattes'
    weight_json      = Column(Text, nullable=False)         # JSON weight vector string
    confidence_score = Column(Float, nullable=False, default=0.8)


# ── Helper Functions ────────────────────────────────────────────
def create_tables():
    '''Creates all 3 tables in PostgreSQL. Safe to run multiple times.'''
    Base.metadata.create_all(bind=engine)
    print('All Feature 3 tables created (or already exist).')

def get_db():
    '''Provides a database session for use in FastAPI route functions.'''
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Test this file directly ─────────────────────────────────────
if __name__ == '__main__':
    create_tables()
    print('Database setup complete!')