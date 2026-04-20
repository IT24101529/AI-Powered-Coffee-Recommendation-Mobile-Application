from vector_builder import build_need_vector
from explainer import generate_explanation

def test_tired_vector_has_high_caffeine():
    profile = {'mood': 'Tired', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Morning'}
    vec = build_need_vector(profile)
    assert vec['caffeine'] >= 8, f'Expected high caffeine for Tired, got {vec["caffeine"]}'

def test_stressed_vector_has_low_caffeine():
    profile = {'mood': 'Stressed', 'temp_pref': 'Hot', 'weather': 'Warm', 'time': 'Evening'}
    vec = build_need_vector(profile)
    assert vec['caffeine'] <= 4, f'Expected low caffeine for Stressed, got {vec["caffeine"]}'

def test_cold_weather_increases_warmth():
    warm_profile = {'mood': 'Calm', 'temp_pref': 'No preference', 'weather': 'Warm',  'time': 'Afternoon'}
    cold_profile = {'mood': 'Calm', 'temp_pref': 'No preference', 'weather': 'Cold',  'time': 'Afternoon'}
    warm_vec = build_need_vector(warm_profile)
    cold_vec = build_need_vector(cold_profile)
    assert cold_vec['warmth'] > warm_vec['warmth'], 'Cold weather should increase warmth need'

def test_iced_preference_reduces_warmth():
    profile = {'mood': 'Happy', 'temp_pref': 'Iced', 'weather': 'Hot', 'time': 'Afternoon'}
    vec = build_need_vector(profile)
    assert vec['warmth'] <= 2, f'Expected low warmth for Iced preference, got {vec["warmth"]}'

print('All product matcher tests passed!')
