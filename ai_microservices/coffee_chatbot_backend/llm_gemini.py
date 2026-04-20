import json
import os
import re
import time
from typing import Optional, Dict, Any

import httpx
from dotenv import load_dotenv

load_dotenv()

_LLM_CACHE: Dict[str, Dict[str, Any]] = {}
_RATE_LIMIT_UNTIL = 0.0

def _to_bool(value: str) -> bool:
    return str(value or '').strip().lower() in {'1', 'true', 'yes', 'on'}

def is_llm_enabled() -> bool:
    enabled = _to_bool(os.getenv('LLM_ENABLED', 'false'))
    has_key = bool(os.getenv('GEMINI_API_KEY'))
    return enabled and has_key

def _cache_key(message: str, state: str, step: str) -> str:
    return f'{state}|{step}|{(message or "").strip().lower()}'

def _answer_cache_key(question: str, mood: str, weather: str, time_of_day: str) -> str:
    q = (question or '').strip().lower()
    return f'answer|{q}|{mood}|{weather}|{time_of_day}'

def _is_trivial_message(message: str) -> bool:
    msg = (message or '').strip().lower()
    if not msg:
        return True
    trivial = {
        'hi', 'hello', 'hey', 'ok', 'okay', 'yes', 'no', 'hot', 'cold',
        'done', 'stop', 'cancel', 'yes, order it!', 'show me alternatives',
        'customise this',
    }
    if msg in trivial:
        return True
    return len(msg.split()) <= 2

def _extract_json_block(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r'\{[\s\S]*\}', text)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except Exception:
        return None

def _normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    valid_intents = {'Greeting', 'Suggest', 'Order', 'Browse', 'Question', 'Feedback', 'Complaint', 'Goodbye', 'Unknown'}
    valid_actions = {'none', 'confirm_order', 'alternatives', 'customize', 'cancel_order'}
    valid_moods = {'Tired', 'Stressed', 'Happy', 'Sad', 'Excited', 'Calm', 'Anxious', 'Normal'}
    valid_temps = {'Hot', 'Cold', 'No preference'}

    intent = payload.get('intent_override', 'Unknown')
    action = payload.get('action', 'none')
    mood = payload.get('mood')
    temp_pref = payload.get('temp_pref')
    
    sugar_pref = payload.get('sugar_pref')
    caffeine_pref = payload.get('caffeine_pref')
    calories_pref = payload.get('calories_pref')
    knowledge_query = payload.get('knowledge_query')

    if intent not in valid_intents: intent = 'Unknown'
    if action not in valid_actions: action = 'none'
    if mood not in valid_moods: mood = None
    if temp_pref not in valid_temps: temp_pref = None
        
    sugar_pref = str(sugar_pref) if sugar_pref else None
    caffeine_pref = str(caffeine_pref) if caffeine_pref else None
    calories_pref = str(calories_pref) if calories_pref else None

    confidence = payload.get('confidence', 0.0)
    try:
        confidence = float(confidence)
    except Exception:
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    return {
        'intent_override': intent,
        'action': action,
        'mood': mood,
        'temp_pref': temp_pref,
        'sugar_pref': sugar_pref,
        'caffeine_pref': caffeine_pref,
        'calories_pref': calories_pref,
        'knowledge_query': knowledge_query,
        'should_update_mood': bool(payload.get('should_update_mood', False)),
        'confidence': confidence,
    }

def _get_api_params():
    api_key = os.getenv('GEMINI_API_KEY', '').strip()
    primary_model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash').strip()
    timeout_s = float(os.getenv('GEMINI_TIMEOUT_SECONDS', '2.5'))
    
    model_candidates = [primary_model] if primary_model else []
    model_candidates.extend(['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'])
    seen = set()
    model_candidates = [m for m in model_candidates if not (m in seen or seen.add(m))]
    return api_key, model_candidates, timeout_s

async def _call_gemini_with_fallback(body: dict, model_candidates: list, api_key: str, timeout_s: float) -> Optional[str]:
    """Helper to try multiple models and API versions to avoid 404/429/500 errors."""
    global _RATE_LIMIT_UNTIL
    for model in model_candidates:
        for version in ['v1', 'v1beta']:
            if time.time() < _RATE_LIMIT_UNTIL:
                return None
            url = f'https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={api_key}'
            try:
                async with httpx.AsyncClient(timeout=timeout_s) as client:
                    response = await client.post(url, json=body)
                    response.raise_for_status()
                    data = response.json()
                
                parts = data.get('candidates', [{}])[0].get('content', {}).get('parts', [])
                text = ''.join(str(p.get('text', '')) for p in parts).strip()
                if text: return text
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 429:
                    cooldown = float(os.getenv('GEMINI_RATE_LIMIT_COOLDOWN_SECONDS', '90'))
                    _RATE_LIMIT_UNTIL = time.time() + cooldown
                    return None
                continue
            except Exception:
                continue
    return None

async def analyze_message_with_gemini(message: str, state: str, step: str) -> Optional[Dict[str, Any]]:
    if not is_llm_enabled() or not message or not message.strip(): return None
    if _is_trivial_message(message): return None

    now = time.time()
    if now < _RATE_LIMIT_UNTIL: return None

    cache_ttl = float(os.getenv('GEMINI_CACHE_TTL_SECONDS', '300'))
    key = _cache_key(message, state, step)
    cached = _LLM_CACHE.get(key)
    if cached and now - cached.get('ts', 0) <= cache_ttl: return cached.get('value')

    api_key, model_candidates, timeout_s = _get_api_params()
    classifier_max_tokens = int(os.getenv('GEMINI_MAX_TOKENS_CLASSIFIER', '90'))
    instruction = (
        'You are a strict JSON classifier for an intelligent coffee chatbot. Output JSON only, no markdown. '
        'Rules: 1) Extract health goals (low sugar, etc.) into prefs. 2) Extract coffee questions into knowledge_query.'
    )

    body = {
        'contents': [{'parts': [{'text': instruction}, {'text': json.dumps({'message': message, 'state': state, 'step': step})}]}],
        'generationConfig': {'temperature': 0.1, 'maxOutputTokens': classifier_max_tokens},
    }

    text = await _call_gemini_with_fallback(body, model_candidates, api_key, timeout_s)
    parsed = _extract_json_block(text) if text else None
    if isinstance(parsed, dict):
        value = _normalize_payload(parsed)
        _LLM_CACHE[key] = {'ts': now, 'value': value}
        return value
    return None

async def answer_question_with_gemini(question: str, mood: str='Normal', weather: str='Warm', time_of_day: str='Afternoon', kb_context: str=None) -> Optional[str]:
    if not is_llm_enabled() or not question: return None
    if time.time() < _RATE_LIMIT_UNTIL: return None

    api_key, models, timeout = _get_api_params()
    instruction = 'You are BrewBot at Ember Coffee. Stay in domain: coffee/mood/weather. Use context if provided.'
    if kb_context: instruction += f'\n\nKnowledge: {kb_context}'

    body = {
        'contents': [{'parts': [{'text': instruction}, {'text': json.dumps({'question': question, 'mood': mood, 'weather': weather})}]}],
        'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 150},
    }

    text = await _call_gemini_with_fallback(body, models, api_key, timeout)
    return text.strip() if text else None

async def choose_recommendation_with_gemini(user_profile: Dict[str, Any], candidates: list, recent_history: list=None) -> Optional[Dict[str, Any]]:
    if not is_llm_enabled() or not candidates: return None
    api_key, models, timeout = _get_api_params()
    
    instruction = 'Pick one coffee index that matches user profile best. Return JSON {"index":0,"confidence":0.9,"why":"..."}'
    body = {
        'contents': [{'parts': [{'text': instruction}, {'text': json.dumps({'profile': user_profile, 'candidates': candidates[:5]})}]}],
        'generationConfig': {'temperature': 0.1, 'maxOutputTokens': 120},
    }
    text = await _call_gemini_with_fallback(body, models, api_key, timeout)
    res = _extract_json_block(text) if text else None
    return res

async def generate_initial_greeting(weather: str, temperature: float, time_of_day: str) -> str:
    if not is_llm_enabled(): return f"Hello! Welcome to Ember Coffee! It's a nice {time_of_day}."
    api_key, models, timeout = _get_api_params()
    instruction = f'Generate a friendly barista-style greeting. Context: {weather}, {temperature}C, {time_of_day}.'
    body = {
        'contents': [{'parts': [{'text': instruction}]}],
        'generationConfig': {'temperature': 0.7, 'maxOutputTokens': 80},
    }
    text = await _call_gemini_with_fallback(body, models, api_key, timeout)
    return text.strip() if text else "Hello! Welcome to Ember Coffee! How are you feeling today?"

async def handle_general_chat_with_gemini(message: str, mood: str, weather: str, time_of_day: str) -> str:
    if not is_llm_enabled(): return "I'm only here for coffee chats!"
    api_key, models, timeout = _get_api_params()
    instruction = f'Be a friendly coffee expert. User said: {message}.'
    body = {'contents': [{'parts': [{'text': instruction}]}], 'generationConfig': {'temperature': 0.5, 'maxOutputTokens': 100}}
    text = await _call_gemini_with_fallback(body, models, api_key, timeout)
    return text.strip() if text else "Tell me more about your coffee preferences!"

async def agentic_reasoning_with_gemini(message: str, context: dict, session: dict) -> dict:
    if not is_llm_enabled(): return {"intent_override": "Unknown"}
    api_key, models, timeout = _get_api_params()
    menu_hint = f"\n- Menu: {session.get('menu_data')[:400]}" if session.get('menu_data') else ""
    
    instruction = (
        "You are BrewBot, the expert barista at Ember Coffee. Analyze inputs and return JSON ONLY.\n"
        f"Inputs: Message='{message}', Weather/Time Context={json.dumps(context)}, Mood={session.get('mood')}\n"
        f"{menu_hint}\n"
        "Guidelines:\n"
        "1. If user asks for menu or suggestions, set intent_override='Browse', use 'menu_data' to pick 3 items and write a warm, expert 'agent_reply' describing them.\n"
        "2. If user asks coffee questions, set needs_rag=true, rag_query='...', and write a brief 'agent_reply' based on context.\n"
        "3. Always try to link weather (e.g. cold) to drink types (hot) proactively in 'agent_reply'.\n"
        "Schema: {\"intent_override\":\"...\", \"extracted_entities\":{}, \"agent_reply\":\"...\", \"needs_rag\":bool, \"rag_query\":\"...\"}"
    )
    body = {'contents': [{'parts': [{'text': instruction}]}], 'generationConfig': {'temperature': 0.1, 'maxOutputTokens': 600}}
    text = await _call_gemini_with_fallback(body, models, api_key, 5.0)
    return _extract_json_block(text) if text else {"intent_override": "Unknown"}
