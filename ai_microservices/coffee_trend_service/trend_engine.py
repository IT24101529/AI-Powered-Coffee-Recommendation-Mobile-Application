from database import SaleRecord, TrendScore
from sales_logger import count_sales_in_window, get_all_product_names
from datetime import datetime
import numpy as np

# Weights for the trend score formula
WEIGHT_RECENT_SALES   = 0.4
WEIGHT_GROWTH_RATE    = 0.2
WEIGHT_RATING         = 0.1
WEIGHT_VELOCITY       = 0.3  # Replaced AR-Forecaster with Velocity Score

# Tier classification thresholds
BESTSELLER_PERCENTILE  = 90   # Top 10% by sales volume = Bestseller
TRENDING_GROWTH_THRESH = 0.30 # 30%+ growth = Trending Up


def calculate_growth_rate(current: int, previous: int) -> float:
    '''
    Calculates how much sales grew compared to the previous period.
    Returns a value between -1.0 (big drop) and 1.0+ (big growth).
    '''
    if previous == 0:
        return 1.0 if current > 0 else 0.0   # New product with sales = max growth
    return (current - previous) / previous


def calculate_velocity_score(sales_24h: int, sales_7d: int) -> float:
    '''
    Calculates sales velocity: how much hotter a product is today
    compared to its daily average over the last week.
    '''
    daily_avg_7d = max(1, sales_7d / 7.0)
    return sales_24h / daily_avg_7d


def normalise(value: float, min_val: float, max_val: float) -> float:
    '''
    Scales a value into the 0.0 to 1.0 range.
    Used to make all inputs to the trend formula comparable.
    '''
    if max_val == min_val:
        return 0.5
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def classify_tier(sales_24h: int, growth_rate: float, all_sales: list) -> str:
    '''
    Assigns a tier label to a product based on its sales and growth.
    '''
    if not all_sales:
        return 'Normal'

    # Calculate the 90th percentile threshold for bestseller
    bestseller_threshold = np.percentile(all_sales, BESTSELLER_PERCENTILE)

    if sales_24h >= bestseller_threshold:
        return 'Bestseller'
    elif growth_rate >= TRENDING_GROWTH_THRESH:
        return 'Trending Up'
    elif sales_24h > 0 and sales_24h < np.percentile(all_sales, 25):
        # Low sales but exists — potential Hidden Gem
        return 'Hidden Gem'
    return 'Normal'


def calculate_all_trends(db) -> int:
    '''
    Recalculates trend scores for every product in the sales log.
    Called on startup and periodically by the scheduler.
    Returns the number of products updated.
    '''
    product_names = get_all_product_names(db)
    if not product_names:
        print('[TrendEngine] No sales data found. Skipping calculation.')
        return 0

    # Collect raw data for all products
    raw_data = []
    for name in product_names:
        sales_24h  = count_sales_in_window(db, name, hours=24)
        sales_48h  = count_sales_in_window(db, name, hours=48)  # Previous 24h period
        sales_7d   = count_sales_in_window(db, name, hours=168)
        sales_30d  = count_sales_in_window(db, name, hours=720)

        # Growth rate: compare last 24h vs the 24h before that
        previous_24h = max(sales_48h - sales_24h, 0)
        growth = calculate_growth_rate(sales_24h, previous_24h)

        raw_data.append({
            'name':       name,
            'sales_24h':  sales_24h,
            'sales_7d':   sales_7d,
            'sales_30d':  sales_30d,
            'growth':     growth,
        })

    # Get min/max values for normalisation
    all_24h_sales = [d['sales_24h'] for d in raw_data]
    max_sales = max(all_24h_sales) if all_24h_sales else 1
    min_sales = min(all_24h_sales) if all_24h_sales else 0

    # Calculate trend score and update database
    for d in raw_data:
        # Velocity Score: Sales today vs weekly daily average
        velocity = calculate_velocity_score(d['sales_24h'], d['sales_7d'])
        
        norm_sales    = normalise(d['sales_24h'], min_sales, max_sales)
        norm_growth   = normalise(d['growth'], -1.0, 1.0)
        norm_velocity = normalise(velocity, 0.0, 3.0) # Assume 3x velocity is "max hot"
        norm_rating   = 0.6   
        
        score = (norm_sales    * WEIGHT_RECENT_SALES +
                 norm_growth   * WEIGHT_GROWTH_RATE  +
                 norm_velocity * WEIGHT_VELOCITY +
                 norm_rating   * WEIGHT_RATING)

        tier = classify_tier(d['sales_24h'], d['growth'], all_24h_sales)

        # Update or create the TrendScore row for this product
        existing = db.query(TrendScore).filter_by(product_name=d['name']).first()
        if existing:
            existing.sales_24h       = d['sales_24h']
            existing.sales_7d        = d['sales_7d']
            existing.sales_30d       = d['sales_30d']
            existing.growth_rate     = round(d['growth'], 4)
            existing.trend_score     = round(score, 4)
            existing.tier            = tier
            existing.last_calculated = datetime.utcnow()
        else:
            db.add(TrendScore(
                product_name    = d['name'],
                sales_24h       = d['sales_24h'],
                sales_7d        = d['sales_7d'],
                sales_30d       = d['sales_30d'],
                growth_rate     = round(d['growth'], 4),
                trend_score     = round(score, 4),
                tier            = tier,
            ))

    db.commit()
    print(f'[TrendEngine] Updated {len(raw_data)} product trend scores.')
    return len(raw_data)


def get_top_trending(db, top_n: int = 5, category: str = None) -> list:
    '''
    Returns the top N trending products, sorted by trend_score descending.
    This is what Wijerathna calls when the user is undecided.
    '''
    query = db.query(TrendScore).order_by(TrendScore.trend_score.desc())
    if category:
        query = query.filter(TrendScore.category == category)
    results = query.limit(top_n).all()

    return [
        {
            'product_name':  r.product_name,
            'trend_score':   round(r.trend_score, 3),
            'sales_today':   r.sales_24h,
            'growth_rate':   f'{r.growth_rate * 100:+.1f}%',
            'tier':          r.tier,
            'social_proof':  f'Ordered {r.sales_24h} times today!',
        }
        for r in results
    ]


def get_product_tier(db, tier_name: str) -> list:
    '''Returns all products in a specific tier.'''
    results = db.query(TrendScore).filter_by(tier=tier_name).order_by(
        TrendScore.trend_score.desc()).all()
    return [
        {'product_name': r.product_name, 'tier': r.tier,
         'sales_today': r.sales_24h, 'trend_score': round(r.trend_score, 3)}
        for r in results
    ]
