# The output format must match the FEATURE_KEYS in matcher.py.

# Base need vectors for each mood
# Each mood maps to a starting point for the 6 features
MOOD_VECTORS = {
    'Tired':    {'caffeine': 9, 'warmth': 7, 'sweetness': 4, 'bitterness': 5, 'richness': 7, 'acidity': 4},
    'Stressed': {'caffeine': 2, 'warmth': 8, 'sweetness': 6, 'bitterness': 2, 'richness': 5, 'acidity': 3},
    'Happy':    {'caffeine': 5, 'warmth': 6, 'sweetness': 8, 'bitterness': 3, 'richness': 6, 'acidity': 4},
    'Sad':      {'caffeine': 4, 'warmth': 9, 'sweetness': 8, 'bitterness': 2, 'richness': 7, 'acidity': 3},
    'Excited':  {'caffeine': 8, 'warmth': 4, 'sweetness': 7, 'bitterness': 3, 'richness': 6, 'acidity': 5},
    'Calm':     {'caffeine': 5, 'warmth': 7, 'sweetness': 5, 'bitterness': 5, 'richness': 6, 'acidity': 5},
    'Anxious':  {'caffeine': 1, 'warmth': 7, 'sweetness': 5, 'bitterness': 2, 'richness': 5, 'acidity': 3},
}

def build_need_vector(profile: dict) -> dict:
    '''
    Converts a user profile dict into a numeric need vector.
    
    Input example:
    { mood: 'Tired', temp_pref: 'Hot', weather: 'Cold', time: 'Morning' }
    
    Output example:
    { caffeine: 9, warmth: 9, sweetness: 4, bitterness: 5, richness: 7, acidity: 4 }
    '''
    mood    = profile.get('mood', 'Calm')
    weather = profile.get('weather', 'Warm')
    time    = profile.get('time', 'Afternoon')
    temp    = profile.get('temp_pref', 'No preference')
    sugar_pref = profile.get('sugar_pref')
    caffeine_pref = profile.get('caffeine_pref')

    # Start with the mood-based base vector
    vector = MOOD_VECTORS.get(mood, MOOD_VECTORS['Calm']).copy()

    # Adjust for weather
    if weather in ['Cold', 'Rainy']:
        vector['warmth'] = min(vector['warmth'] + 2, 10)
        vector['richness'] = min(vector['richness'] + 1, 10)
    elif weather == 'Hot':
        vector['warmth'] = max(vector['warmth'] - 4, 0)   # User wants cold drink

    # Adjust for time of day
    if time == 'Morning':
        vector['caffeine'] = min(vector['caffeine'] + 1, 10)  # Higher caffeine in morning
    elif time in ['Evening', 'Night']:
        vector['caffeine'] = max(vector['caffeine'] - 2, 0)   # Lower caffeine at night

    # Hard override for explicit temperature preference
    if temp == 'Hot':
        vector['warmth'] = max(vector['warmth'], 7)   # Ensure warmth is at least 7
    elif temp == 'Iced':
        vector['warmth'] = min(vector['warmth'], 2)   # Ensure warmth is at most 2

    # Preference overrides from free-form user constraints.
    if sugar_pref == 'Low':
        vector['sweetness'] = min(vector['sweetness'], 3)
    elif sugar_pref == 'High':
        vector['sweetness'] = max(vector['sweetness'], 7)

    if caffeine_pref == 'Low':
        vector['caffeine'] = min(vector['caffeine'], 2)
    elif caffeine_pref == 'High':
        vector['caffeine'] = max(vector['caffeine'], 8)

    return vector


if __name__ == '__main__':
    test_profiles = [
        {'mood': 'Tired',    'temp_pref': 'Hot',  'weather': 'Cold', 'time': 'Morning'},
        {'mood': 'Stressed', 'temp_pref': 'Hot',  'weather': 'Rainy','time': 'Evening'},
        {'mood': 'Happy',    'temp_pref': 'Iced', 'weather': 'Hot',  'time': 'Afternoon'},
    ]
    for p in test_profiles:
        print(f"Mood: {p['mood']:8s} | Weather: {p['weather']:5s} | Vector: {build_need_vector(p)}")
