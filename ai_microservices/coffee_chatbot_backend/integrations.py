import httpx
import os
from dotenv import load_dotenv

load_dotenv()   # Load URLs from .env file

# Read API URLs from .env file (create this file in your project root)
SENTIMENT_API = os.getenv('SENTIMENT_API', 'http://localhost:8001')
CONTEXT_API   = os.getenv('CONTEXT_API',   'http://localhost:8002')
PRODUCT_API   = os.getenv('PRODUCT_API',   'http://localhost:8003')
<<<<<<< HEAD
FEEDBACK_API  = os.getenv('FEEDBACK_API',  'http://localhost:8005')
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b


def _normalize_temp_pref(temp_pref: str) -> str:
    msg = (temp_pref or '').strip().lower()
    if msg in {'cold', 'iced', 'cool'}:
        return 'Iced'
    if msg in {'hot', 'warm'}:
        return 'Hot'
    return 'No preference'


def _to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_recommendation(payload: dict, preferred_temp: str = None, exclude_names=None, exclude_categories=None) -> dict:
    if not isinstance(payload, dict):
        return _mock_recommendation({})

    exclude_set = {str(x).strip().lower() for x in (exclude_names or []) if x}
    exclude_category_set = {str(x).strip().lower() for x in (exclude_categories or []) if x}

    # Product matcher returns { recommendations: [...] }
    rec = None
    recs = payload.get('recommendations')
    if isinstance(recs, list) and recs:
        for item in recs:
            name = (item.get('product_name') or item.get('name') or '').strip().lower()
            category = (item.get('category') or '').strip().lower()
            if not name or name in exclude_set:
                continue
            if category and category in exclude_category_set:
                continue
            rec = item
            break
        if rec is None:
            # If every candidate hits exclusions, at least avoid exact same product names.
            for item in recs:
                name = (item.get('product_name') or item.get('name') or '').strip().lower()
                if not name or name in exclude_set:
                    continue
                rec = item
                break
        if rec is None:
            rec = recs[0]
    elif isinstance(payload, dict):
        rec = payload

    if not isinstance(rec, dict):
        return _mock_recommendation({})

    name = rec.get('product_name') or rec.get('name') or 'Caramel Latte'
    category = rec.get('category') or 'Specialty'
    temperature = rec.get('temperature') or 'Hot'
<<<<<<< HEAD
    image_url = rec.get('image_url') or rec.get('productImageUrl') or ''
    p_id = rec.get('id') or rec.get('_id') or str(hash(name))
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b

    pref = (preferred_temp or '').strip().lower()
    if pref in {'cold', 'iced', 'cool'}:
        temperature = 'Iced'
    elif pref in {'hot', 'warm'}:
        temperature = 'Hot'
    description = rec.get('description') or 'A balanced recommendation based on your mood and context.'
    reason = rec.get('reason') or 'It matches your current mood and the weather.'

    return {
<<<<<<< HEAD
        'id': p_id,
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        'product_name': name,
        'category': category,
        'price': _to_float(rec.get('price'), 450.0),
        'temperature': temperature,
<<<<<<< HEAD
        'image_url': image_url,
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        'description': description,
        'similarity_score': _to_float(rec.get('similarity_score'), 0.78),
        'reason': reason,
    }


def _normalize_recommendation_candidates(payload: dict, preferred_temp: str = None, exclude_names=None, exclude_categories=None) -> list:
    if not isinstance(payload, dict):
        return []

    recs = payload.get('recommendations')
    if not isinstance(recs, list):
        recs = [payload]

    out = []
    seen_names = set()
    for item in recs:
        normalized = _normalize_recommendation(
            item,
            preferred_temp=preferred_temp,
            exclude_names=exclude_names,
            exclude_categories=exclude_categories,
        )
        name_key = (normalized.get('product_name') or '').strip().lower()
        if not name_key or name_key in seen_names:
            continue
        seen_names.add(name_key)
        out.append(normalized)
    return out

# ── Call Bandara's Sentiment API (Feature 2) ───────────────────
async def get_sentiment(text: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                f'{SENTIMENT_API}/analyze/sentiment',
                json={'text': text}
            )
            return response.json()   # e.g. {'mood': 'Stressed', 'score': 0.8}
    except Exception as e:
        print(f'Sentiment API unavailable: {e}. Using mock.')
        return _mock_sentiment(text)   # Fallback to mock data

def _mock_sentiment(text: str) -> dict:
    # Simple keyword-based mock until Bandara's API is ready
    text = text.lower()
    if any(w in text for w in ['tired', 'exhausted', 'sleepy']):
        return {'mood': 'Tired', 'score': 0.85}
    elif any(w in text for w in ['stressed', 'anxious', 'worried']):
        return {'mood': 'Stressed', 'score': 0.80}
    elif any(w in text for w in ['excited', 'energetic']):
        return {'mood': 'Excited', 'score': 0.88}
    elif any(w in text for w in ['happy', 'great']):
        return {'mood': 'Happy', 'score': 0.90}
    return {'mood': 'Calm', 'score': 0.60}


# ── Call Ranasinghe's Context API (Feature 3) ──────────────────
async def get_context(session_id: str, location: str = None) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            params = {'session_id': session_id}
            if location:
                params['location'] = location
            response = await client.get(f'{CONTEXT_API}/context/all', params=params)
            response.raise_for_status()
            return response.json()   # e.g. {'weather': 'Hot', 'time_of_day': 'Afternoon'}
    except Exception as e:
        print(f'Context API unavailable: {e}. Using mock.')
        return _mock_context()

async def get_weather_context(session_id: str) -> dict:
    """Alias for get_context to match Agentic naming."""
    return await get_context(session_id)

def _mock_context() -> dict:
    from datetime import datetime
    hour = datetime.now().hour
    time_of_day = 'Morning' if hour < 12 else 'Afternoon' if hour < 17 else 'Evening' if hour < 21 else 'Night'
    return {'weather': 'Warm', 'temperature': 26, 'time_of_day': time_of_day, 'conditions': 'Sunny'}


# ── Call Ekanayake's Product Matcher API (Feature 4) ───────────
async def get_recommendation(user_profile: dict) -> dict:
    profile = user_profile if isinstance(user_profile, dict) else {}
    preferred_temp = _normalize_temp_pref(profile.get('temp_pref'))
    payload = dict(profile)
    payload['temp_pref'] = preferred_temp
    payload.setdefault('top_n', 5)

    try:
<<<<<<< HEAD
        print(f"[DEBUG] Calling Product API for recommendation: {payload.get('mood')}, {payload.get('weather')}")
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                f'{PRODUCT_API}/products/recommend',
                json=payload
            )
            response.raise_for_status()
<<<<<<< HEAD
            data = response.json()
            candidates = _normalize_recommendation_candidates(
                data,
=======
            candidates = _normalize_recommendation_candidates(
                response.json(),
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
                preferred_temp=preferred_temp,
                exclude_names=profile.get('exclude_names') if isinstance(profile.get('exclude_names'), list) else [],
                exclude_categories=profile.get('exclude_categories') if isinstance(profile.get('exclude_categories'), list) else [],
            )
            if candidates:
<<<<<<< HEAD
                print(f"[DEBUG] Received {len(candidates)} candidates from Product API.")
                return candidates[0]
            
            print("[WARNING] Product API returned no candidates matching criteria. Using fallback.")
            return _normalize_recommendation({}, preferred_temp=preferred_temp)
    except Exception as e:
        print(f'[ERROR] Product API unavailable or failed: {e}. Using hardcoded mocks.')
=======
                return candidates[0]
            return _normalize_recommendation({}, preferred_temp=preferred_temp)
    except Exception as e:
        print(f'Product API unavailable: {e}. Using mock.')
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        return _mock_recommendation(payload)


async def get_recommendation_candidates(user_profile: dict) -> list:
    profile = user_profile if isinstance(user_profile, dict) else {}
    preferred_temp = _normalize_temp_pref(profile.get('temp_pref'))
    payload = dict(profile)
    payload['temp_pref'] = preferred_temp
    payload.setdefault('top_n', 5)

    try:
<<<<<<< HEAD
        print(f"[DEBUG] Calling Product API for candidates: {payload.get('mood')}")
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                f'{PRODUCT_API}/products/recommend',
                json=payload
            )
            response.raise_for_status()
<<<<<<< HEAD
            data = response.json()
            candidates = _normalize_recommendation_candidates(
                data,
=======
            candidates = _normalize_recommendation_candidates(
                response.json(),
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
                preferred_temp=preferred_temp,
                exclude_names=profile.get('exclude_names') if isinstance(profile.get('exclude_names'), list) else [],
                exclude_categories=profile.get('exclude_categories') if isinstance(profile.get('exclude_categories'), list) else [],
            )
<<<<<<< HEAD
            print(f"[DEBUG] Received {len(candidates)} candidates from Product API.")
            return candidates[:5]
    except Exception as e:
        print(f'[ERROR] Product API candidate lookup failed: {e}. Falling back to mock list.')
=======
            return candidates[:5]
    except Exception as e:
        print(f'Product API candidate list unavailable: {e}. Using mock list.')
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b

    return [_mock_recommendation(payload)]


async def get_product_details(product_name: str) -> dict:
    name = (product_name or '').strip()
    if not name:
        return {}

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(
                f'{PRODUCT_API}/products/name/{name}'
            )
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict) and not payload.get('error'):
                return payload
    except Exception as e:
        print(f'Product detail API unavailable: {e}.')

    return {}


async def get_all_products() -> list:
    """Fetches the full product list for AI menu summarization."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f'{PRODUCT_API}/products')
            response.raise_for_status()
            data = response.json()
            return data.get('products', [])
    except Exception as e:
        print(f'List product API unavailable: {e}.')
    return []

def _mock_recommendation(profile: dict) -> dict:
    mood = str(profile.get('mood', 'Normal')).strip().lower()
    preferred_temp = _normalize_temp_pref(profile.get('temp_pref'))
    weather = str(profile.get('weather', '')).strip().lower()

    exclude_names = {
        str(x).strip().lower()
        for x in (profile.get('exclude_names') or [])
        if x
    }
    exclude_categories = {
        str(x).strip().lower()
        for x in (profile.get('exclude_categories') or [])
        if x
    }

    catalog = {
        'Double Espresso': {
            'category': 'Espresso', 'temperature': 'Hot', 'price': 420.0,
            'reason': 'High caffeine to boost your energy quickly.'
        },
        'Americano': {
            'category': 'Espresso', 'temperature': 'Hot', 'price': 400.0,
            'reason': 'Strong and clean flavor with reliable caffeine lift.'
        },
        'Iced Americano': {
            'category': 'Iced', 'temperature': 'Iced', 'price': 430.0,
            'reason': 'Refreshing caffeine boost for warm weather or cold-drink preference.'
        },
        'Cold Brew': {
            'category': 'Iced', 'temperature': 'Iced', 'price': 460.0,
            'reason': 'Smooth, chilled coffee with steady energy.'
        },
        'Vanilla Lavender Latte': {
            'category': 'Specialty', 'temperature': 'Hot', 'price': 490.0,
            'reason': 'Calming flavor profile for stressful moments.'
        },
        'Cappuccino': {
            'category': 'Specialty', 'temperature': 'Hot', 'price': 450.0,
            'reason': 'A classic, balanced choice for any time of day.'
        },
        'Caramel Macchiato': {
            'category': 'Specialty', 'temperature': 'Hot', 'price': 480.0,
            'reason': 'A sweet, uplifting choice that matches positive moods.'
        },
        'Iced Latte': {
            'category': 'Iced', 'temperature': 'Iced', 'price': 470.0,
            'reason': 'Smooth and cool with a mellow coffee profile.'
        },
        'Mocha Latte': {
            'category': 'Latte', 'temperature': 'Hot', 'price': 500.0,
            'reason': 'Chocolate notes for comfort and mood lift.'
        },
        'Decaf Latte': {
            'category': 'Decaf', 'temperature': 'Hot', 'price': 460.0,
            'reason': 'Comforting and gentle with low caffeine.'
        },
    }

    mood_candidates = {
        'tired': ['Double Espresso', 'Americano', 'Iced Americano', 'Cold Brew'],
        'stressed': ['Vanilla Lavender Latte', 'Decaf Latte', 'Cappuccino'],
        'happy': ['Caramel Macchiato', 'Mocha Latte', 'Iced Latte'],
        'excited': ['Iced Americano', 'Cold Brew', 'Caramel Macchiato'],
        'sad': ['Mocha Latte', 'Caramel Macchiato', 'Cappuccino'],
        'calm': ['Cappuccino', 'Iced Latte', 'Americano'],
        'anxious': ['Decaf Latte', 'Vanilla Lavender Latte', 'Cappuccino'],
        'normal': ['Cappuccino', 'Americano', 'Caramel Macchiato'],
    }

    candidates = mood_candidates.get(mood, mood_candidates['normal'])

    # Prefer temperature-compatible candidates when user explicitly chose hot/iced.
    if preferred_temp in {'Hot', 'Iced'}:
        temp_matched = [
            name for name in candidates
            if catalog.get(name, {}).get('temperature') == preferred_temp
        ]
        if temp_matched:
            candidates = temp_matched + [name for name in candidates if name not in temp_matched]

    # Cold/rainy context should favor warm drinks if user did not force iced.
    if preferred_temp == 'No preference' and weather in {'cold', 'rainy'}:
        warm_first = [
            name for name in candidates
            if catalog.get(name, {}).get('temperature') == 'Hot'
        ]
        if warm_first:
            candidates = warm_first + [name for name in candidates if name not in warm_first]

    chosen = None
    for name in candidates:
        meta = catalog.get(name, {})
        if name.strip().lower() in exclude_names:
            continue
        if str(meta.get('category', '')).strip().lower() in exclude_categories:
            continue
        chosen = name
        break

    if chosen is None:
        for name, meta in catalog.items():
            if name.strip().lower() in exclude_names:
                continue
            if str(meta.get('category', '')).strip().lower() in exclude_categories:
                continue
            chosen = name
            break

    if chosen is None:
        chosen = 'Cappuccino'

    meta = catalog[chosen]
    return {
<<<<<<< HEAD
        'id': f"mock-id-{chosen.lower().replace(' ', '-')}",
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        'product_name': chosen,
        'category': meta['category'],
        'price': meta['price'],
        'temperature': meta['temperature'],
<<<<<<< HEAD
        'image_url': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=200&h=200',
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        'description': 'A handcrafted recommendation from BrewBot.',
        'reason': meta['reason'],
        'similarity_score': 0.84,
    }

<<<<<<< HEAD
# ── Call Wijerathna's Feedback API (Feature 6) ──────────────────
async def submit_feedback(session_id: str, product_name: str, accepted: bool, rating: float = None, notes: str = None, mood: str = 'Calm', weather: str = 'Warm', strategy: str = 'hybrid', product_id: str = None) -> dict:
    try:
        payload = {
            'session_id': session_id,
            'product_name': product_name,
            'product_id': product_id,
            'strategy_used': strategy,
            'accepted': accepted,
            'rating': rating,
            'user_mood': mood,
            'weather_context': weather,
            'notes': notes
        }
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                f'{FEEDBACK_API}/feedback/submit',
                json=payload
            )
            return response.json()
    except Exception as e:
        print(f'Feedback API unavailable: {e}.')
        return {'success': False, 'error': str(e)}

=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
# ── RAG: Semantic Coffee Knowledge Base (Dense Retrieval) ──────
async def get_coffee_knowledge(query: str) -> str:
    """Performs semantic vector search for coffee facts and brewing methods."""
    from semantic_retriever import semantic_search
    return await semantic_search(query)
