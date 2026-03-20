# tests/test_matcher.py
# Unit tests for Feature 4 — Product Matching Service
# Run with: pytest tests/test_matcher.py -v
# Owner: Ekanayake E.M.T.D.B. | IT24100917

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from vector_builder import build_need_vector
from explainer import generate_explanation


# ── Vector Builder Tests ─────────────────────────────────────────

def test_tired_vector_has_high_caffeine():
    profile = {'mood': 'Tired', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Morning'}
    vec = build_need_vector(profile)
    assert vec['caffeine'] >= 8, f'Expected high caffeine for Tired, got {vec["caffeine"]}'


def test_stressed_vector_has_low_caffeine():
    profile = {'mood': 'Stressed', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Evening'}
    vec = build_need_vector(profile)
    assert vec['caffeine'] <= 4, f'Expected low caffeine for Stressed, got {vec["caffeine"]}'


def test_anxious_vector_has_very_low_caffeine():
    profile = {'mood': 'Anxious', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Evening'}
    vec = build_need_vector(profile)
    assert vec['caffeine'] <= 3, f'Expected very low caffeine for Anxious, got {vec["caffeine"]}'


def test_cold_weather_increases_warmth():
    warm_profile = {'mood': 'Calm', 'temp_pref': 'No preference', 'weather': 'Warm', 'time': 'Afternoon'}
    cold_profile = {'mood': 'Calm', 'temp_pref': 'No preference', 'weather': 'Cold', 'time': 'Afternoon'}
    warm_vec = build_need_vector(warm_profile)
    cold_vec = build_need_vector(cold_profile)
    assert cold_vec['warmth'] > warm_vec['warmth'], 'Cold weather should increase warmth need'


def test_hot_weather_reduces_warmth():
    profile = {'mood': 'Calm', 'temp_pref': 'No preference', 'weather': 'Hot', 'time': 'Afternoon'}
    vec = build_need_vector(profile)
    assert vec['warmth'] <= 3, f'Expected low warmth for Hot weather, got {vec["warmth"]}'


def test_iced_preference_enforces_low_warmth():
    profile = {'mood': 'Happy', 'temp_pref': 'Iced', 'weather': 'Hot', 'time': 'Afternoon'}
    vec = build_need_vector(profile)
    assert vec['warmth'] <= 2, f'Expected warmth <= 2 for Iced preference, got {vec["warmth"]}'


def test_hot_preference_enforces_high_warmth():
    profile = {'mood': 'Happy', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Afternoon'}
    vec = build_need_vector(profile)
    assert vec['warmth'] >= 7, f'Expected warmth >= 7 for Hot preference, got {vec["warmth"]}'


def test_morning_increases_caffeine():
    eve_profile  = {'mood': 'Calm', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Evening'}
    morn_profile = {'mood': 'Calm', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Morning'}
    eve_vec  = build_need_vector(eve_profile)
    morn_vec = build_need_vector(morn_profile)
    assert morn_vec['caffeine'] > eve_vec['caffeine'], 'Morning should have higher caffeine than Evening'


def test_unknown_mood_falls_back_to_calm():
    profile = {'mood': 'Mysterious', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Afternoon'}
    vec = build_need_vector(profile)
    from vector_builder import MOOD_VECTORS
    calm_vec = MOOD_VECTORS['Calm'].copy()
    assert vec['caffeine'] == calm_vec['caffeine'], 'Unknown mood should fall back to Calm vector'


# ── Explainer Tests ──────────────────────────────────────────────

class MockProduct:
    def __init__(self, name, description, caffeine, warmth, sweetness, richness):
        self.name        = name
        self.description = description
        self.caffeine    = caffeine
        self.warmth      = warmth
        self.sweetness   = sweetness
        self.richness    = richness


def test_explanation_contains_product_description():
    product = MockProduct('Espresso', 'Concentrated shot of pure coffee', 10, 9, 1, 9)
    vec     = {'caffeine': 9, 'warmth': 8, 'sweetness': 2, 'bitterness': 5, 'richness': 7, 'acidity': 5}
    result  = generate_explanation(product, vec, 0.95)
    assert 'Concentrated shot of pure coffee' in result


def test_explanation_mentions_caffeine_for_tired():
    product = MockProduct('Double Espresso', 'Two shots for maximum energy', 10, 9, 1, 9)
    vec     = {'caffeine': 9, 'warmth': 8, 'sweetness': 2, 'bitterness': 5, 'richness': 7, 'acidity': 5}
    result  = generate_explanation(product, vec, 0.94)
    assert 'caffeine' in result.lower()


def test_explanation_mentions_cold_for_iced():
    product = MockProduct('Iced Americano', 'Bold espresso poured over ice', 8, 1, 1, 6)
    vec     = {'caffeine': 8, 'warmth': 1, 'sweetness': 1, 'bitterness': 6, 'richness': 5, 'acidity': 5}
    result  = generate_explanation(product, vec, 0.88)
    assert 'cold' in result.lower()


def test_explanation_uses_perfect_label_for_high_similarity():
    product = MockProduct('Lavender Latte', 'Calming lavender latte', 3, 8, 6, 5)
    vec     = {'caffeine': 2, 'warmth': 8, 'sweetness': 6, 'bitterness': 2, 'richness': 5, 'acidity': 3}
    result  = generate_explanation(product, vec, 0.95)
    assert 'perfect' in result.lower()


print('\n✅  All Feature 4 tests are defined. Run: pytest tests/test_matcher.py -v')
