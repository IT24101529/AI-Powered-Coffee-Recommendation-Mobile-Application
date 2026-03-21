# tone_adapter.py
# Maps detected emotion to a chatbot response tone style.


# Tone Profile Definitions 
TONE_PROFILES = {

    'Tired': {
        'style':       'gentle',
        'description': 'Soft, supportive, encouraging. Avoid loud punctuation.',
        'example':     'You deserve a little boost today. Let me find something to help you recharge.',
        'emoji_hint':  'warm, not loud',
        'coffee_hint': 'High-caffeine options — Espresso, Double Shot Latte, Iced Americano',
    },

    'Stressed': {
        'style':       'calming',
        'description': 'Empathetic, slow pace, reassuring. Avoid urgency words.',
        'example':     'Take a breath. I will find something calming and comforting for you.',
        'emoji_hint':  'gentle, peaceful',
        'coffee_hint': 'Low-caffeine, soothing options — Chamomile Latte, Decaf, Oat Milk Latte',
    },

    'Happy': {
        'style':       'enthusiastic',
        'description': 'Warm, upbeat, celebratory. Match the user energy.',
        'example':     'Love the good vibes! Let me find something to make your day even better!',
        'emoji_hint':  'fun, bright',
        'coffee_hint': 'Specialty, premium drinks — Caramel Macchiato, Seasonal Specials',
    },

    'Sad': {
        'style':       'empathetic',
        'description': 'Caring, validating, gentle. Acknowledge their feelings first.',
        'example':     'I am sorry you are having a tough time. Let me suggest something comforting.',
        'emoji_hint':  'warm, caring',
        'coffee_hint': 'Warm, sweet, comforting options — Hot Chocolate, Vanilla Latte',
    },

    'Excited': {
        'style':       'energetic',
        'description': 'High energy, fun, fast-paced. Match their excitement.',
        'example':     'Amazing energy! Let me find the perfect drink to keep you going!',
        'emoji_hint':  'high energy, bold',
        'coffee_hint': 'Bold, vibrant drinks — Cold Brew, Double Espresso, Iced Mocha',
    },

    'Calm': {
        'style':       'friendly',
        'description': 'Neutral, helpful, professional. Standard friendly tone.',
        'example':     'Happy to help you find a great coffee today!',
        'emoji_hint':  'neutral, clean',
        'coffee_hint': 'Standard recommendations based on weather and time of day',
    },

    'Anxious': {
        'style':       'reassuring',
        'description': 'Steady, confident, grounding. Avoid uncertainty words.',
        'example':     'No need to worry — I will guide you to the perfect choice step by step.',
        'emoji_hint':  'steady, warm',
        'coffee_hint': 'Calming, grounding options — Decaf Latte, Herbal Tea Latte',
    },

}

# Default tone used when an unrecognised emotion is passed
DEFAULT_TONE = TONE_PROFILES['Calm']


def get_tone_style(emotion: str) -> dict:
    '''
    Returns the full tone profile dict for a given emotion.
    If the emotion is not recognised, returns the default Calm tone.

    Input:  emotion (str) — e.g. 'Tired', 'Happy', 'Stressed'
    Output: dict with style, description, example, emoji_hint, coffee_hint
    '''
    return TONE_PROFILES.get(emotion, DEFAULT_TONE)


# Quick test
# Run:  python tone_adapter.py
if __name__ == '__main__':
    print('── Tone Adapter Quick Test ───────────────────────')
    for emotion in TONE_PROFILES:
        tone = get_tone_style(emotion)
        print(f"  {emotion:10s} → style: {tone['style']:12s} | {tone['example'][:55]}...")
    print()
    # Test default fallback
    unknown_tone = get_tone_style('UnknownEmotion')
    print(f"  Unknown emotion → defaults to style: '{unknown_tone['style']}' (Calm)  ✓")
