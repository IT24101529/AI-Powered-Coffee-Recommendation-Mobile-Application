# dialogue_manager.py
# Controls the flow of the conversation.
# Uses the intent from Step 3 and coordinates with other modules.

from intent_classifier import predict_intent
from session_store import get_session, update_session
from integrations import get_sentiment, get_context, get_recommendation

# Fallback reply when the chatbot doesn't understand
FALLBACK = 'I am not sure I understood that. Could you rephrase? For example, say Hello to start.'

# ── Main handler — called every time a message arrives ─────────
async def handle_message(message: str, session_id: str) -> dict:
    session = get_session(session_id)
    state   = session.get('state', 'IDLE')    # Current conversation state
    intent, confidence = predict_intent(message)

    print(f'[DEBUG] Message: {message} | Intent: {intent} ({confidence}) | State: {state}')

    # ── Route to the correct handler based on intent and state ──
    if intent == 'Greeting' or state == 'IDLE':
        return await handle_greeting(session_id, session)

    elif intent == 'Suggest' or state == 'GATHERING':
        return await handle_suggest(message, session_id, session)

    elif intent == 'Order':
        return await handle_order(session_id, session)

    elif intent == 'Browse':
        return handle_browse()

    elif intent == 'Question':
        return handle_question(message)

    elif intent == 'Feedback':
        return await handle_feedback(message, session_id, session)

    elif intent == 'Complaint':
        return handle_complaint(session_id)

    elif intent == 'Goodbye':
        return handle_goodbye(session_id)

    else:
        return {'reply': FALLBACK, 'intent': intent, 'state': state}


# ── Greeting Handler ────────────────────────────────────────────
async def handle_greeting(session_id, session):
    update_session(session_id, {'state': 'GATHERING', 'step': 'ask_mood'})
    return {
        'reply': 'Hello! Welcome to our coffee shop! I am here to find you the perfect drink. How are you feeling right now?',
        'quick_replies': ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal'],
        'intent': 'Greeting',
        'state': 'GATHERING'
    }


# ── Suggestion Handler ──────────────────────────────────────────
# This is the most complex part — it asks questions and builds the user profile
async def handle_suggest(message, session_id, session):
    step = session.get('step', 'ask_mood')

    if step == 'ask_mood':
        # User answered the mood question — get sentiment from Bandara's API
        sentiment_data = await get_sentiment(message)      # Calls Bandara's service
        update_session(session_id, {
            'mood': sentiment_data.get('mood', 'Normal'),
            'step': 'ask_temp'
        })
        return {
            'reply': f'Got it! Do you prefer hot or cold drinks today?',
            'quick_replies': ['Hot', 'Cold', 'No preference'],
            'intent': 'Suggest',
            'state': 'GATHERING'
        }

    elif step == 'ask_temp':
        # User answered temperature preference
        update_session(session_id, {'temp_pref': message, 'step': 'recommend'})
        return await build_recommendation(session_id)

    else:
        return await build_recommendation(session_id)


# ── Build the Final Recommendation ─────────────────────────────
async def build_recommendation(session_id):
    session = get_session(session_id)

    # Get context (weather + time) from Ranasinghe's API
    context = await get_context()

    # Build a profile combining all gathered information
    user_profile = {
        'mood':     session.get('mood', 'Normal'),
        'temp_pref': session.get('temp_pref', 'No preference'),
        'weather':  context.get('weather', 'Warm'),
        'time':     context.get('time_of_day', 'Afternoon'),
    }

    # Send profile to Ekanayake's product matcher
    recommendation = await get_recommendation(user_profile)

    update_session(session_id, {
        'state': 'CONFIRM',
        'last_recommendation': recommendation.get('product_name'),
    })

    product = recommendation.get('product_name', 'Caramel Latte')
    reason  = recommendation.get('reason', 'It matches your current mood and the weather!')
    price   = recommendation.get('price', 'Rs. 450')

    return {
        'reply': f'I recommend: {product} ({price})! {reason} Would you like to order it?',
        'quick_replies': ['Yes, order it!', 'Show me alternatives', 'Customise this'],
        'intent': 'Suggest',
        'state': 'CONFIRM',
        'recommendation': recommendation
    }


# ── Order Handler ───────────────────────────────────────────────
async def handle_order(session_id, session):
    product = session.get('last_recommendation', 'your selected coffee')
    update_session(session_id, {'state': 'FEEDBACK'})
    return {
        'reply': f'Great choice! Your {product} is being prepared. It will be ready in about 5 minutes!',
        'quick_replies': ['Rate this recommendation'],
        'intent': 'Order',
        'state': 'FEEDBACK'
    }


# ── Browse Handler ──────────────────────────────────────────────
def handle_browse():
    return {
        'reply': 'Here are some popular options: Espresso, Cappuccino, Iced Latte, Caramel Macchiato, Cold Brew. Type any name to learn more, or say "Suggest" for a personalised recommendation!',
        'intent': 'Browse',
        'state': 'GATHERING'
    }


# ── Question Handler ────────────────────────────────────────────
def handle_question(message):
    # Simple keyword-based answers for now
    msg = message.lower()
    if 'latte' in msg:
        reply = 'A latte is espresso mixed with steamed milk and a small layer of foam. It is smooth and mild.'
    elif 'espresso' in msg:
        reply = 'Espresso is a strong, concentrated coffee shot made by forcing hot water through finely ground coffee.'
    elif 'caffeine' in msg:
        reply = 'Espresso has the most caffeine per ml. For less caffeine, try a decaf or herbal option!'
    else:
        reply = 'Great question! Could you be more specific? For example: What is a cappuccino?'
    return {'reply': reply, 'intent': 'Question'}


# ── Feedback Handler ────────────────────────────────────────────
async def handle_feedback(message, session_id, session):
    update_session(session_id, {'state': 'DONE'})
    return {
        'reply': 'Thank you for your feedback! It helps me improve my recommendations. Come back soon!',
        'intent': 'Feedback',
        'state': 'DONE'
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
    update_session(session_id, {'state': 'DONE'})
    return {
        'reply': 'Goodbye! Hope you enjoyed your coffee. See you next time!',
        'intent': 'Goodbye',
        'state': 'DONE'
    }
