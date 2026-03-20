# main.py
# FastAPI server for the Coffee Product Matching Service.
# Runs on port 8003.
# Owner: Ekanayake E.M.T.D.B. | IT24100917

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db, create_tables, CoffeeProduct
from matcher import find_best_matches
from vector_builder import build_need_vector

app = FastAPI(
    title='Coffee Product Matcher — Feature 4',
    description=(
        'Recommends coffee products using cosine-similarity matching '
        'based on user mood, weather context, and preferences. '
        'Owner: Ekanayake E.M.T.D.B. | IT24100917'
    ),
    version='1.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def startup():
    create_tables()


# ── REQUEST / RESPONSE MODELS ───────────────────────────────────

class UserProfile(BaseModel):
    mood:      str   = 'Calm'           # From Bandara's sentiment module
    temp_pref: str   = 'No preference'  # Hot / Iced / No preference
    weather:   str   = 'Warm'           # From Ranasinghe's context module
    time:      str   = 'Afternoon'      # From Ranasinghe's context module
    budget:    Optional[float] = None   # Max price filter (Rs.)
    top_n:     int   = 3                # Number of recommendations


# ── ENDPOINT 1: Main recommendation ────────────────────────────

@app.post('/products/recommend',
          summary='Get top N coffee recommendations for a user profile')
def recommend(profile: UserProfile, db: Session = Depends(get_db)):
    need_vector = build_need_vector(profile.dict())

    products = db.query(CoffeeProduct).all()

    # Optional budget filter
    if profile.budget:
        products = [p for p in products if p.price <= profile.budget]

    # Optional temperature preference filter
    if profile.temp_pref in ('Hot', 'Iced', 'Blended'):
        products = [p for p in products if p.temperature == profile.temp_pref]

    if not products:
        raise HTTPException(status_code=404, detail='No products match the given filters.')

    matches = find_best_matches(need_vector, products,
                                top_n=profile.top_n, profile=profile.dict())

    return {
        'user_profile':    profile.dict(),
        'need_vector':     need_vector,
        'recommendations': matches,
    }


# ── ENDPOINT 2: List all products ──────────────────────────────

@app.get('/products',
         summary='List all coffee products in the catalogue')
def list_products(db: Session = Depends(get_db)):
    products = db.query(CoffeeProduct).all()
    return {
        'count': len(products),
        'products': [
            {
                'id':          p.id,
                'name':        p.name,
                'category':    p.category,
                'price':       p.price,
                'temperature': p.temperature,
                'description': p.description,
            }
            for p in products
        ],
    }


# ── ENDPOINT 3: Single product ──────────────────────────────────

@app.get('/products/{product_id}',
         summary='Get details for a single product')
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(CoffeeProduct).filter(CoffeeProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail='Product not found.')
    return product


# ── ENDPOINT 4: Similar products ───────────────────────────────

@app.get('/products/similar/{product_id}',
         summary='Get 3 products most similar to a given product')
def similar_products(product_id: int, db: Session = Depends(get_db)):
    target = db.query(CoffeeProduct).filter(CoffeeProduct.id == product_id).first()
    if not target:
        raise HTTPException(status_code=404, detail='Product not found.')

    need_vector = {
        'caffeine':   target.caffeine,
        'warmth':     target.warmth,
        'sweetness':  target.sweetness,
        'bitterness': target.bitterness,
        'richness':   target.richness,
        'acidity':    target.acidity,
    }
    all_others = db.query(CoffeeProduct).filter(CoffeeProduct.id != product_id).all()
    matches = find_best_matches(need_vector, all_others, top_n=3)

    return {'similar_to': target.name, 'suggestions': matches}


# ── HEALTH CHECK ────────────────────────────────────────────────

@app.get('/', summary='Health check')
def health():
    return {'status': 'Product matcher service is running!', 'port': 8003}
