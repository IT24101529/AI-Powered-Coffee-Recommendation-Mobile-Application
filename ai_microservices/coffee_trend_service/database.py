import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/coffee_db')

engine       = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


# ── TABLE 1: Sales Log ───────────────────────────────────────────
# Every order placed adds one row here.
# This is the raw data used by both the trend engine and Apriori.
class SaleRecord(Base):
    __tablename__ = 'sales_log'

    id           = Column(Integer, primary_key=True, index=True)
    session_id   = Column(String, index=True)   # Which conversation made the order
    product_name = Column(String, index=True)   # What was ordered
    category     = Column(String, nullable=True) # e.g. 'Latte', 'Espresso'
    price        = Column(Float,  nullable=True)
    timestamp    = Column(DateTime, default=datetime.utcnow, index=True)
    time_of_day  = Column(String, nullable=True)  # 'Morning', 'Afternoon', 'Evening'
    weather      = Column(String, nullable=True)  # Weather context at time of order
    user_mood    = Column(String, nullable=True)  # Mood at time of order


# ── TABLE 2: Trend Scores ────────────────────────────────────────
# One row per product. Recalculated periodically by the trend engine.
# Wijerathna reads this table (via your API) to get fast trend results.
class TrendScore(Base):
    __tablename__ = 'trend_scores'

    id              = Column(Integer, primary_key=True)
    product_name    = Column(String, unique=True, index=True)
    category        = Column(String, nullable=True)

    # Sales counts across different time windows
    sales_24h       = Column(Integer, default=0)   # Orders in last 24 hours
    sales_7d        = Column(Integer, default=0)   # Orders in last 7 days
    sales_30d       = Column(Integer, default=0)   # Orders in last 30 days

    # Calculated scores
    trend_score     = Column(Float, default=0.0)   # Combined trending score
    growth_rate     = Column(Float, default=0.0)   # % change vs previous period

    # Product tier classification
    tier            = Column(String, default='Normal')
    # Possible values:
    #   'Bestseller'  — top 10% by sales volume
    #   'Trending Up' — growth rate > 30%
    #   'Hidden Gem'  — high satisfaction but low sales
    #   'Normal'      — everything else

    last_calculated = Column(DateTime, default=datetime.utcnow)


def create_tables():
    Base.metadata.create_all(bind=engine)
    print('Trend tables created!')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
