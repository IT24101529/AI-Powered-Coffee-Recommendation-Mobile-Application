import json
from database import SessionLocal, create_tables, ContextRule

# Each tuple: (weather_condition, temp_tag, time_of_day, recommended_type, weight_dict, confidence)
RULES = [
    # ── HOT WEATHER RULES ────────────────────────────────────────
    ('Any',    'Hot',  'Morning',   'Refreshing iced drinks, cold brew',
        {'warmth': 0.1, 'caffeine': 0.7, 'iced': 0.9, 'sweetness': 0.5}, 0.90),

    ('Sunny',  'Hot',  'Afternoon', 'Iced drinks, cold refreshing options',
        {'warmth': 0.1, 'caffeine': 0.4, 'iced': 0.95, 'sweetness': 0.6}, 0.92),

    ('Sunny',  'Hot',  'Evening',   'Light iced coffees, cold brew',
        {'warmth': 0.2, 'caffeine': 0.3, 'iced': 0.8, 'sweetness': 0.5}, 0.85),

    ('Any',    'Hot',  'Night',     'Decaf iced options, herbal cold drinks',
        {'warmth': 0.1, 'caffeine': 0.1, 'iced': 0.8, 'sweetness': 0.4}, 0.80),

    # ── WARM WEATHER RULES ───────────────────────────────────────
    ('Sunny',  'Warm', 'Morning',   'Balanced options, latte or americano',
        {'warmth': 0.5, 'caffeine': 0.6, 'iced': 0.3, 'sweetness': 0.4}, 0.80),

    ('Cloudy', 'Warm', 'Afternoon', 'Mild options, cappuccino or latte',
        {'warmth': 0.5, 'caffeine': 0.5, 'iced': 0.3, 'sweetness': 0.5}, 0.75),

    ('Any',    'Warm', 'Evening',   'Light warm drinks, vanilla latte',
        {'warmth': 0.6, 'caffeine': 0.3, 'iced': 0.2, 'sweetness': 0.6}, 0.78),

    # ── COOL WEATHER RULES ───────────────────────────────────────
    ('Rainy',  'Cool', 'Morning',   'Comfort drinks, warm lattes',
        {'warmth': 0.9, 'caffeine': 0.6, 'iced': 0.0, 'rainy': 0.8}, 0.95),

    ('Cloudy', 'Cool', 'Morning',   'Hot espresso-based, warm and rich',
        {'warmth': 0.8, 'caffeine': 0.7, 'iced': 0.0, 'richness': 0.7}, 0.88),

    ('Rainy',  'Cool', 'Afternoon', 'Cosy warm drinks, mocha or chai latte',
        {'warmth': 0.8, 'caffeine': 0.5, 'iced': 0.0, 'sweetness': 0.7, 'rainy': 0.7}, 0.90),

    ('Cloudy', 'Cool', 'Evening',   'Calming warm drinks, lavender latte or chai',
        {'warmth': 0.8, 'caffeine': 0.3, 'iced': 0.0, 'sweetness': 0.6}, 0.85),

    ('Any',    'Cool', 'Night',     'Decaf warm drinks, herbal teas',
        {'warmth': 0.9, 'caffeine': 0.0, 'iced': 0.0, 'sweetness': 0.5}, 0.88),

    # ── COLD WEATHER RULES ───────────────────────────────────────
    ('Stormy', 'Cold', 'Morning',   'Very warm, rich, high-caffeine drinks',
        {'warmth': 1.0, 'caffeine': 0.8, 'iced': 0.0, 'richness': 0.9}, 0.95),

    ('Rainy',  'Cold', 'Morning',   'Rich warm drinks, double espresso or mocha',
        {'warmth': 1.0, 'caffeine': 0.7, 'iced': 0.0, 'richness': 0.9, 'rainy': 0.8}, 0.93),

    ('Any',    'Cold', 'Afternoon', 'Rich hot drinks, hot chocolate or flat white',
        {'warmth': 1.0, 'caffeine': 0.6, 'iced': 0.0, 'richness': 0.8}, 0.90),

    ('Stormy', 'Cold', 'Evening',   'Very comforting — hot chocolate, warm milk latte',
        {'warmth': 1.0, 'caffeine': 0.2, 'iced': 0.0, 'sweetness': 0.7, 'richness': 0.8}, 0.92),

    ('Any',    'Cold', 'Night',     'Soothing decaf — chamomile, warm decaf latte',
        {'warmth': 1.0, 'caffeine': 0.0, 'iced': 0.0, 'sweetness': 0.5}, 0.88),

    # ── LATE NIGHT (any weather) ──────────────────────────────────
    ('Any',    'Any',  'Late Night', 'Decaf only — herbal teas, decaf flat white',
        {'warmth': 0.7, 'caffeine': 0.0, 'iced': 0.1, 'sweetness': 0.4}, 0.95),
]

def seed_rules():
    create_tables()
    db = SessionLocal()
    try:
        existing = db.query(ContextRule).count()
        if existing >= len(RULES):
            print(f'{existing} rules already exist. Skipping seed.')
            return

        for rule in RULES:
            weather, temp, time, rec_type, weights, confidence = rule
            db.add(ContextRule(
                weather_condition = weather,
                temp_tag          = temp,
                time_of_day       = time,
                recommended_type  = rec_type,
                weight_json       = json.dumps(weights),
                confidence_score  = confidence,
            ))

        db.commit()
        print(f'Successfully seeded {len(RULES)} context rules!')
    finally:
        db.close()

if __name__ == '__main__':
    seed_rules()