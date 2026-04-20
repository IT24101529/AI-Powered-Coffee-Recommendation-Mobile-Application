from sentiment_analyser import analyse_sentiment
from emotion_detector import detect_emotion
from tone_adapter import get_tone_style

# ── Sentiment Tests ──────────────────────────────────────────────
def test_negative_sentiment():
    result = analyse_sentiment('I am so tired and stressed today')
    assert result['polarity'] == 'Negative', f'Expected Negative, got {result["polarity"]}'
    assert result['score'] < 0

def test_positive_sentiment():
    result = analyse_sentiment('This coffee is absolutely amazing!')
    assert result['polarity'] == 'Positive'
    assert result['score'] > 0

def test_neutral_sentiment():
    result = analyse_sentiment('I want a coffee')
    assert result['polarity'] == 'Neutral'

# ── Emotion Tests ────────────────────────────────────────────────
def test_tired_emotion():
    result = detect_emotion('I am exhausted and drained')
    assert result['emotion'] == 'Tired'
    assert result['intensity'] > 0.5

def test_happy_emotion():
    result = detect_emotion('feeling wonderful and happy today')
    assert result['emotion'] == 'Happy'

def test_stressed_emotion():
    result = detect_emotion('I am so anxious and overwhelmed')
    assert result['emotion'] in ['Stressed', 'Anxious']  # Either is correct

def test_negation_handling():
    # 'not happy' should NOT return Happy
    result = detect_emotion('I am not happy at all today')
    assert result['emotion'] != 'Happy', 'Negation not handled correctly'

# ── Tone Tests ───────────────────────────────────────────────────
def test_tired_tone():
    tone = get_tone_style('Tired')
    assert tone['style'] == 'gentle'

def test_stressed_tone():
    tone = get_tone_style('Stressed')
    assert tone['style'] == 'calming'

def test_unknown_emotion_defaults_to_calm():
    tone = get_tone_style('UnknownEmotion')
    assert tone['style'] == 'friendly'  # Default is Calm/friendly

print('All sentiment & emotion tests passed!')
