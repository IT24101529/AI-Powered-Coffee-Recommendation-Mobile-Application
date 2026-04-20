from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db, create_tables, CoffeeProduct
from matcher import find_best_matches
from vector_builder import build_need_vector

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
        {'id': p.id, 'name': p.name, 'category': p.category, 'price': p.price}
        for p in products
    ]}


# ── GET SINGLE PRODUCT ───────────────────────────────────────────
@app.get('/products/{product_id}')
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(CoffeeProduct).filter(CoffeeProduct.id == product_id).first()
    if not product:
        return {'error': 'Product not found'}
    return product


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
        return {'error': 'Product not found'}

    return {
        'id': product.id,
        'name': product.name,
        'category': product.category,
        'price': product.price,
        'description': product.description,
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
