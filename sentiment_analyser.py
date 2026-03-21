# sentiment_analyser.py
# Uses VADER to detect the sentiment polarity of any text.
# No training required — VADER works out of the box.

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Create ONE instance of the analyser and reuse it for every request.
# Creating it once at startup is more efficient than creating it every call.
_analyser = SentimentIntensityAnalyzer()


def analyse_sentiment(text: str) -> dict:
    '''
    Analyses the sentiment polarity of the given text using VADER.

    Input:  text (str) — the user's message from the chat interface
    Output: dict with:
            - polarity : 'Positive', 'Neutral', or 'Negative'
            - score    : compound score from -1.0 to +1.0
            - details  : breakdown of positive / negative / neutral %
    '''
    if not text or not text.strip():
        return {'polarity': 'Neutral', 'score': 0.0, 'details': {}}

    scores   = _analyser.polarity_scores(text)
    compound = scores['compound']

    # Thresholds raised to 0.15 to avoid polite words triggering Positive
    if compound >= 0.15:
        polarity = 'Positive'
    elif compound <= -0.15:
        polarity = 'Negative'
    else:
        polarity = 'Neutral'

    return {
        'polarity': polarity,
        'score':    round(compound, 4),
        'details': {
            'positive_ratio': round(scores['pos'], 3),
            'negative_ratio': round(scores['neg'], 3),
            'neutral_ratio':  round(scores['neu'], 3),
        }
    }


# Quick test 
if __name__ == '__main__':
    test_sentences = [
        'I am absolutely exhausted and had the worst day',
        'This coffee is amazing, I love it!',
        'I want a latte please',
        'I am so stressed and anxious about everything',
        'Feeling great today, very energetic!',
        'So much work to do, feeling overwhelmed',
        'A medium black coffee',
    ]
    print('── Sentiment Analyser Quick Test ────────────────')
    for s in test_sentences:
        result = analyse_sentiment(s)
        print(f"  {result['polarity']:8s} ({result['score']:+.4f})  {s}")