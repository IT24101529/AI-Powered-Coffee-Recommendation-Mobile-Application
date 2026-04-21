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
import pymongo
from bson import ObjectId

load_dotenv()

# Read database URL from .env file
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:Admin@localhost:5432/coffee_db')

engine       = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()

# --- MongoDB Integration (Fallback) ---
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/CoffeeDB')
mongo_client = None
mongo_db = None

try:
    mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Extract DB name from URI or default to CoffeeDB
    db_name = MONGO_URI.split('/')[-1] or 'CoffeeDB'
    mongo_db = mongo_client[db_name]
    print(f"Connected to MongoDB: {db_name}")
except Exception as e:
    print(f"MongoDB connection failed: {e}")


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


def get_product_from_mongo(product_id_or_name: str) -> dict:
    """Helper to fetch product from MongoDB as a fallback source."""
    if not mongo_db:
        return None
    
    try:
        col = mongo_db['products']
        
        # Try finding by ID first (both as string and ObjectId)
        query = {}
        if len(product_id_or_name) == 24: # Likely ObjectId
            try:
                query = {'_id': ObjectId(product_id_or_name)}
            except:
                query = {'_id': product_id_or_name}
        else:
            query = {'_id': product_id_or_name}
            
        product = col.find_one(query)
        
        # If not found by ID, try by exact name
        if not product:
            product = col.find_one({'productName': product_id_or_name})
            
        # If still not found, try fuzzy name
        if not product:
            product = col.find_one({'productName': {'$regex': product_id_or_name, '$options': 'i'}})

        if product:
            # Map Mongo schema to API schema
            return {
                'id': str(product.get('_id')),
                'name': product.get('productName', 'Unknown'),
                'category': product.get('category', 'Coffee'),
                'price': float(product.get('price', 450.0)),
                'description': product.get('description', 'Fetched from fallback source.'),
                'image_url': product.get('productImageUrl', product.get('imageUrl', '')),
                'temperature': product.get('temperature', 'Hot'),
                # Add default features if missing (Mongo might not have taste vectors)
                'sweetness': 5.0, 'bitterness': 5.0, 'acidity': 5.0, 'richness': 5.0,
                'caffeine': 5.0, 'calories': 200.0
            }
    except Exception as e:
        print(f"Mongo fallback lookup failed: {e}")
        
    return None
