from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db, create_tables
from sales_logger import log_sale, get_recent_sales
from trend_engine import calculate_all_trends, get_top_trending, get_product_tier
from association_rules import get_product_pairs, run_apriori
from scheduler import start_scheduler, stop_scheduler

app = FastAPI(title='Coffee Trend Analysis Service', version='1.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

@app.on_event('startup')
def startup():
    create_tables()
    db = next(get_db())
    calculate_all_trends(db)   # Calculate once immediately on startup
    start_scheduler()          # Then recalculate every hour automatically
    print('Trend service started with scheduler!')

# Add a shutdown event to stop the scheduler cleanly:
@app.on_event('shutdown')
def shutdown():
    stop_scheduler()


# ── REQUEST MODEL ────────────────────────────────────────────────
class OrderEvent(BaseModel):
    session_id:   str
    product_name: str
    category:     Optional[str]   = None
    price:        Optional[float] = None
    time_of_day:  Optional[str]   = None
    weather:      Optional[str]   = None
    user_mood:    Optional[str]   = None


# ── ENDPOINT 1: Log a New Sale ───────────────────────────────────
# Called by Wijerathna every time a user completes an order.
@app.post('/sales/log')
def record_sale(order: OrderEvent, db: Session = Depends(get_db)):
    record_id = log_sale(db, order.dict())
    return {'success': True, 'sale_id': record_id, 'message': f'{order.product_name} sale recorded.'}


# ── ENDPOINT 2: Get Popular / Trending Products ──────────────────
# Called when user is undecided or Aaquif's bandit selects 'trending'.
@app.get('/trends/popular')
def popular_products(
    top_n:    int = 5,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    results = get_top_trending(db, top_n=top_n, category=category)
    return {
        'count':    len(results),
        'trending': results
    }


# ── ENDPOINT 3: Get Trending by Tier ────────────────────────────
# Returns products filtered by their tier label.
@app.get('/trends/tier/{tier_name}')
def products_by_tier(tier_name: str, db: Session = Depends(get_db)):
    results = get_product_tier(db, tier_name)
    return {'tier': tier_name, 'products': results}


# ── ENDPOINT 4: Product Pair Associations ────────────────────────
# Called after a user orders a product — returns what others also bought.
@app.get('/trends/pairs')
def product_pairs(
    product: str = Query(..., description='Product name to find pairs for'),
    db: Session = Depends(get_db)
):
    pairs = get_product_pairs(db, product)
    return {'product': product, 'frequently_bought_with': pairs}


# ── ENDPOINT 5: Recalculate Trend Scores (manual trigger) ────────
# Can also be triggered automatically by the scheduler.
@app.post('/trends/recalculate')
def recalculate(db: Session = Depends(get_db)):
    count = calculate_all_trends(db)
    return {'message': f'Trend scores updated for {count} products.'}


# ── ENDPOINT 6: Raw Sales Data (admin) ───────────────────────────
@app.get('/sales/recent')
def recent_sales(limit: int = 50, db: Session = Depends(get_db)):
    return {'sales': get_recent_sales(db, limit)}


@app.get('/')
def health():
    return {'status': 'Trend analysis service is running!'}
