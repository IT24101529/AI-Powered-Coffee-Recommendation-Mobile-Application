"""
Comprehensive Data Seeder for Ember Coffee Co.
Syncs Products, Categories, Users, and Preferences from JSON files into PostgreSQL.
"""
import json
import os
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import SessionLocal, create_tables, CoffeeProduct, Category, User, UserPreference, engine


def calculate_feature_vector(category, price):
    """Algorithmically generates AI feature vectors based on categories."""
    vectors = {
        'sweetness': 5, 'bitterness': 5, 'acidity': 5,
        'richness': 5, 'caffeine': 5, 'caffeine_level': 5, 'warmth': 5,
        'calories': 180, 'temperature': 'Hot',
        'fat_content': 5.0, 'sugar_content': 10.0,
        'best_moods': 'Normal', 'best_weather': 'Any', 'best_times': 'Any'
    }

    if category == "Espresso":
        vectors.update({
            'caffeine': 9, 'caffeine_level': 9, 'bitterness': 8, 'sweetness': 1,
            'warmth': 9, 'temperature': 'Hot', 'best_moods': 'Tired,Stressed',
            'fat_content': 0.5, 'sugar_content': 2.0, 'calories': 15
        })
    elif category in ("Iced Drinks", "Cold Brew"):
        vectors.update({
            'warmth': 1, 'caffeine': 7, 'caffeine_level': 7,
            'temperature': 'Iced', 'best_weather': 'Hot,Sunny',
            'fat_content': 3.0, 'sugar_content': 18.0, 'calories': 180
        })
    elif category in ("Pastries", "Food"):
        vectors.update({
            'caffeine': 0, 'caffeine_level': 0, 'sweetness': 7, 'richness': 8,
            'temperature': 'Warm', 'calories': 400,
            'fat_content': 15.0, 'sugar_content': 25.0
        })
    elif category == "Tea":
        vectors.update({
            'caffeine': 3, 'caffeine_level': 3, 'warmth': 8,
            'temperature': 'Hot', 'best_moods': 'Stressed,Anxious',
            'fat_content': 0.2, 'sugar_content': 8.0, 'calories': 80
        })
    elif category == "Signature Brews":
        vectors.update({
            'caffeine': 7, 'caffeine_level': 7, 'sweetness': 6, 'richness': 8,
            'warmth': 7, 'temperature': 'Hot', 'best_moods': 'Happy,Excited',
            'fat_content': 5.0, 'sugar_content': 15.0, 'calories': 250
        })
    elif category == "Blended":
        vectors.update({
            'sweetness': 9, 'warmth': 1, 'calories': 450,
            'temperature': 'Blended', 'best_moods': 'Happy,Excited',
            'fat_content': 8.0, 'sugar_content': 35.0,
            'caffeine': 5, 'caffeine_level': 5
        })
    return vectors


def _parse_mongodb_date(date_val):
    if not date_val:
        return datetime.utcnow()
    if isinstance(date_val, dict) and '$date' in date_val:
        dt_str = date_val['$date']
        if isinstance(dt_str, str):
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        elif isinstance(dt_str, (int, float)):
            return datetime.fromtimestamp(dt_str / 1000.0)
    return datetime.utcnow()


def seed_categories(db: Session, category_names: set):
    cat_map = {}
    for name in category_names:
        existing = db.query(Category).filter_by(category_name=name).first()
        if existing:
            cat_map[name] = existing.category_id
        else:
            cat = Category(category_name=name)
            db.add(cat)
            db.flush()
            cat_map[name] = cat.category_id
    return cat_map


def perform_seeding(products_path, users_path):
    print("Starting comprehensive seeding process...")
    
    # ── 1. Wipe Existing Tables ──────────────────────────────────
    try:
        with engine.connect() as conn:
            print("Dropping tables with CASCADE to reset schema...")
            tables = [
                'recommendation_history', 'user_preferences', 
                'users', 'products', 'categories'
            ]
            for table in tables:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
            conn.commit()
    except Exception as e:
        print(f"Cleanup error (ignoring): {e}")

    # ── 2. Create Tables Fresh ───────────────────────────────────
    create_tables()
    db: Session = SessionLocal()

    try:
        # ── 3. Seed Products ──────────────────────────────────────
        if os.path.exists(products_path):
            print(f"Seeding products from {products_path}...")
            with open(products_path, 'r') as f:
                p_data = json.load(f)
            
            cat_map = seed_categories(db, {p.get('category', 'Custom') for p in p_data})
            
            for p in p_data:
                _id = p.get('_id', '')
                m_id = _id['$oid'] if isinstance(_id, dict) and '$oid' in _id else str(_id)
                cat = p.get('category', 'Custom')
                v = calculate_feature_vector(cat, p.get('price', 0))
                
                db.add(CoffeeProduct(
                    id=m_id, category_id=cat_map.get(cat), name=p.get('productName', 'Unknown'),
                    category=cat, price=float(p.get('price', 0.0)), description=p.get('description', ''),
                    image_url=p.get('productImageUrl', p.get('imageUrl', '')),
                    sweetness=v['sweetness'], bitterness=v['bitterness'], acidity=v['acidity'],
                    richness=v['richness'], caffeine_level=v['caffeine_level'], caffeine=v['caffeine'],
                    warmth=v['warmth'], calories=v['calories'], fat_content=v['fat_content'],
                    sugar_content=v['sugar_content'], temperature=v['temperature'],
                    best_moods=v['best_moods'], best_weather=v['best_weather'], best_times=v['best_times'],
                    feature_vector=json.dumps({k: v[k] for k in ['sweetness', 'bitterness', 'acidity', 'richness', 'caffeine_level', 'warmth', 'calories', 'fat_content', 'sugar_content']})
                ))
            db.commit()
            print(f"Seeded {len(p_data)} products.")

        # ── 4. Seed Users and Preferences ─────────────────────────
        if os.path.exists(users_path):
            print(f"Seeding users from {users_path}...")
            with open(users_path, 'r') as f:
                u_data = json.load(f)
            
            for u in u_data:
                _id = u.get('_id', '')
                m_id = _id['$oid'] if isinstance(_id, dict) and '$oid' in _id else str(_id)
                
                user = User(
                    user_id=m_id, name=u.get('name', 'Unknown'), email=u.get('email', ''),
                    password=u.get('passwordHash', 'no-pass'), role=u.get('role', 'customer'),
                    profile_image_url=u.get('profileImageUrl', ''), total_points=u.get('totalPoints', 0),
                    created_at=_parse_mongodb_date(u.get('createdAt')),
                    updated_at=_parse_mongodb_date(u.get('updatedAt')),
                    password_reset_expires=_parse_mongodb_date(u.get('passwordResetExpires')) if 'passwordResetExpires' in u else None,
                    password_reset_otp=u.get('passwordResetOtp')
                )
                db.add(user)
                db.flush()
                
                db.add(UserPreference(
                    user_id=m_id, sweetness=5.0, bitterness=5.0, acidity=5.0,
                    richness=5.0, caffeine_level=5.0, temperature='Hot'
                ))
            db.commit()
            print(f"Seeded {len(u_data)} users with default preferences.")

    except Exception as e:
        db.rollback()
        print(f"Critical error during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("Seeding process finalized.")


if __name__ == "__main__":
    products_file = os.path.join("..", "..", "products.json")
    users_file = os.path.join("..", "..", "users.json")
    perform_seeding(products_file, users_file)