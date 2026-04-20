import random
import csv
import os
from datetime import datetime, timedelta
from collections import Counter
from database import SessionLocal, create_tables, SaleRecord

# ── Product catalogue with realistic popularity weights ──────────
PRODUCTS = [
    ('Espresso',           'Espresso', 200, 12),
    ('Double Espresso',    'Espresso', 280, 8),
    ('Americano',          'Espresso', 250, 10),
    ('Cappuccino',         'Latte',    380, 15),
    ('Latte',              'Latte',    400, 18),
    ('Flat White',         'Latte',    380, 10),
    ('Caramel Macchiato',  'Specialty',480, 20),
    ('Mocha',              'Specialty',450, 14),
    ('Hazelnut Latte',     'Specialty',460, 9),
    ('Vanilla Latte',      'Specialty',440, 11),
    ('Lavender Latte',     'Specialty',480, 6),
    ('Chai Latte',         'Tea',      380, 7),
    ('Matcha Latte',       'Tea',      420, 8),
    ('Hot Chocolate',      'Other',    350, 5),
    ('Iced Americano',     'Iced',     300, 13),
    ('Iced Latte',         'Iced',     420, 16),
    ('Cold Brew',          'Iced',     380, 12),
    ('Iced Caramel Latte', 'Iced',     460, 22),
    ('Iced Mocha',         'Iced',     480, 11),
    ('Caramel Frappuccino','Blended',  520, 9),
    ('Blueberry Muffin',   'Food',     150, 8),
    ('Croissant',          'Food',     200, 10),
    ('Chocolate Cake',     'Food',     250, 6),
]

WEATHERS = ['Hot', 'Warm', 'Cool', 'Cold', 'Rainy']
MOODS    = ['Tired', 'Happy', 'Calm', 'Stressed', 'Excited']

def get_time_of_day(time_str):
    try:
        hour = int(time_str.split(':')[0])
        if 5 <= hour < 12: return 'Morning'
        if 12 <= hour < 17: return 'Afternoon'
        if 17 <= hour < 21: return 'Evening'
        return 'Night'
    except:
        return 'Afternoon'

def generate_sales_from_csv(csv_path: str):
    create_tables()
    db = SessionLocal()

    if db.query(SaleRecord).count() > 100:
        print('Database already has sufficient sales data. Skipping seed.')
        db.close()
        return

    if not os.path.exists(csv_path):
        print(f"Dataset {csv_path} not found. Skipping CSV seed.")
        db.close()
        return

    print("Parsing CSV dataset and mapping products...")
    
    # 1. Parse CSV and group by transaction
    transactions = {}
    product_counter = Counter()

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tid = row.get('transaction_id')
            pid = row.get('product_id')
            t_date = row.get('transaction_date')
            t_time = row.get('transaction_time')
            
            if not tid or not pid or not t_time: continue
            
            if tid not in transactions:
                transactions[tid] = {
                    'time': t_time,
                    'date': t_date,
                    'products': []
                }
            transactions[tid]['products'].append(pid)
            product_counter[pid] += 1

    if not transactions:
        print("No valid data found in CSV.")
        db.close()
        return

    # 2. Map the top CSV products to our Ember products
    top_pids = [pid for pid, _ in product_counter.most_common(len(PRODUCTS))]
    pid_to_ember = {}
    for i, pid in enumerate(top_pids):
        # We sequentially map them; top sellers in CSV become top items in PRODUCTS
        ember_prod = PRODUCTS[i % len(PRODUCTS)]
        pid_to_ember[pid] = {
            'product_name': ember_prod[0],
            'category': ember_prod[1],
            'price': ember_prod[2]
        }

    # 3. Seed into Database
    records_created = 0
    
    for tid, data in transactions.items():
        t_time = data['time']
        t_date = data['date']
        
        try:
            # We map transaction_date to recent days so trend engines pick it up as "recent"
            dt = datetime.strptime(f"{t_date} {t_time}", "%Y-%m-%d %H:%M:%S")
            # Shift 2019 to Current Year for realistic trends
            time_shift = datetime.now() - dt.replace(year=datetime.now().year, month=datetime.now().month - 1)
            mapped_dt = datetime.now() - time_shift
        except Exception:
            mapped_dt = datetime.utcnow() - timedelta(days=random.randint(0, 30))

        tod = get_time_of_day(t_time)
        simulated_weather = random.choice(WEATHERS)
        simulated_mood = random.choice(MOODS)

        mapped_products = set()
        for pid in data['products']:
            if pid in pid_to_ember:
                mapped_products.add(pid)
        
        for pid in mapped_products:
            details = pid_to_ember[pid]
            record = SaleRecord(
                session_id   = f"csv_{tid}",
                product_name = details['product_name'],
                category     = details['category'],
                price        = details['price'],
                timestamp    = mapped_dt,
                time_of_day  = tod,
                weather      = simulated_weather,
                user_mood    = simulated_mood,
            )
            db.add(record)
            records_created += 1

        if records_created > 5000: # Limit to 5000 for fast seeding
            break

    db.commit()
    db.close()
    print(f'Imported {records_created} sale records from CSV!')
    print('Now run: POST /trends/recalculate to calculate trend scores.')

if __name__ == '__main__':
    generate_sales_from_csv(csv_path='../201904 sales reciepts.csv')
