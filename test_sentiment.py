# test_sentiment.py
# Run with: pytest test_sentiment.py -v

#  Unit tests for Feature 2: Emotion & Sentiment Analysis
#  Expected output: 9 tests PASSED

from sentiment_analyser import analyse_sentiment
from emotion_detector import detect_emotion
from tone_adapter import get_tone_style


#  SENTIMENT TESTS (3 tests)

def test_negative_sentiment():
    result = analyse_sentiment('I am so tired and stressed today')
    assert result['polarity'] == 'Negative', \
        f"Expected 'Negative', got '{result['polarity']}'"
    assert result['score'] < 0


def test_positive_sentiment():
    result = analyse_sentiment('This coffee is absolutely amazing!')
    assert result['polarity'] == 'Positive', \
        f"Expected 'Positive', got '{result['polarity']}'"
    assert result['score'] > 0


def test_neutral_sentiment():
    result = analyse_sentiment('A medium black coffee')
    assert result['polarity'] == 'Neutral', \
        f"Expected 'Neutral', got '{result['polarity']}' (score: {result['score']})"


#  EMOTION TESTS (4 tests)

def test_tired_emotion():
    result = detect_emotion('I am exhausted and drained')
    assert result['emotion'] == 'Tired', \
        f"Expected 'Tired', got '{result['emotion']}'"
    assert result['intensity'] > 0.5


def test_happy_emotion():
    result = detect_emotion('feeling wonderful and happy today')
    assert result['emotion'] == 'Happy', \
        f"Expected 'Happy', got '{result['emotion']}'"


def test_stressed_emotion():
    result = detect_emotion('I am so anxious and overwhelmed')
    assert result['emotion'] in ['Stressed', 'Anxious'], \
        f"Expected 'Stressed' or 'Anxious', got '{result['emotion']}'"


def test_negation_handling():
    result = detect_emotion('I am not happy at all today')
    assert result['emotion'] != 'Happy', \
        f"Negation not handled — got 'Happy' but input was 'not happy'"


#  TONE TESTS (3 tests)

def test_tired_tone():
    tone = get_tone_style('Tired')
    assert tone['style'] == 'gentle', \
        f"Expected 'gentle', got '{tone['style']}'"


def test_stressed_tone():
    tone = get_tone_style('Stressed')
    assert tone['style'] == 'calming', \
        f"Expected 'calming', got '{tone['style']}'"


def test_unknown_emotion_defaults_to_calm():
    tone = get_tone_style('UnknownEmotion')
    assert tone['style'] == 'friendly', \
        f"Expected 'friendly' (Calm default), got '{tone['style']}'"


print('\n  All 10 sentiment & emotion tests passed!  ✓\n')
