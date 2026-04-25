import re

from intent_classifier import predict_intent
from session_store import get_session, update_session
from integrations import (
    get_sentiment, get_context, get_recommendation, 
    get_recommendation_candidates, get_product_details,
<<<<<<< HEAD
    get_coffee_knowledge, get_weather_context, get_all_products,
    submit_feedback
=======
    get_coffee_knowledge, get_weather_context, get_all_products
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
)
from llm_gemini import (
    analyze_message_with_gemini, answer_question_with_gemini, 
    choose_recommendation_with_gemini, generate_initial_greeting, 
    handle_general_chat_with_gemini, agentic_reasoning_with_gemini
)
import json

# Fallback reply when the chatbot doesn't understand
FALLBACK = 'I am not sure I understood that. Could you rephrase? For example, say Hello to start.'

GREETING_WORDS = {
    'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'
}

<<<<<<< HEAD
INTERRUPT_INTENTS = {'Browse', 'Question', 'Complaint', 'Goodbye', 'Feedback'}
=======
INTERRUPT_INTENTS = {'Browse', 'Question', 'Complaint', 'Goodbye'}
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b

COFFEE_DOMAIN_HINTS = {
    'coffee', 'drink', 'menu', 'espresso', 'latte', 'cappuccino', 'americano',
    'mocha', 'macchiato', 'cold brew', 'caffeine', 'decaf', 'bean', 'brew',
    'weather', 'mood', 'recommend', 'suggest', 'hot', 'cold', 'iced', 'sugar',
}

MOOD_HINTS = {
    'tired', 'exhausted', 'sleepy', 'stressed', 'anxious', 'happy', 'sad',
    'excited', 'normal', 'calm', 'energetic', 'down', 'grieving', 'grieve', 'lost', 'crying', 'depressed',
}

MENU_ITEM_HINTS = {
    'espresso', 'cappuccino', 'latte', 'americano', 'macchiato', 'mocha', 'matcha', 'chai', 'cold brew',
}


def _describe_level(value) -> str:
    score = float(value or 0)
    if score <= 3:
        return 'low'
    if score <= 6:
        return 'moderate'
    return 'high'


def _is_product_attribute_question(message: str) -> bool:
    msg = (message or '').strip().lower()
    return any(k in msg for k in [
        'sugar', 'sweet', 'caffeine', 'calorie', 'price', 'cost', 'hot', 'cold', 'iced', 'temperature',
        'what is in', 'about this', 'about it', 'healthy', 'strong', 'bitter'
    ])


def _resolve_target_product_name(message: str, session: dict) -> str:
    msg = (message or '').strip().lower()
    if any(k in msg for k in [' it ', ' this ', ' that ', ' this drink', ' this coffee']) and session.get('last_product_topic'):
        return session.get('last_product_topic')

    history = [x for x in (session.get('recommendation_history') or []) if x]

    for name in reversed(history):
        if str(name).strip().lower() in msg:
            return name

    if session.get('last_product_topic') and _is_product_attribute_question(msg):
        return session.get('last_product_topic')

    return session.get('last_recommendation') or ''


def _extract_explicit_product_phrase(message: str) -> str:
    msg = (message or '').strip()
    patterns = [
        r'how much caffeine does\s+(.+?)\s+have\??$',
        r'what(?:\'s| is)\s+the price of\s+(.+?)\??$',
        r'tell me about\s+(.+?)\??$',
        r'is\s+(.+?)\s+(?:low|high|moderate|less|more|no)?\s*(?:sugar|sweet|caffeine)\??$',
        r'is\s+(.+?)\s+healthy\??$',
    ]
    for pattern in patterns:
        match = re.search(pattern, msg, flags=re.IGNORECASE)
        if match:
            candidate = (match.group(1) or '').strip(' ?.!').lower()
            if candidate in {'it', 'this', 'that', 'this drink', 'this coffee', 'that drink'}:
                return ''
            return candidate
    return ''


async def _answer_product_question(message: str, session_id: str, session: dict) -> dict:
    explicit_name = _extract_explicit_product_phrase(message)
    product_name = explicit_name
    product = await get_product_details(explicit_name) if explicit_name else {}
    if not product:
        product_name = _resolve_target_product_name(message, session)
        if not product_name:
            return {}
        product = await get_product_details(product_name)
    if not product:
        return {}

    msg = (message or '').strip().lower()
    name = product.get('name', product_name)
    temperature = product.get('temperature', 'Hot')
    price = product.get('price', 0)
    calories = product.get('calories', 0)
    sugar_level = _describe_level(product.get('sweetness'))
    caffeine_level = _describe_level(product.get('caffeine'))
    bitterness_level = _describe_level(product.get('bitterness'))

    if any(k in msg for k in ['sugar', 'sweet']):
<<<<<<< HEAD
        reply = f'Of course! {name} is {sugar_level} in sweetness. If you are watching your sugar, I can certainly find a better match for you!'
    elif any(k in msg for k in ['caffeine', 'strong']):
        reply = f'Good question! {name} has a {caffeine_level} caffeine profile. I can switch you to something lighter if you prefer.'
=======
        reply = f'{name} is {sugar_level} in sugar/sweetness. If you want lower sugar, I can suggest a better alternative.'
    elif any(k in msg for k in ['caffeine', 'strong']):
        reply = f'{name} has {caffeine_level} caffeine. If you want less caffeine, I can switch you to a lower-caffeine option.'
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
    elif any(k in msg for k in ['calorie', 'healthy']):
        reply = f'{name} is about {calories:.0f} calories per serving.'
    elif any(k in msg for k in ['price', 'cost']):
        reply = f'{name} costs Rs. {price:.1f}.'
    elif any(k in msg for k in ['hot', 'cold', 'iced', 'temperature']):
        reply = f'{name} is currently a {temperature} drink in our menu setup.'
    elif any(k in msg for k in ['bitter']):
        reply = f'{name} has {bitterness_level} bitterness.'
    else:
        reply = (
            f'{name}: {product.get("description", "A coffee option from our menu.")} '
            f'It is {sugar_level} sugar and {caffeine_level} caffeine.'
        )

    update_session(session_id, {'last_product_topic': name})

    return {
        'reply': reply,
        'quick_replies': ['Yes, order it!', 'Show me alternatives', 'Customise this'],
        'intent': 'Question',
        'state': 'CONFIRM'
    }


def detect_interrupt_intent(message: str):
    msg = (message or '').strip().lower()
    if not msg:
        return None

    # Keep recommendation flow intact even when user uses question marks.
    if any(k in msg for k in [
        'recommend', 'suggest', 'what can you recommend',
        'i am tired', 'i feel', 'i want', 'i need',
        'hot', 'cold', 'no preference', 'less sugar', 'no sugar', 'low caffeine', 'no caffeine',
    ]):
        return None

    if any(k in msg for k in ['menu', 'what\'s on the menu', 'show menu', 'available drinks']):
        return 'Browse'

    # Tighten Goodbye detection to avoid misfiring on random questions.
    if any(k in msg for k in ['bye', 'goodbye', 'see you', 'that will be all', 'i am done']):
        if len(msg.split()) <= 4: # Short phrases only
            return 'Goodbye'

    if any(k in msg for k in ['not good', 'bad recommendation', 'did not like', 'dont like', 'don\'t like']):
        return 'Complaint'

    # Generic question catch for coffee/context domain questions only.
    if any(k in msg for k in COFFEE_DOMAIN_HINTS) and (
        '?' in msg or any(msg.startswith(w) for w in ['what', 'why', 'how', 'when', 'where', 'can you'])
    ):
        return 'Question'

    return None


def should_call_llm(message: str, state: str, step: str) -> bool:
    msg = (message or '').strip().lower()
    if not msg or len(msg) < 8:
        return False

    # Deterministic fast-paths: no need to spend LLM latency budget if ONLY a mood/temp was provided.
    # But if the message is complex (contains other coffee keywords), we SHOULD call LLM to extract them.
    if step == 'ask_temp' and any(k in msg for k in ['hot', 'warm', 'cold', 'iced', 'cool', 'no preference', 'any']):
        if not any(k in msg for k in COFFEE_DOMAIN_HINTS - {'hot', 'cold', 'iced'}):
            return False
            
    if step == 'ask_mood' and any(k in msg for k in MOOD_HINTS.union({'down', 'grieve', 'grieving', 'lost', 'crying'})):
        # If it's JUST a mood, skip LLM. If they said "I'm tired and low sugar", don't skip.
        if not any(k in msg for k in COFFEE_DOMAIN_HINTS):
            return False

    return True

# ── Main handler — called every time a message arrives ─────────
def heuristic_preference_extraction(message: str) -> dict:
    """Fallback extraction when LLM is unavailable."""
    msg = message.lower()
    prefs = {}
    if any(k in msg for k in ['low sugar', 'less sugar', 'no sugar', 'sugar free', 'healthier']):
        prefs['sweetness'] = 2.0
    if any(k in msg for k in ['low caffeine', 'decaf', 'less caffeine', 'no caffeine']):
        prefs['caffeine_level'] = 0.0
    if any(k in msg for k in ['low calorie', 'low cal', 'diet', 'slim']):
        prefs['richness'] = 3.0
    return prefs

async def handle_message(message: str, session_id: str) -> dict:
    session = get_session(session_id)
    state   = session.get('state', 'IDLE')
    step    = session.get('step', 'ask_mood')
    raw_msg = (message or '').strip()
    msg_lower = raw_msg.lower()

    if state == 'DONE':
        if any(k in msg_lower for k in ['hi', 'hello', 'hey', 'start again', 'restart', 'new chat']):
            update_session(session_id, {
                'state': 'GATHERING',
                'step': 'ask_mood',
                'last_recommendation': None,
                'last_product_topic': None,
            })
            return {
                'reply': 'Welcome back! How are you feeling right now? I can suggest a coffee for your mood.',
                'quick_replies': ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal'],
                'intent': 'Greeting',
                'state': 'GATHERING'
            }
        return {
            'reply': 'This chat is completed. Say "Hi" to start a new coffee recommendation.',
            'quick_replies': ['Hi'],
            'intent': 'Goodbye',
            'state': 'DONE'
        }

    # ── AGENTIC DISPATCHER ───────────────────────────────────────
    # Fetch all context in parallel to minimize latency
    weather_task = get_weather_context(session_id)
    menu_task    = get_all_products() if 'menu' in msg_lower or 'what\'s on' in msg_lower else None
    
    weather_data = await weather_task
    menu_data = await menu_task if menu_task else None
    
    # Store menu data in temporary session for reasoning if needed
    if menu_data:
        session['menu_data'] = json.dumps(menu_data)

    # Unified Agent Reasoning (Intent + Entity + Response)
    agent_result = await agentic_reasoning_with_gemini(raw_msg, weather_data, session)
    
    intent = agent_result.get('intent_override', 'Unknown')
    agent_reply = agent_result.get('agent_reply')
<<<<<<< HEAD
    confidence = agent_result.get('confidence', 1.0)
    entities = agent_result.get('extracted_entities') or agent_result # Support flattened or nested

    # Fallback to local intent classifier if Gemini is uncertain or unavailable (429)
    if intent == 'Unknown' or confidence < 0.60:
        local_intent, local_conf = predict_intent(raw_msg)
        if local_conf > confidence:
            print(f"[DEBUG] Falling back to local classifier: {local_intent} ({local_conf})")
            intent = local_intent
            confidence = local_conf

    # --- MOOD LOOPBACK INTERCEPTION ---
    # Fulfills requirement: "everytime a customer says about what he/she is feeling right now mid conversation"
    detected_mood = entities.get('mood')
    current_step = session.get('step', 'ask_mood')
    
    # Trigger loopback if mood is detected AND we are already past the first mood step
    if detected_mood and current_step != 'ask_mood':
        print(f"[DEBUG] Mood loopback triggered: {detected_mood}")
        update_session(session_id, {
            'mood': detected_mood,
            'state': 'GATHERING',
            'step': 'ask_temp'
        })
        return {
            'reply': "got it! adjusting recommendation parameters. Do you prefer hot or cold drinks today?",
            'quick_replies': ['Hot', 'Cold', 'No preference'],
            'intent': 'Suggest',
            'state': 'GATHERING'
        }

    # --- AGENT_REPLY PRIORITY (ChatGPT-style Expert Barista) ---
    # We use agent_reply only if Gemini is highly confident (>= 0.85).
    # Simple greetings are bypassed by Gemini prompt rules to ensure deterministic flow.
    if agent_reply and confidence >= 0.85:
        print(f"[DEBUG] Using Gemini agent_reply for {intent}")
        # Sync attributes from LLM to session for future steps
        sync_data = {}
        if entities.get('mood'): sync_data['mood'] = entities['mood']
        if entities.get('temp_pref'): sync_data['temp_pref'] = entities['temp_pref']
        if entities.get('sugar_pref'): sync_data['sugar_pref'] = entities['sugar_pref']
        if entities.get('caffeine_pref'): sync_data['caffeine_pref'] = entities['caffeine_pref']
        if sync_data: update_session(session_id, sync_data)
        
        # Determine appropriate quick replies based on intent
        replies = []
        if intent == 'Greeting': replies = ['Suggest for my mood', 'Show me the menu']
        elif intent == 'Browse': replies = ['Suggest something else', 'How do I order?']
        elif intent == 'Question': replies = ['Suggest for my mood', 'Great, thanks!']
        
        return {
            'reply': agent_reply,
            'quick_replies': replies,
            'intent': intent,
            'state': state
        }
=======
    entities = agent_result.get('extracted_entities', {})
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b

    # Update session with any extracted entities immediately (GATHERING logic)
    prefs_to_update = {}
    if entities:
        if entities.get('mood'): prefs_to_update['mood'] = entities['mood']
        if entities.get('sweetness'): prefs_to_update['sweetness'] = entities['sweetness']
        if entities.get('caffeine'): prefs_to_update['caffeine_level'] = entities['caffeine']
        if entities.get('richness'): prefs_to_update['richness'] = entities['richness']
    
    # Merge with heuristics for safety
    h_prefs = heuristic_preference_extraction(raw_msg)
    prefs_to_update = {**prefs_to_update, **h_prefs}
    
    if prefs_to_update:
        update_session(session_id, prefs_to_update)

    # ── RAG Knowledge Support ──────────────────────────────────
    if agent_result.get('needs_rag') or intent == 'Question':
        rag_query = agent_result.get('rag_query') or raw_msg
        fact = await get_coffee_knowledge(rag_query)
        if fact:
            # Let Gemini synthesize the final answer using the fact
            reply = await answer_question_with_gemini(
                question=raw_msg,
                mood=session.get('mood', 'Normal'),
                weather=weather_data.get('weather', 'Warm'),
                time_of_day=weather_data.get('time_of_day', 'Afternoon'),
                kb_context=fact
            )
            
            # If in GATHERING, appended a flow-continuation
            if state == 'GATHERING':
                reply += f"\n\nComing back to our recommendation, tell me more about your {step.split('_')[-1]}?"
            
            return {'reply': reply, 'intent': 'Question', 'state': state}

    # ── AGENTIC RESPONSE ───────────────────────────────────────
    # If the Agent provided a direct natural reply, use it!
    # Especially useful for "What's on the menu?" or "Hi" or preference statements.
    if agent_reply and (intent in ['Browse', 'Greeting', 'Goodbye'] or (state == 'GATHERING' and prefs_to_update)):
        # If Browse, ensure we list products
        return {
            'reply': agent_reply,
            'intent': intent,
            'state': state
        }

    # ── FALLBACK TO DETERMINISTIC FLOW ────────────────────────
    # For core recommendation and ordering logic
    if state == 'GATHERING':
        return await handle_suggest(raw_msg, session_id, session, agent_result, intent)

    if state == 'CONFIRM':
        msg = raw_msg.lower()
        llm_action = (agent_result or {}).get('action', 'none')

        if _is_product_attribute_question(msg):
            product_answer = await _answer_product_question(raw_msg, session_id, session)
            if product_answer:
                return product_answer

        # In confirm flow, explicit user commands should win over classifier interrupts.
        if llm_action == 'confirm_order':
            return await handle_order(session_id, session)
        if llm_action == 'cancel_order':
            update_session(session_id, {'state': 'GATHERING', 'step': 'ask_mood'})
            return {
                'reply': 'No worries. I will pause that order. Tell me your mood and I can suggest something else.',
                'quick_replies': ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }
        if llm_action == 'alternatives':
            return await handle_alternatives(session_id, session, raw_msg)
        if llm_action == 'customize':
            update_session(session_id, {'state': 'GATHERING', 'step': 'ask_temp'})
            return {
                'reply': 'Sure, let us customize it. Do you prefer hot or cold drinks?',
                'quick_replies': ['Hot', 'Cold', 'No preference'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }

        if any(k in msg for k in ['yes', 'order', 'yes, order it', 'order it']):
            return await handle_order(session_id, session)
        if any(k in msg for k in ['stop', 'cancel', 'no', 'not now', 'skip']):
            update_session(session_id, {'state': 'GATHERING', 'step': 'ask_mood'})
            return {
                'reply': 'No worries. I will pause that order. Tell me your mood and I can suggest something else.',
                'quick_replies': ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }
        if any(k in msg for k in [
            'alternative', 'alternatives', 'another', 'show me alternatives', 'something else'
        ]):
            return await handle_alternatives(session_id, session, raw_msg)
        if any(k in msg for k in [
            'less sugar', 'low sugar', 'no sugar', 'without sugar',
            'less caffeine', 'low caffeine', 'low caffine', 'no caffeine', 'without caffeine', 'decaf'
        ]):
            return await handle_alternatives(session_id, session, raw_msg)
        if any(k in msg for k in ['custom', 'customise']):
            update_session(session_id, {'state': 'GATHERING', 'step': 'ask_temp'})
            return {
                'reply': 'Sure, let us customize it. Do you prefer hot or cold drinks?',
                'quick_replies': ['Hot', 'Cold', 'No preference'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }

<<<<<<< HEAD
        # In confirm flow, interrupts should only trigger if confidence is high.
        # Otherwise, we stay in the confirm flow (deterministic buttons).
        if intent in INTERRUPT_INTENTS and confidence >= 0.60:
=======
        if intent in INTERRUPT_INTENTS:
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
            if intent == 'Browse':
                return handle_browse()
            if intent == 'Question':
                return await handle_question(raw_msg, session)
            if intent == 'Complaint':
                return handle_complaint(session_id)
            if intent == 'Goodbye':
                return handle_goodbye(session_id)
<<<<<<< HEAD
            if intent == 'Feedback':
                return await handle_feedback(raw_msg, session_id, session)
        
        return {
            'reply': 'Would you like to order this recommendation?',
            'quick_replies': ['Yes, order it!', 'Show me alternatives', 'Customise this', 'Rate this recommendation'],
=======
        return {
            'reply': 'Would you like to order this recommendation?',
            'quick_replies': ['Yes, order it!', 'Show me alternatives', 'Customise this'],
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
            'intent': 'Suggest',
            'state': 'CONFIRM'
        }

    # --- Confidence Threshold / Fallback for Idle/Unknown States ---
    if confidence < 0.60:
        print(f'[DEBUG] Confidence {confidence} below threshold. Falling back to Gemini.')
        return await handle_general_chat_fallback(message, session_id, session, state)

    if state == 'IDLE' or intent == 'Greeting':
        return await handle_greeting(session_id, session)

    elif intent == 'Suggest':
        return await handle_suggest(message, session_id, session)

    elif intent == 'Order':
        return await handle_order(session_id, session)

    elif intent == 'Browse':
        return handle_browse()

    elif intent == 'Question':
        return await handle_question(message, session)

    elif intent == 'Feedback':
        return await handle_feedback(message, session_id, session)

    elif intent == 'Complaint':
        return handle_complaint(session_id)

    elif intent == 'Goodbye':
        return handle_goodbye(session_id)

    else:
        return await handle_general_chat_fallback(message, session_id, session, state)


async def handle_general_chat_fallback(message: str, session_id: str, session: dict, state: str) -> dict:
    """Uses Gemini to handle messages that don't fit a specific intent, enforcing strict guardrails."""
    sentiment_data = await get_sentiment(message)
    mood = sentiment_data.get('mood', 'Normal')
    update_session(session_id, {'mood': mood})
    
    context = await get_context(session_id)
    weather = context.get('weather', 'Warm')
    time = context.get('time_of_day', 'Morning')
    
    reply = await handle_general_chat_with_gemini(message, mood, weather, time)
    
    # If we detected a valid non-Normal mood even though Gemini fallback was used
    if session.get('step') == 'ask_mood' and mood != 'Normal':
        update_session(session_id, {'step': 'ask_health'})
        return {
            'reply': f"{reply}\n\nI understand. Before we continue with a recommendation, are you strict about health care (like sweetness, caffeine, or calories)?",
            'quick_replies': ['Yes', 'No'],
            'intent': 'Suggest',
            'state': 'GATHERING'
        }

    return {
        'reply': reply,
        'intent': 'Unknown',
        'state': state # Stay in current state, don't force DONE
    }


# ── Greeting Handler ────────────────────────────────────────────
async def handle_greeting(session_id, session):
    update_session(session_id, {'state': 'GATHERING', 'step': 'ask_mood'})
    context = await get_context(session_id)
    weather = context.get('weather', 'Warm')
    temperature = context.get('temperature_celsius', 25.0)
    time_of_day = context.get('time_of_day', 'Morning')
    
    reply = await generate_initial_greeting(weather, temperature, time_of_day)
    
    quick_replies = []
    if '?' in reply or 'how are you' in reply.lower() or 'mood' in reply.lower():
        quick_replies = ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal']
        
    return {
        'reply': reply,
        'quick_replies': quick_replies,
        'intent': 'Greeting',
        'state': 'GATHERING'
    }


# ── Suggestion Handler ──────────────────────────────────────────
# This is the most complex part — it asks questions and builds the user profile
def _normalize_temp_pref(value):
    msg = (value or '').strip().lower()
    if any(k in msg for k in {'hot', 'warm'}):
        return 'Hot'
    if any(k in msg for k in {'cold', 'iced', 'cool', 'chilled'}):
        return 'Cold'
    if any(k in msg for k in {'no preference', 'any', 'either', 'whatever'}):
        return 'No preference'
    return value


def _is_valid_temp_pref(value):
    return value in {'Hot', 'Cold', 'No preference'}


def extract_refinements(message: str) -> dict:
    msg = (message or '').strip().lower()
    out = {}

    temp_pref = _normalize_temp_pref(msg)
    if _is_valid_temp_pref(temp_pref):
        out['temp_pref'] = temp_pref

    if any(k in msg for k in ['less sugar', 'low sugar', 'not sweet', 'no sugar', 'reduced sugar']):
        out['sugar_pref'] = 'Low'
    elif any(k in msg for k in ['more sugar', 'sweeter', 'sweet']):
        out['sugar_pref'] = 'High'

    if any(k in msg for k in ['less caffeine', 'low caffeine', 'low caffine', 'decaf', 'without caffeine']):
        out['caffeine_pref'] = 'Low'
    elif any(k in msg for k in ['more caffeine', 'high caffeine', 'extra shot', 'strong caffeine']):
        out['caffeine_pref'] = 'High'

    return out


async def handle_alternatives(session_id, session, user_message=''):
    refinements = extract_refinements(user_message)
<<<<<<< HEAD
    
    # Track if this is the first time alternatives are being triggered
    # This fulfills the requirement to show trending cards on first alternative request
    is_first_alt = not session.get('alternatives_triggered', False)
    
    updates = {'state': 'GATHERING', 'step': 'recommend'}
    updates.update(refinements)
    
    if is_first_alt:
        updates['alternatives_triggered'] = True
        
    update_session(session_id, updates)

    intro = 'Ah! Got you. Here is another option that better matches your preferences.'
    response = await build_recommendation(session_id, force_alternative=True, intro=intro)
    
    if is_first_alt:
        # Prepend a hint about trending items and set the trigger flag for the frontend (PopularNowBanner)
        response['reply'] = "Certainly! I've found some other options for you. I'm also showing some of our trending drinks below that you might like!\n\n" + response['reply']
        response['show_trending'] = True
        
    return response
=======
    updates = {'state': 'GATHERING', 'step': 'recommend'}
    updates.update(refinements)
    update_session(session_id, updates)

    intro = 'Ah! Got you. Here is another option that better matches your preferences.'
    return await build_recommendation(session_id, force_alternative=True, intro=intro)
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b


async def handle_suggest(message, session_id, session, llm_signal=None, intent='Suggest'):
    step = session.get('step', 'ask_mood')

<<<<<<< HEAD
    # Interrupts allowed ONLY if confidence is high (prevent low-conf breakage)
    confidence = (llm_signal or {}).get('confidence', 1.0)
    if intent in INTERRUPT_INTENTS and confidence >= 0.60:
=======
    if intent in INTERRUPT_INTENTS:
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        if intent == 'Browse':
            return handle_browse()
        if intent == 'Question':
            return await handle_question(message, session)
        if intent == 'Complaint':
            return handle_complaint(session_id)
        if intent == 'Goodbye':
            return handle_goodbye(session_id)
<<<<<<< HEAD
        if intent == 'Feedback':
            return await handle_feedback(message, session_id, session)
=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b

    if step == 'ask_mood':
        msg = (message or '').strip().lower()
        if msg in GREETING_WORDS:
            return {
<<<<<<< HEAD
                'reply': "Welcome! I'm here to help you find the perfect brew. To get started, how are you feeling right now? (Tired, happy, stressed, etc.)",
                'quick_replies': ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal'],
                'intent': 'Greeting',
=======
                'reply': 'I can personalize better if you tell me your current mood. Are you energetic, tired, stressed, happy, or normal?',
                'quick_replies': ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal'],
                'intent': 'Suggest',
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
                'state': 'GATHERING'
            }

        if any(k in msg for k in ['learn more', 'more info', 'details']):
            return {
                'reply': 'Sure. Tell me a drink name like "Espresso" or "Cappuccino", and I will explain it. Or share your mood for a personalized recommendation.',
                'quick_replies': ['Show me the menu', 'Suggest for my mood'],
                'intent': 'Question',
                'state': 'GATHERING'
            }

        if any(k in msg for k in ['food', 'eat', 'snack', 'meal']):
            return {
                'reply': 'Right now I handle coffee and drink recommendations only. I can show drinks on the menu or suggest one by mood.',
                'quick_replies': ['Show me the menu', 'Suggest for my mood'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }

        if any(k in msg for k in MENU_ITEM_HINTS) and not any(k in msg for k in MOOD_HINTS):
            return {
                'reply': 'I can explain menu items too. Ask like "Tell me about Espresso" or "How much caffeine in Cappuccino?". If you want a personalized pick, tell me your mood.',
                'quick_replies': ['Tell me about Espresso', 'Tell me about Cappuccino', 'Suggest for my mood'],
                'intent': 'Question',
                'state': 'GATHERING'
            }

        # Strict domain boundary: do not engage in unrelated topics.
        if not any(k in msg for k in COFFEE_DOMAIN_HINTS.union(MOOD_HINTS)):
            return {
                'reply': 'I am focused on coffee, weather context, and mood-based recommendations. Tell me your mood or coffee preference, and I will help you choose a drink.',
                'quick_replies': ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }

        # --- Adaptive Tone Injection ---
        # Get sentiment label from Bandara's integration if already present
        sentiment_label = session.get('mood', 'Normal')
        tone_prefix = ""
        if sentiment_label in ['Tired', 'Sad', 'Exhausted']:
            tone_prefix = "I understand. Let's find something to pick you up! "
        elif sentiment_label in ['Stressed', 'Anxious']:
            tone_prefix = "Let's find something calming for you. "
        elif sentiment_label in ['Happy', 'Excited']:
            tone_prefix = "That's great to hear! Let's celebrate with a tasty brew! "

        # --- Adaptive Intelligence: Skip Redundant Questions ---
        # If we already have health preferences (e.g. from LLM extraction), skip the health check
        has_health_prefs = session.get('sweetness') is not None or session.get('caffeine_level') is not None
        
        if llm_signal and llm_signal.get('confidence', 0.0) >= 0.55 and llm_signal.get('mood'):
            mood_val = llm_signal.get('mood', 'Normal')
            update_session(session_id, {'mood': mood_val})
            
            if has_health_prefs:
                update_session(session_id, {'step': 'ask_temp'})
                return {
                    'reply': f"{tone_prefix}I've noted your health preferences! To narrow it down, do you prefer hot or cold drinks today?",
                    'quick_replies': ['Hot', 'Cold', 'No preference'],
                    'intent': 'Suggest',
                    'state': 'GATHERING'
                }
            else:
                update_session(session_id, {'step': 'ask_health'})
                return {
                    'reply': f"{tone_prefix}Got it! Before we continue, are you strict about health care (like sweetness, caffeine, or calories)?",
                    'quick_replies': ['Yes', 'No'],
                    'intent': 'Suggest',
                    'state': 'GATHERING'
                }

        # User answered the mood question — get sentiment from Bandara's API
        sentiment_data = await get_sentiment(message)
        mood_val = sentiment_data.get('mood', 'Normal')
<<<<<<< HEAD
        
        # --- MOOD INSISTENCE ---
        # If sentiment is Normal but the user didn't use a mood word, they likely skipped the question.
        # We allow "Normal" as a valid mood ONLY if they actually used the word "normal" or "okay".
        has_mood_word = any(w in msg for w in MOOD_HINTS)
        if mood_val == 'Normal' and not has_mood_word and intent == 'Suggest':
             return {
                'reply': "I'd love to pick a coffee for you! But first, a quick check: how are you feeling today? (e.g. Tired, Energetic, Sad, Stressed)",
                'quick_replies': ['Tired', 'Energetic', 'Sad', 'Stressed', 'Normal'],
                'intent': 'Suggest',
                'state': 'GATHERING',
                'step': 'ask_mood'
            }

=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        update_session(session_id, {'mood': mood_val})
        
        if has_health_prefs:
            update_session(session_id, {'step': 'ask_temp'})
            return {
<<<<<<< HEAD
                'reply': f"{tone_prefix}Got it! I've noted your health preferences. Do you prefer hot or cold drinks today?",
=======
                'reply': f"Got it! I've noted your health preferences. Do you prefer hot or cold drinks today?",
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
                'quick_replies': ['Hot', 'Cold', 'No preference'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }
        else:
            update_session(session_id, {'step': 'ask_health'})
            return {
<<<<<<< HEAD
                'reply': f"{tone_prefix}Got it! Before we continue, are you strict about health care (like sweetness, caffeine, or calories)?",
=======
                'reply': f"Got it! Before we continue, are you strict about health care (like sweetness, caffeine, or calories)?",
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
                'quick_replies': ['Yes', 'No'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }

    elif step == 'ask_health':
        msg = (message or '').strip().lower()
        
        # Check if they already provided health details in this response
        if llm_signal and (llm_signal.get('sugar_pref') or llm_signal.get('caffeine_pref')):
             update_session(session_id, {'step': 'ask_temp'})
             return {
                'reply': 'Perfect, I have noted those preferences! Do you prefer hot or cold drinks today?',
                'quick_replies': ['Hot', 'Cold', 'No preference'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }
            
        if msg in ['yes', 'yeah', 'yep', 'y', 'i am', 'sure']:
            update_session(session_id, {'strict_health': True, 'step': 'ask_health_details'})
            return {
                'reply': 'What is your preference for sweetness, caffeine, and calories?',
                'quick_replies': ['Low Sugar', 'Less Caffeine', 'Low Calories', 'Skip'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }
        else:
            update_session(session_id, {'strict_health': False, 'step': 'ask_temp'})
            return {
                'reply': 'Got it! Do you prefer hot or cold drinks today?',
                'quick_replies': ['Hot', 'Cold', 'No preference'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }

    elif step == 'ask_health_details':
        refinements = extract_refinements(message)
        update_session(session_id, {**refinements, 'step': 'ask_temp'})
        return {
            'reply': 'Noted! Do you prefer hot or cold drinks today?',
            'quick_replies': ['Hot', 'Cold', 'No preference'],
            'intent': 'Suggest',
            'state': 'GATHERING'
        }

    elif step == 'ask_temp':
        # User answered temperature preference
        refinements = extract_refinements(message)
        if refinements:
            update_session(session_id, refinements)

        temp_pref = refinements.get('temp_pref') or _normalize_temp_pref(message)
        if llm_signal and llm_signal.get('confidence', 0.0) >= 0.55 and llm_signal.get('temp_pref'):
            temp_pref = llm_signal.get('temp_pref')

        if not _is_valid_temp_pref(temp_pref):
            return {
                'reply': 'Before I recommend, tell me your drink temperature preference: hot, cold, or no preference.',
                'quick_replies': ['Hot', 'Cold', 'No preference'],
                'intent': 'Suggest',
                'state': 'GATHERING'
            }

        update_session(session_id, {'temp_pref': temp_pref, 'step': 'recommend'})
        return await build_recommendation(session_id)

    else:
        return await build_recommendation(session_id)


# ── Build the Final Recommendation ─────────────────────────────
async def build_recommendation(session_id, force_alternative=False, intro=None):
    session = get_session(session_id)

    # Get context (weather + time) from Ranasinghe's API
    context = await get_context(session_id)

    # Build a profile combining all gathered information
    user_profile = {
        'mood':     session.get('mood', 'Normal'),
        'temp_pref': session.get('temp_pref', 'No preference'),
        'weather':  context.get('weather', 'Warm'),
        'time':     context.get('time_of_day', 'Afternoon'),
        'sugar_pref': session.get('sugar_pref'),
        'caffeine_pref': session.get('caffeine_pref'),
    }

    previous = session.get('recommendation_history', [])
    previous_categories = session.get('recommendation_category_history', [])
    # Always avoid immediate repetition; alternatives avoid a wider recent window.
    if previous:
        user_profile['exclude_names'] = previous[-3:] if force_alternative else previous[-1:]
    if force_alternative and previous_categories:
        user_profile['exclude_categories'] = previous_categories[-2:]

    # Send profile to Ekanayake's product matcher
    candidates = await get_recommendation_candidates(user_profile)

    recent_exclusions = {
        str(name).strip().lower()
        for name in user_profile.get('exclude_names', [])
        if name
    }
    if candidates and recent_exclusions:
        non_repeating = [
            c for c in candidates
            if str(c.get('product_name', '')).strip().lower() not in recent_exclusions
        ]
        if non_repeating:
            candidates = non_repeating

    recommendation = candidates[0] if candidates else await get_recommendation(user_profile)

    # Let Gemini actively re-rank top candidates for better personalization.
    if len(candidates) > 1:
        llm_pick = await choose_recommendation_with_gemini(
            user_profile=user_profile,
            candidates=candidates,
            recent_history=previous,
        )
        if llm_pick and isinstance(llm_pick.get('index'), int):
            idx = llm_pick['index']
            if 0 <= idx < len(candidates):
                recommendation = dict(candidates[idx])
                recommendation['selected_by'] = 'gemini'
                recommendation['llm_confidence'] = llm_pick.get('confidence')
                if llm_pick.get('why'):
                    recommendation['llm_why'] = llm_pick.get('why')
        else:
            recommendation = dict(recommendation)
            recommendation['selected_by'] = 'matcher'
    else:
        recommendation = dict(recommendation)
        recommendation['selected_by'] = 'matcher'

    update_session(session_id, {
        'state': 'CONFIRM',
        'last_recommendation': recommendation.get('product_name'),
        'recommendation_history': (previous + [recommendation.get('product_name')])[-6:],
        'recommendation_category_history': (previous_categories + [recommendation.get('category')])[-6:],
        'weather': context.get('weather', 'Warm'),
        'time_of_day': context.get('time_of_day', 'Afternoon'),
    })

    product = recommendation.get('product_name', 'Caramel Latte')
    reason  = recommendation.get('reason', 'It matches your current mood and the weather!')
    price   = recommendation.get('price', 'Rs. 450')

    lead = intro or 'I recommend:'

    return {
        'reply': f'{lead} {product} ({price})! {reason} Would you like to order it?',
<<<<<<< HEAD
        'quick_replies': ['Yes, order it!', 'Show me alternatives', 'Customise this', 'Rate this recommendation'],
=======
        'quick_replies': ['Yes, order it!', 'Show me alternatives', 'Customise this'],
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
        'intent': 'Suggest',
        'state': 'CONFIRM',
        'recommendation': recommendation
    }


# ── Order Handler ───────────────────────────────────────────────
<<<<<<< HEAD
async def handle_order(session_id: str, session: dict) -> dict:
    product_name = session.get('last_recommendation') or 'your selected coffee'
    
    # Enrich with full product details for the Cart
    product_details = await get_product_details(product_name)
    if not product_details or product_details.get('error'):
        # Fallback if DB lookup fails (Hardened to prevent empty Cart UI)
        product_details = {
            'id': f"pid-{product_name.lower().replace(' ', '-')}",
            'name': product_name,
            'price': 450.0,
            'description': 'A delicious handcrafted brew.',
            'category': 'Coffee',
            'image_url': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=200&h=200'
        }

    # Record acceptance in Feedback service immediately
    await submit_feedback(
        session_id=session_id,
        product_name=product_name,
        product_id=product_details.get('id'),
        accepted=True,
        mood=session.get('mood', 'Normal'),
        weather=session.get('weather', 'Warm'),
        strategy=session.get('last_strategy', 'hybrid')
    )

    update_session(session_id, {'state': 'FEEDBACK'})
    
    # Map to Main API (Ember Coffee API) schema for Cart consistency
    cart_product = {
        '_id': product_details.get('id', ''),
        'productName': product_details.get('name', product_name),
        'productImageUrl': product_details.get('image_url', ''),
        'price': product_details.get('price', 450.0),
        'description': product_details.get('description', ''),
        'category': product_details.get('category', 'Coffee')
    }

    return {
        'reply': f'Great choice! Your {product_name} is being prepared. Check your cart to finalize the order!',
        'intent': 'Order',
        'state': 'FEEDBACK',
        'isFeedback': True, # Triggers the inline FeedbackWidget in ChatBotScreen.js
        'product': cart_product, # Product card for the Cart
        'productName': product_name, # For the FeedbackWidget
        'quick_replies': ['Rate this recommendation']
=======
async def handle_order(session_id, session):
    product = session.get('last_recommendation') or 'your selected coffee'
    update_session(session_id, {'state': 'FEEDBACK'})
    return {
        'reply': f'Great choice! Your {product} is being prepared. It will be ready in about 5 minutes!',
        'quick_replies': ['Rate this recommendation'],
        'intent': 'Order',
        'state': 'FEEDBACK'
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
    }


# ── Browse Handler ──────────────────────────────────────────────
def handle_browse():
    return {
        'reply': 'Here are some popular options: Espresso, Cappuccino, Iced Latte, Caramel Macchiato, Cold Brew. Type any name to learn more, or say "Suggest" for a personalised recommendation!',
        'intent': 'Browse',
        'state': 'GATHERING'
    }


# ── Question Handler ────────────────────────────────────────────
async def handle_question(message, session=None):
    session = session or {}
    msg = message.lower()
    
    # ── SMART FEATURE: RAG Retriever ────────────────────────────
    # First, check our local high-quality knowledge base (RAG)
    kb_fact = await get_coffee_knowledge(message)
    # We don't return kb_fact directly anymore; we pass it to Gemini for better phrasing
    
    # Second, check specific product details if a name is mentioned
    for product_name in MENU_ITEM_HINTS:
        if product_name in msg:
            details = await get_product_details(product_name)
            if details and not details.get('error'):
                return {
                    'reply': f"Our {details['name']} is a {details['category']} drink priced at Rs. {details['price']}. {details.get('description', '')}",
                    'intent': 'Question'
                }

    # Third, use Gemini for sophisticated coffee reasoning with RAG context
    llm_reply = await answer_question_with_gemini(
        question=message,
        mood=session.get('mood', 'Normal'),
        weather=session.get('weather', 'Warm'),
        time_of_day=session.get('time_of_day', 'Afternoon'),
        kb_context=kb_fact # Inject the top-3 snippets here
    )
    if llm_reply:
        return {'reply': llm_reply, 'intent': 'Question'}

    # Final fallback if all else fails
    return {
        'reply': 'I am personalizing your experience for coffee! Ask me about drinks, menu items, or brewing methods like V60 and French Press.',
        'intent': 'Question'
    }


# ── Feedback Handler ────────────────────────────────────────────
<<<<<<< HEAD
async def handle_feedback(message: str, session_id: str, session: dict) -> dict:
    msg = message.lower()
    product_name = session.get('last_recommendation', 'Unknown Product')
    
    # Heuristic rating extraction (1-5)
    rating = None
    if '5' in msg or 'excellent' in msg or 'great' in msg: rating = 5.0
    elif '4' in msg or 'good' in msg: rating = 4.0
    elif '3' in msg or 'okay' in msg: rating = 3.0
    elif '2' in msg or 'bad' in msg: rating = 2.0
    elif '1' in msg or 'terrible' in msg: rating = 1.0

    if rating:
        # Submit detailed rating to Feedback service
        await submit_feedback(
            session_id=session_id,
            product_name=product_name,
            accepted=True,
            rating=rating,
            notes=message,
            mood=session.get('mood', 'Normal'),
            weather=session.get('weather', 'Warm'),
            strategy=session.get('last_strategy', 'hybrid')
        )
        reply = 'Thank you for the rating! It helps me learn your preferences. Enjoy your coffee!'
        state = 'DONE'
        is_feedback = False
    else:
        reply = 'I would love to hear your thoughts! Please rate the recommendation below:'
        state = 'FEEDBACK'
        is_feedback = True

    update_session(session_id, {'state': state})
    return {
        'reply': reply,
        'intent': 'Feedback',
        'state': state,
        'isFeedback': is_feedback,
        'productName': product_name
=======
async def handle_feedback(message, session_id, session):
    update_session(session_id, {'state': 'DONE'})
    return {
        'reply': 'Thank you for your feedback! It helps me improve my recommendations. Come back soon!',
        'intent': 'Feedback',
        'state': 'DONE'
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
    }


# ── Complaint Handler ───────────────────────────────────────────
def handle_complaint(session_id):
    update_session(session_id, {'step': 'ask_mood', 'state': 'GATHERING'})
    return {
        'reply': 'I am sorry to hear that! Let me suggest something different. How are you feeling right now?',
        'quick_replies': ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal'],
        'intent': 'Complaint'
    }


# ── Goodbye Handler ─────────────────────────────────────────────
def handle_goodbye(session_id):
    update_session(session_id, {
        'state': 'DONE',
        'step': None,
        'last_recommendation': None,
        'last_product_topic': None,
    })
    return {
        'reply': 'Goodbye! Hope you enjoyed your coffee. See you next time!',
        'intent': 'Goodbye',
        'state': 'DONE'
    }
