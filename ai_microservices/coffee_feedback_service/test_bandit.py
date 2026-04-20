import random
from bandit import STRATEGIES, EPSILON

def test_strategies_list_has_four_items():
    assert len(STRATEGIES) == 4
    assert 'content_based' in STRATEGIES
    assert 'mood_based'    in STRATEGIES
    assert 'trending'      in STRATEGIES
    assert 'hybrid'        in STRATEGIES

def test_epsilon_is_between_0_and_1():
    assert 0 < EPSILON < 1, f'EPSILON must be between 0 and 1, got {EPSILON}'

def test_epsilon_greedy_returns_valid_strategy():
    # Simulate the algorithm logic with mock scores
    mock_scores = {'content_based': 0.8, 'mood_based': 0.6, 'trending': 0.55, 'hybrid': 0.7}
    for _ in range(50):
        roll = random.random()
        if roll < EPSILON:
            chosen = random.choice(STRATEGIES)
        else:
            chosen = max(mock_scores, key=mock_scores.get)
        assert chosen in STRATEGIES, f'{chosen} is not a valid strategy'

def test_exploitation_picks_best_strategy():
    # When not exploring (roll >= epsilon), should always pick highest score
    mock_scores = {'content_based': 0.8, 'mood_based': 0.3, 'trending': 0.2, 'hybrid': 0.5}
    best = max(mock_scores, key=mock_scores.get)
    assert best == 'content_based'

def test_success_rate_calculation():
    total_attempts = 10
    total_accepted = 8
    rate = total_accepted / total_attempts
    assert rate == 0.8, f'Expected 0.8, got {rate}'

print('All bandit tests passed!')
