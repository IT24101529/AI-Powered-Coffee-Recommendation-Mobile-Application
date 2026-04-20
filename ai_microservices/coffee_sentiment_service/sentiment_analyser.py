from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Create one instance of the analyser (reused for every request)
# Creating it once at startup is more efficient than creating it every call
_analyser = SentimentIntensityAnalyzer()

def analyse_sentiment(text: str) -> dict:
    '''
    Analyses the sentiment polarity of the given text.

    Input:  text (str) — the user's message
    Output: dict with:
            - polarity: 'Positive', 'Neutral', or 'Negative'
            - score:    compound score from -1.0 to +1.0
            - details:  breakdown of positive/negative/neutral percentages
    '''
    if not text or not text.strip():
        return {'polarity': 'Neutral', 'score': 0.0, 'details': {}}

    # Get the VADER scores
    # Returns: {'neg': 0.2, 'neu': 0.5, 'pos': 0.3, 'compound': 0.45}
    scores = _analyser.polarity_scores(text)

    compound = scores['compound']   # The overall score

    # Classify based on the compound score.
    # A wider neutral band reduces false positives on plain requests
    # such as "I want a coffee".
    if compound >= 0.2:
        polarity = 'Positive'
    elif compound <= -0.2:
        polarity = 'Negative'
    else:
        polarity = 'Neutral'

    return {
        'polarity': polarity,
        'score':    round(compound, 4),
        'details': {
            'positive_ratio':  round(scores['pos'], 3),
            'negative_ratio':  round(scores['neg'], 3),
            'neutral_ratio':   round(scores['neu'], 3),
        }
    }


# ── Quick test (run this file directly to verify VADER works) ───
if __name__ == '__main__':
    test_sentences = [
        'I am absolutely exhausted and had the worst day',
        'This coffee is amazing, I love it!',
        'I want a latte please',
        'I am so stressed and anxious about everything',
        'Feeling great today, very energetic!',
    ]
    for s in test_sentences:
        result = analyse_sentiment(s)
        print(f'{result["polarity"]:8s} ({result["score"]:+.3f})  {s}')
