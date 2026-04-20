"""
Database models for the Content-Based Filtering (Product) Service.
Tables: categories, products, users, user_preferences, recommendation_history
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

# Read database URL from .env file
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:Admin@localhost:5432/coffee_db')

engine       = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


# ── TABLE 1: Categories ─────────────────────────────────────────
class Category(Base):
    __tablename__ = 'categories'

    category_id   = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(50), unique=True, nullable=False)

    # Relationships
    products = relationship('CoffeeProduct', back_populates='category_rel')


# ── TABLE 2: Coffee Products ────────────────────────────────────
# This class defines all the columns in the 'products' table.
# SQLAlchemy will create the table in PostgreSQL from this class.
class CoffeeProduct(Base):
    __tablename__ = 'products'

    id          = Column(String, primary_key=True, index=True)

    # Foreign key to categories table
    category_id = Column(Integer, ForeignKey('categories.category_id'), nullable=True)

    # Basic info
    name        = Column(String, unique=True, nullable=False)  # e.g. 'Caramel Macchiato'
    category    = Column(String)                               # e.g. 'Latte', 'Espresso' (denormalized for speed)
    price       = Column(Float)                                # e.g. 1450.0 (Rs.)
    description = Column(Text)                                 # Human-readable description
    image_url   = Column(String, nullable=True)

    # Taste feature vector (0.0 to 10.0)
    sweetness      = Column(Float, default=5.0)   # How sweet
    bitterness     = Column(Float, default=5.0)   # How bitter
    acidity        = Column(Float, default=5.0)   # How acidic/sharp
    richness       = Column(Float, default=5.0)   # Body / fullness
    caffeine_level = Column(Float, default=5.0)   # Caffeine strength (0=none, 10=very high)
    caffeine       = Column(Float, default=5.0)   # Legacy alias — kept for backward compat
    warmth         = Column(Float, default=5.0)   # Temperature feel (0=iced, 10=very hot)

    # Properties
    calories       = Column(Float, default=100.0)
    fat_content    = Column(Float, default=0.0)       # Fat in grams
    sugar_content  = Column(Float, default=0.0)       # Sugar in grams
    temperature    = Column(String, default='Hot')    # 'Hot', 'Iced', 'Blended'

    # Context suitability tags (comma-separated strings for simplicity)
    best_moods     = Column(String, default='Calm,Happy')       # e.g. 'Tired,Stressed'
    best_weather   = Column(String, default='Warm')             # e.g. 'Cold,Rainy'
    best_times     = Column(String, default='Morning,Afternoon')

    # Popularity (updated by Ishaak's trending module)
    popularity_score = Column(Float, default=5.0)

    # AI feature vector (JSON string of numeric features for content-based filtering)
    feature_vector = Column(Text, nullable=True)

    # Relationships
    category_rel  = relationship('Category', back_populates='products')
    recommendations = relationship('RecommendationHistory', back_populates='product')


# ── TABLE 3: Users ───────────────────────────────────────────────
class User(Base):
    __tablename__ = 'users'

    user_id           = Column(String(64), primary_key=True, index=True)
    name              = Column(String(100), nullable=False)
    email             = Column(String(150), unique=True, nullable=False)
    password          = Column(String(255), nullable=False)   # Stores passwordHash
    role              = Column(String(20), default='customer')
    profile_image_url = Column(String(255), nullable=True)
    total_points           = Column(Integer, default=0)
    created_at             = Column(DateTime, default=datetime.utcnow)
    updated_at             = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    password_reset_expires = Column(DateTime, nullable=True)
    password_reset_otp     = Column(String(255), nullable=True)
    preference_id          = Column(Integer, ForeignKey('user_preferences.preference_id'), nullable=True)

    # Relationships
    preferences     = relationship('UserPreference', back_populates='user', uselist=False, foreign_keys=[preference_id])
    recommendations = relationship('RecommendationHistory', back_populates='user')


# ── TABLE 4: User Preferences ───────────────────────────────────
# Stores each user's taste profile for content-based filtering.
class UserPreference(Base):
    __tablename__ = 'user_preferences'

    preference_id  = Column(Integer, primary_key=True, autoincrement=True)
    user_id        = Column(String(64), ForeignKey('users.user_id'), nullable=False, index=True)
    sweetness      = Column(Float, default=5.0)
    bitterness     = Column(Float, default=5.0)
    acidity        = Column(Float, default=5.0)
    richness       = Column(Float, default=5.0)
    caffeine_level = Column(Float, default=5.0)
    temperature    = Column(String(10), default='Hot')

    # Relationships
    user = relationship('User', back_populates='preferences', foreign_keys='User.preference_id')


# ── TABLE 5: Recommendation History ─────────────────────────────
# Tracks every recommendation made to each user (for feedback loop / reranking).
class RecommendationHistory(Base):
    __tablename__ = 'recommendation_history'

    recommendation_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id           = Column(String(64), ForeignKey('users.user_id'), nullable=True, index=True)
    product_id        = Column(String, ForeignKey('products.id'), nullable=False, index=True)
    recommended_at    = Column(DateTime, default=datetime.utcnow)
    score             = Column(Float, nullable=True)  # Similarity/relevance score

    # Relationships
    user    = relationship('User', back_populates='recommendations')
    product = relationship('CoffeeProduct', back_populates='recommendations')


# ── Helper Functions ─────────────────────────────────────────────
def create_tables():
    '''Creates all tables in the database. Run once.'''
    Base.metadata.create_all(bind=engine)
    print('Database tables created successfully!')

def get_db():
    '''Provides a database session. Used in FastAPI route functions.'''
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
