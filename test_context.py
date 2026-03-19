# Run with: pytest test_context.py -v
# Tests all components of Feature 3 in isolation.

import json, pytest
from tag_classifier import classify_temperature, classify_condition, classify_all
from time_classifier import get_time_of_day
from fuzzy_engine import run_fuzzy
from decision_tree import predict_context_type


# ════════════════════════════════════════════════════════════════
# TAG CLASSIFIER TESTS
# ════════════════════════════════════════════════════════════════

class TestTagClassifier:

    def test_temperature_hot(self):
        assert classify_temperature(31.5) == 'Hot',   'Above 28°C should be Hot'
        assert classify_temperature(28.0) == 'Hot',   'Exactly 28°C should be Hot'

    def test_temperature_warm(self):
        assert classify_temperature(25.0) == 'Warm',  '25°C should be Warm'
        assert classify_temperature(22.0) == 'Warm',  '22°C should be Warm'

    def test_temperature_cool(self):
        assert classify_temperature(17.4) == 'Cool',  '17.4°C should be Cool'
        assert classify_temperature(15.0) == 'Cool',  'Exactly 15°C should be Cool'

    def test_temperature_cold(self):
        assert classify_temperature(10.0) == 'Cold',  '10°C should be Cold'
        assert classify_temperature(0.0)  == 'Cold',  '0°C should be Cold'

    def test_temperature_boundary_hot_warm(self):
        # 28.0 → Hot,  27.9 → Warm
        assert classify_temperature(28.0) == 'Hot'
        assert classify_temperature(27.9) == 'Warm'

    def test_condition_rain_variants(self):
        assert classify_condition('Rain')    == 'Rainy'
        assert classify_condition('Drizzle') == 'Rainy'
        assert classify_condition('Mist')    == 'Rainy'

    def test_condition_sunny_variants(self):
        assert classify_condition('Clear')   == 'Sunny'
        assert classify_condition('Sunny')   == 'Sunny'

    def test_condition_cloudy_variants(self):
        assert classify_condition('Clouds')  == 'Cloudy'
        assert classify_condition('Fog')     == 'Cloudy'
        assert classify_condition('Haze')    == 'Cloudy'

    def test_condition_stormy_variants(self):
        assert classify_condition('Thunderstorm') == 'Stormy'
        assert classify_condition('Tornado')      == 'Stormy'

    def test_classify_all_returns_both(self):
        result = classify_all(17.4, 'Rain')
        assert result['temp_tag']      == 'Cool'
        assert result['condition_tag'] == 'Rainy'


# ════════════════════════════════════════════════════════════════
# TIME CLASSIFIER TESTS
# ════════════════════════════════════════════════════════════════

class TestTimeClassifier:

    def test_morning_hours(self):
        assert get_time_of_day(6)  == 'Morning'
        assert get_time_of_day(9)  == 'Morning'
        assert get_time_of_day(11) == 'Morning'

    def test_afternoon_hours(self):
        assert get_time_of_day(12) == 'Afternoon'
        assert get_time_of_day(14) == 'Afternoon'
        assert get_time_of_day(16) == 'Afternoon'

    def test_evening_hours(self):
        assert get_time_of_day(17) == 'Evening'
        assert get_time_of_day(19) == 'Evening'
        assert get_time_of_day(20) == 'Evening'

    def test_night_hours(self):
        assert get_time_of_day(21) == 'Night'
        assert get_time_of_day(23) == 'Night'

    def test_late_night_hours(self):
        assert get_time_of_day(0)  == 'Late Night'
        assert get_time_of_day(3)  == 'Late Night'
        assert get_time_of_day(5)  == 'Late Night'

    def test_boundary_morning_afternoon(self):
        assert get_time_of_day(11) == 'Morning'
        assert get_time_of_day(12) == 'Afternoon'


# ════════════════════════════════════════════════════════════════
# FUZZY ENGINE TESTS
# ════════════════════════════════════════════════════════════════

class TestFuzzyEngine:

    def test_cold_morning_high_warmth(self):
        result = run_fuzzy(10.0, 8)
        assert result['warmth_weight'] > 0.7, f'Cold morning should have high warmth, got {result["warmth_weight"]}'

    def test_hot_afternoon_low_warmth(self):
        result = run_fuzzy(35.0, 14)
        assert result['warmth_weight'] < 0.4, f'Hot afternoon should have low warmth, got {result["warmth_weight"]}'

    def test_morning_high_caffeine(self):
        result = run_fuzzy(22.0, 8)
        assert result['caffeine_weight'] > 0.5, f'Morning should have higher caffeine, got {result["caffeine_weight"]}'

    def test_late_night_low_caffeine(self):
        result = run_fuzzy(22.0, 2)
        assert result['caffeine_weight'] < 0.4, f'Late night should have low caffeine, got {result["caffeine_weight"]}'

    def test_output_range_0_to_1(self):
        for temp in [5, 15, 22, 28, 38]:
            for hour in [2, 8, 12, 17, 21]:
                result = run_fuzzy(temp, hour)
                assert 0.0 <= result['warmth_weight']   <= 1.0
                assert 0.0 <= result['caffeine_weight'] <= 1.0


# ════════════════════════════════════════════════════════════════
# DECISION TREE TESTS
# ════════════════════════════════════════════════════════════════

class TestDecisionTree:

    def test_hot_sunny_afternoon_predicts_iced(self):
        result = predict_context_type('Hot', 'Sunny', 'Afternoon')
        assert result['context_type'] == 'Iced/Refreshing'
        assert result['confidence'] > 0.5

    def test_cool_rainy_morning_predicts_comfort(self):
        result = predict_context_type('Cool', 'Rainy', 'Morning')
        assert result['context_type'] == 'Comfort/Warm'

    def test_cold_stormy_morning_predicts_rich(self):
        result = predict_context_type('Cold', 'Stormy', 'Morning')
        assert result['context_type'] == 'Rich/Hot'

    def test_late_night_any_predicts_decaf(self):
        result = predict_context_type('Any', 'Any', 'Late Night')
        assert result['context_type'] == 'Decaf/Light'

    def test_confidence_between_0_and_1(self):
        result = predict_context_type('Warm', 'Cloudy', 'Evening')
        assert 0.0 <= result['confidence'] <= 1.0
