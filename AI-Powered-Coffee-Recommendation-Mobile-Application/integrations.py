# integrations.py
# This file calls your teammates' APIs.
# If their service is not ready yet, the mock functions return fake data
# so you can keep working independently.

import httpx
import os
from dotenv import load_dotenv

load_dotenv()   # Load URLs from .env file

# Read API URLs from .env file (create this file in your project root)
SENTIMENT_API = os.getenv('SENTIMENT_API', 'http://localhost:8001')
CONTEXT_API   = os.getenv('CONTEXT_API',   'http://localhost:8002')
PRODUCT_API   = os.getenv('PRODUCT_API',   'http://localhost:8003')

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
    elif any(w in text for w in ['happy', 'great', 'excited', 'energetic']):
        return {'mood': 'Happy', 'score': 0.90}
    return {'mood': 'Normal', 'score': 0.60}


# ── Call Ranasinghe's Context API (Feature 3) ──────────────────
async def get_context() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f'{CONTEXT_API}/context/all')
            return response.json()   # e.g. {'weather': 'Hot', 'time_of_day': 'Afternoon'}
    except Exception as e:
        print(f'Context API unavailable: {e}. Using mock.')
        return _mock_context()

def _mock_context() -> dict:
    from datetime import datetime
    hour = datetime.now().hour
    time_of_day = 'Morning' if hour < 12 else 'Afternoon' if hour < 17 else 'Evening' if hour < 21 else 'Night'
    return {'weather': 'Warm', 'temperature': 26, 'time_of_day': time_of_day, 'conditions': 'Sunny'}


# ── Call Ekanayake's Product Matcher API (Feature 4) ───────────
async def get_recommendation(user_profile: dict) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                f'{PRODUCT_API}/products/recommend',
                json=user_profile
            )
            return response.json()
    except Exception as e:
        print(f'Product API unavailable: {e}. Using mock.')
        return _mock_recommendation(user_profile)

def _mock_recommendation(profile: dict) -> dict:
    # Simple rule-based mock until Ekanayake's API is ready
    mood = profile.get('mood', 'Normal')
    temp = profile.get('temp_pref', 'Hot')
    if mood == 'Tired':
        product = 'Double Espresso' if 'Hot' in temp else 'Iced Americano'
        reason  = 'High caffeine to boost your energy!'
    elif mood == 'Stressed':
        product = 'Vanilla Lavender Latte'
        reason  = 'Calming lavender with low caffeine — perfect to unwind.'
    elif mood == 'Happy':
        product = 'Caramel Macchiato'
        reason  = 'A sweet treat to match your great mood!'
    else:
        product = 'Cappuccino'
        reason  = 'A classic, balanced choice for any time of day.'
    return {'product_name': product, 'reason': reason, 'price': 'Rs. 450', 'similarity_score': 0.88}
