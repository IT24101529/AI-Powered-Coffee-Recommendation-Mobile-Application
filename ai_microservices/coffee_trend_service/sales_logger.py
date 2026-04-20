from database import SaleRecord
from datetime import datetime, timedelta
from sqlalchemy import func

def log_sale(db, data: dict) -> int:
    '''
    Saves one sale record to the database.
    Called by main.py every time /sales/log is hit.
    '''
    record = SaleRecord(
        session_id   = data['session_id'],
        product_name = data['product_name'],
        category     = data.get('category'),
        price        = data.get('price'),
        time_of_day  = data.get('time_of_day'),
        weather      = data.get('weather'),
        user_mood    = data.get('user_mood'),
        timestamp    = datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    print(f'[Sales] Logged: {record.product_name} at {record.timestamp}')
    return record.id


def count_sales_in_window(db, product_name: str, hours: int) -> int:
    '''
    Counts how many times a product was ordered in the last N hours.
    Used by the trend engine to calculate sales_24h, sales_7d, sales_30d.
    '''
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    return db.query(SaleRecord).filter(
        SaleRecord.product_name == product_name,
        SaleRecord.timestamp >= cutoff
    ).count()


def get_all_product_names(db) -> list:
    '''Returns a list of all unique product names that have been ordered.'''
    results = db.query(SaleRecord.product_name).distinct().all()
    return [r[0] for r in results]


def get_recent_sales(db, limit: int = 50) -> list:
    '''Returns the most recent sale records (for the admin view).'''
    records = db.query(SaleRecord).order_by(SaleRecord.timestamp.desc()).limit(limit).all()
    return [
        {
            'id':           r.id,
            'product_name': r.product_name,
            'session_id':   r.session_id,
            'timestamp':    r.timestamp.isoformat(),
            'time_of_day':  r.time_of_day,
            'weather':      r.weather,
        }
        for r in records
    ]


def get_sessions_with_products(db) -> dict:
    '''
    Returns a dictionary mapping each session to the list of products ordered.
    Used by the Apriori algorithm in association_rules.py.
    
    Example output:
    {
        'session_abc': ['Espresso', 'Blueberry Muffin'],
        'session_xyz': ['Latte', 'Croissant', 'Orange Juice'],
    }
    '''
    records = db.query(SaleRecord).all()
    sessions = {}
    for r in records:
        if r.session_id not in sessions:
            sessions[r.session_id] = []
        if r.product_name not in sessions[r.session_id]:  # Avoid duplicates
            sessions[r.session_id].append(r.product_name)
    return sessions
