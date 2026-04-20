from database import StrategyScore
from bandit import thompson_sampling, STRATEGIES
import random

# Minimum number of attempts before we trust a strategy's score
MIN_ATTEMPTS_THRESHOLD = 5

def select_strategy(db, mood: str = None) -> str:
    '''
    Decides which recommendation strategy to use next.
    
    Logic:
    1. If total feedback count is very low (cold start), use hybrid.
    2. If any strategy has fewer than MIN_ATTEMPTS tries, explore it.
    3. Otherwise, use Contextual Bayesian Thompson Sampling.
    '''
    scores = db.query(StrategyScore).all()

    # Calculate total feedback collected so far
    total_attempts = sum(s.total_attempts for s in scores)

    # ── Cold Start: Not enough data yet ───────────────────────────
    # In the first 20 interactions, use hybrid to collect baseline data
    if total_attempts < 20:
        print(f'[Selector] Cold start ({total_attempts} attempts). Using hybrid.')
        return 'hybrid'

    # ── Ensure each strategy gets tried at least MIN_ATTEMPTS times ─
    # Prioritise understudied strategies
    understudied = [
        s.strategy_used for s in scores
        if s.total_attempts < MIN_ATTEMPTS_THRESHOLD
    ]
    if understudied:
        chosen = random.choice(understudied)
        print(f'[Selector] Understudied strategy found → exploring: {chosen}')
        return chosen

    # ── Normal operation: Use the Contextual Bayesian Bandit ──────
    return thompson_sampling(db, mood=mood)


def get_strategy_description(strategy: str) -> str:
    descriptions = {
        'content_based': 'Uses coffee feature vectors and cosine similarity (Ekanayake)',
        'mood_based':    'Prioritises the user emotion detected by sentiment analysis (Bandara)',
        'trending':      'Recommends popular and trending items (Ishaak)',
        'hybrid':        'Combines content, mood, and trending signals equally',
    }
    return descriptions.get(strategy, 'Unknown strategy')
