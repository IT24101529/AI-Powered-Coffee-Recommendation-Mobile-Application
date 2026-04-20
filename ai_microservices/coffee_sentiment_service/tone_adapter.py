# Tone style definitions
TONE_PROFILES = {
    'Tired': {
        'style':       'gentle',
        'description': 'Soft, supportive, encouraging. Avoid loud punctuation.',
        'example':     'You deserve a little boost today. Let me find something to help you recharge.',
        'emoji_hint':  'warm, not loud',
    },
    'Stressed': {
        'style':       'calming',
        'description': 'Empathetic, slow pace, reassuring. Avoid urgency words.',
        'example':     'Take a breath. I will find something calming and comforting for you.',
        'emoji_hint':  'gentle, peaceful',
    },
    'Happy': {
        'style':       'enthusiastic',
        'description': 'Warm, upbeat, celebratory. Match the user energy.',
        'example':     'Love the good vibes! Let me find something to make your day even better!',
        'emoji_hint':  'fun, bright',
    },
    'Sad': {
        'style':       'empathetic',
        'description': 'Caring, validating, gentle. Acknowledge their feelings first.',
        'example':     'I am sorry you are having a tough time. Let me suggest something comforting.',
        'emoji_hint':  'warm, caring',
    },
    'Excited': {
        'style':       'energetic',
        'description': 'High energy, fun, fast-paced. Match their excitement.',
        'example':     'Amazing energy! Let me find the perfect drink to keep you going!',
        'emoji_hint':  'high energy, bold',
    },
    'Calm': {
        'style':       'friendly',
        'description': 'Neutral, helpful, professional. Standard friendly tone.',
        'example':     'Happy to help you find a great coffee today!',
        'emoji_hint':  'neutral, clean',
    },
    'Anxious': {
        'style':       'reassuring',
        'description': 'Steady, confident, grounding. Avoid uncertainty words.',
        'example':     'No need to worry — I will guide you to the perfect choice step by step.',
        'emoji_hint':  'steady, warm',
    },
}

DEFAULT_TONE = TONE_PROFILES['Calm']

def get_tone_style(emotion: str) -> dict:
    '''
    Returns the tone profile for a given emotion.
    If the emotion is not recognised, returns the default Calm tone.
    '''
    return TONE_PROFILES.get(emotion, DEFAULT_TONE)


if __name__ == '__main__':
    for emotion in TONE_PROFILES:
        tone = get_tone_style(emotion)
        print(f'{emotion:10s} → style: {tone["style"]:12s} | {tone["example"][:60]}...')
