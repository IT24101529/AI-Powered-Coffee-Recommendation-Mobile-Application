# Temperature → Hot/Warm/Cool/Cold  (from FR3.3)
# Condition   → Sunny/Rainy/Cloudy/Stormy

# ── Temperature thresholds from PRD FR3.3 ───────────────────────
# Hot  > 28°C
# Warm  22°C to 28°C
# Cool  15°C to 22°C
# Cold < 15°C
TEMP_THRESHOLDS = [
    (28, 'Hot'),    # Above 28°C
    (22, 'Warm'),   # 22°C to 28°C
    (15, 'Cool'),   # 15°C to 22°C
]

# ── Condition mapping from OpenWeatherMap codes to our tags ──────
# OpenWeatherMap returns: 'Clear', 'Rain', 'Drizzle', 'Clouds', 'Thunderstorm', etc.
# We map these to our 4 tag values: Sunny, Rainy, Cloudy, Stormy
CONDITION_MAP = {
    'Clear':        'Sunny',
    'Sunny':        'Sunny',
    'Rain':         'Rainy',
    'Drizzle':      'Rainy',
    'Mist':         'Rainy',    # Mist is treated as light rain
    'Fog':          'Cloudy',
    'Haze':         'Cloudy',
    'Smoke':        'Cloudy',
    'Clouds':       'Cloudy',
    'Thunderstorm': 'Stormy',
    'Tornado':      'Stormy',
    'Squall':       'Stormy',
    'Snow':         'Stormy',   # Rare in Sri Lanka but included for completeness
}


def classify_temperature(temp_celsius: float) -> str:
    '''
    Converts a temperature value to a categorical tag.

    Args:    temp_celsius — temperature from weather API (e.g. 17.4)
    Returns: tag string   — one of: 'Hot', 'Warm', 'Cool', 'Cold'
    '''
    for threshold, tag in TEMP_THRESHOLDS:
        if temp_celsius >= threshold:
            return tag
    return 'Cold'   # Below 15°C


def classify_condition(api_condition: str) -> str:
    '''
    Converts an OpenWeatherMap condition string to our 4-value tag.

    Args:    api_condition — condition from API e.g. 'Rain', 'Clouds', 'Clear'
    Returns: tag string    — one of: 'Sunny', 'Rainy', 'Cloudy', 'Stormy'
    '''
    # Try direct lookup first
    if api_condition in CONDITION_MAP:
        return CONDITION_MAP[api_condition]

    # Fallback: case-insensitive keyword search
    api_lower = api_condition.lower()
    if 'rain' in api_lower or 'drizzle' in api_lower:
        return 'Rainy'
    if 'thunder' in api_lower or 'storm' in api_lower:
        return 'Stormy'
    if 'cloud' in api_lower or 'fog' in api_lower or 'haze' in api_lower:
        return 'Cloudy'
    return 'Sunny'   # Default for unknown clear conditions


def classify_all(temp_celsius: float, api_condition: str) -> dict:
    '''
    Convenience function that returns both tags at once.
    Also returns the raw values for logging/debugging.
    '''
    return {
        'temp_tag':       classify_temperature(temp_celsius),
        'condition_tag':  classify_condition(api_condition),
        'raw_temp':       temp_celsius,
        'raw_condition':  api_condition,
    }


# ── Test directly ─────────────────────────────────────────────────
if __name__ == '__main__':
    test_cases = [
        (31.5, 'Clear'),        # Colombo hot sunny day
        (17.4, 'Rain'),         # Kandy cool rainy morning
        (14.2, 'Thunderstorm'), # Very cold stormy day
        (23.0, 'Clouds'),       # Warm cloudy afternoon
        (22.5, 'Drizzle'),      # Warm drizzle
        (10.0, 'Snow'),         # Hypothetical cold
    ]
    print('Tag classification tests:')
    for temp, cond in test_cases:
        result = classify_all(temp, cond)
        print(f'  {temp}°C + {cond:12s} → temp: {result["temp_tag"]:5s} | condition: {result["condition_tag"]}')