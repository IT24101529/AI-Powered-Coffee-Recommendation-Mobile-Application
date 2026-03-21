# emotion_keywords.py
# Dictionary mapping emotion labels to lists of trigger words/phrases.
# Layer 1 of the emotion detector scans text for these keywords.

EMOTION_KEYWORDS = {
    'Tired': [
        'tired', 'exhausted', 'sleepy', 'drained', 'fatigued', 'drowsy',
        'worn out', 'barely awake', 'no energy', 'low energy', 'heavy eyes',
        'can barely', 'so tired', 'wiped out', 'running on empty', 'dead tired',
        'yawning', 'need sleep', 'haven t slept', 'did not sleep', 'no sleep',
    ],
    'Stressed': [
        'stressed', 'stress', 'anxious', 'anxiety', 'worried', 'nervous',
        'overwhelmed', 'pressure', 'tense', 'restless', 'panicking', 'panic',
        'freaking out', 'losing it', 'so much work', 'deadline', 'can t cope',
        'too much', 'burning out', 'burnt out', 'falling apart', 'on edge',
    ],
    'Happy': [
        'happy', 'great', 'wonderful', 'amazing', 'fantastic', 'excited',
        'thrilled', 'joyful', 'love', 'brilliant', 'excellent', 'fantastic',
        'so good', 'best day', 'cheerful', 'delighted', 'pumped', 'ecstatic',
        'over the moon', 'on top of the world', 'feeling good', 'fantastic',
    ],
    'Sad': [
        'sad', 'unhappy', 'depressed', 'down', 'upset', 'miserable', 'crying',
        'heartbroken', 'lonely', 'gloomy', 'blue', 'terrible', 'awful',
        'devastated', 'hopeless', 'worst day', 'everything is wrong',
        'feel like crying', 'not ok', 'not okay', 'really bad', 'hurt',
    ],
    'Excited': [
        'excited', 'pumped', 'hyped', 'can t wait', 'so ready', 'stoked',
        'buzzing', 'electric', 'energised', 'fired up', 'raring to go',
        'full of energy', 'feeling alive', 'ready to go', 'unstoppable',
    ],
    'Calm': [
        'calm', 'relaxed', 'peaceful', 'chill', 'serene', 'tranquil', 'zen',
        'at ease', 'content', 'fine', 'okay', 'alright', 'good', 'normal',
        'balanced', 'steady', 'comfortable', 'easy going', 'no worries',
    ],
    'Anxious': [
        'anxious', 'nervous', 'uneasy', 'apprehensive', 'jittery', 'on edge',
        'butterflies', 'fear', 'scared', 'afraid', 'what if', 'overthinking',
        'can t stop thinking', 'spiral', 'my mind is racing', 'restless',
    ],
}

# Intensity amplifiers — these words increase the intensity score
AMPLIFIERS = ['very', 'so', 'extremely', 'absolutely', 'incredibly', 'really',
              'totally', 'completely', 'utterly', 'beyond', 'super']

# Negators — these words flip the emotion (e.g. 'not happy' → Sad)
NEGATORS = ['not', 'no', "n't", 'never', 'hardly', 'barely', 'scarcely']
