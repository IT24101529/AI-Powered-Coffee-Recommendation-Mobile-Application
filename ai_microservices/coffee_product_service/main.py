from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
<<<<<<< HEAD
from database import get_db, create_tables, CoffeeProduct, get_product_from_mongo, RecommendationHistory
from matcher import find_best_matches
from vector_builder import build_need_vector
from datetime import datetime

def record_recommendation(db: Session, product_id: str, session_id: str, score: float):
    """Saves a single recommendation event to the database."""
    try:
        new_history = RecommendationHistory(
            user_id=session_id,  # Use session_id as user identifier for now
            product_id=product_id,
            score=score,
            recommended_at=datetime.utcnow()
        )
        db.add(new_history)
        db.commit()
    except Exception as e:
        print(f"Error recording recommendation history: {e}")
        db.rollback()
=======
from database import get_db, create_tables, CoffeeProduct
from matcher import find_best_matches
from vector_builder import build_need_vector
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b

from product_seeder import perform_seeding
import os

app = FastAPI(title='Coffee Product Matcher', version='1.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

# Create tables and seed data when the server starts
@app.on_event('startup')
def startup():
    products_json = os.path.join("..", "..", "products.json")
    users_json = os.path.join("..", "..", "users.json")
    # Note: perform_seeding will DROP and recreate tables to ensure sync.
    # In a production environment, you'd check if data exists first.
    perform_seeding(products_json, users_json)

# User profile sent by Wijerathna's chatbot
class UserProfile(BaseModel):
    mood:      str = 'Calm'        # From Bandara's sentiment module
    temp_pref: str = 'No preference'  # User's preference: Hot / Iced / No preference
    weather:   str = 'Warm'        # From Ranasinghe's context module
    time:      str = 'Afternoon'   # From Ranasinghe's context module
    budget:    Optional[float] = None  # Optional max price filter
    top_n:     int = 3             # How many recommendations to return
<<<<<<< HEAD
    session_id: Optional[str] = None # Added to prevent AttributeError
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b


# ── MAIN RECOMMENDATION ENDPOINT ────────────────────────────────
# Wijerathna calls this with a user profile and gets back top coffee matches.
@app.post('/products/recommend')
def recommend(profile: UserProfile, db: Session = Depends(get_db)):
    # Build the user need vector from the profile
    need_vector = build_need_vector(profile.dict())

    # Get all products from database
    products = db.query(CoffeeProduct).all()

    # Optional: filter by budget
    if profile.budget:
        products = [p for p in products if p.price <= profile.budget]

    # Optional: filter by temperature preference
    if profile.temp_pref in ['Hot', 'Iced', 'Blended']:
        products = [p for p in products if p.temperature == profile.temp_pref]

    # Run cosine similarity matching
    matches = find_best_matches(need_vector, products, top_n=profile.top_n, profile=profile.dict())

<<<<<<< HEAD
    # Part 3: RECORD HISTORY (Feature 5)
    # We record the top match as the primary recommendation for this session
    if matches:
        top_match = matches[0]
        record_recommendation(
            db=db, 
            product_id=top_match.get('product_id'), 
            session_id=profile.session_id or "anonymous", 
            score=top_match.get('similarity_score')
        )

=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
    return {
        'user_profile':  profile.dict(),
        'need_vector':   need_vector,
        'recommendations': matches
    }


# ── GET ALL PRODUCTS ─────────────────────────────────────────────
@app.get('/products')
def list_products(db: Session = Depends(get_db)):
    products = db.query(CoffeeProduct).all()
    return {'count': len(products), 'products': [
<<<<<<< HEAD
        {'id': p.id, 'name': p.name, 'category': p.category, 'price': p.price, 'image_url': p.image_url}
=======
        {'id': p.id, 'name': p.name, 'category': p.category, 'price': p.price}
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        for p in products
    ]}


# ── GET SINGLE PRODUCT ───────────────────────────────────────────
@app.get('/products/{product_id}')
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(CoffeeProduct).filter(CoffeeProduct.id == product_id).first()
    if not product:
<<<<<<< HEAD
        # PostgreSQL failed/empty, try Mongo fallback
        mongo_p = get_product_from_mongo(product_id)
        if mongo_p:
            return mongo_p
        return {'error': 'Product not found'}
    return {
        'id': product.id,
        'name': product.name,
        'category': product.category,
        'price': product.price,
        'description': product.description,
        'image_url': product.image_url,
        'temperature': product.temperature,
    }
=======
        return {'error': 'Product not found'}
    return product
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b


@app.get('/products/name/{product_name}')
def get_product_by_name(product_name: str, db: Session = Depends(get_db)):
    product_name = (product_name or '').strip()
    if not product_name:
        return {'error': 'Product name is required'}

    product = db.query(CoffeeProduct).filter(
        func.lower(CoffeeProduct.name) == product_name.lower()
    ).first()

    if not product:
        product = db.query(CoffeeProduct).filter(
            CoffeeProduct.name.ilike(f'%{product_name}%')
        ).first()

    if not product:
<<<<<<< HEAD
        # PostgreSQL failed/empty, try Mongo fallback
        mongo_p = get_product_from_mongo(product_name)
        if mongo_p:
            return mongo_p
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        return {'error': 'Product not found'}

    return {
        'id': product.id,
        'name': product.name,
        'category': product.category,
        'price': product.price,
        'description': product.description,
<<<<<<< HEAD
        'image_url': product.image_url,
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        'temperature': product.temperature,
        'sweetness': product.sweetness,
        'bitterness': product.bitterness,
        'acidity': product.acidity,
        'richness': product.richness,
        'caffeine': product.caffeine_level if hasattr(product, 'caffeine_level') else product.caffeine,
        'calories': product.calories,
    }


# ── SIMILAR PRODUCTS ─────────────────────────────────────────────
@app.get('/products/similar/{product_id}')
def similar_products(product_id: str, db: Session = Depends(get_db)):
    target = db.query(CoffeeProduct).filter(CoffeeProduct.id == product_id).first()
    if not target:
        return {'error': 'Product not found'}
    # Use the target product's vector as the 'need vector'
    need_vector = {
        'caffeine': target.caffeine, 'warmth': target.warmth,
        'sweetness': target.sweetness, 'bitterness': target.bitterness,
        'richness': target.richness, 'acidity': target.acidity,
    }
    all_products = db.query(CoffeeProduct).filter(CoffeeProduct.id != product_id).all()
    matches = find_best_matches(need_vector, all_products, top_n=3)
    return {'similar_to': target.name, 'suggestions': matches}


@app.get('/')
def health():
    return {'status': 'Product matcher service is running!'}
