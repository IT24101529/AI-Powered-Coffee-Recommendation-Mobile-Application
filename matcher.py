import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize as l2_normalize
from explainer import generate_explanation

# The 6 features used in comparison
# These must match the column names in the CoffeeProduct database model
FEATURE_KEYS = ['caffeine', 'warmth', 'sweetness', 'bitterness', 'richness', 'acidity']


def product_to_vector(product) -> list:
    '''
    Converts a CoffeeProduct database object into a flat list of numbers.
    Example: [10, 9, 1, 9, 9, 8]  (for Double Espresso)
    '''
    return [getattr(product, key, 5.0) for key in FEATURE_KEYS]


def apply_context_weights(need_vector: dict, profile: dict = None) -> dict:
    '''
    Adjusts the importance (weight) of features based on context.
    For example: if user is Tired, caffeine becomes 2x more important.
    '''
    weights = {key: 1.0 for key in FEATURE_KEYS}   # Start with all weights = 1

    if not profile:
        return weights

    mood    = profile.get('mood', 'Calm')
    weather = profile.get('weather', 'Warm')

    # Mood-based weight adjustments
    if mood == 'Tired':
        weights['caffeine'] = 2.5    # Caffeine is very important for tired users
        weights['richness'] = 1.5
    elif mood == 'Stressed':
        weights['caffeine'] = 0.5    # Less caffeine for stressed users
        weights['sweetness'] = 1.5   # Comfort/sweetness is more important
        weights['warmth']    = 1.5
    elif mood == 'Happy' or mood == 'Excited':
        weights['sweetness'] = 1.8   # Sweet treats for happy users
    elif mood == 'Sad':
        weights['sweetness'] = 2.0   # Comfort food / sweet
        weights['warmth']    = 1.5
    elif mood == 'Anxious':
        weights['caffeine'] = 0.3    # Very low caffeine for anxious users

    # Weather-based weight adjustments
    if weather in ['Cold', 'Rainy']:
        weights['warmth'] = max(weights['warmth'], 2.0)   # Warmth becomes critical
    elif weather in ['Hot']:
        weights['warmth'] = 0.2      # Warmth less important (user wants cold drink)

    return weights


def find_best_matches(need_vector: dict, products: list, top_n: int = 3, profile: dict = None) -> list:
    '''
    Main matching function.
    Compares user need_vector against all products and returns top N matches.
    
    Both vectors are L2-normalized AFTER applying context weights,
    ensuring cosine similarity scores remain strictly in [0.0, 1.0].
    '''
    if not products:
        return []

    # Get context weights
    weights = apply_context_weights(need_vector, profile)

    # Convert user need vector to a weighted numpy array
    user_vec = np.array([
        need_vector.get(key, 5.0) * weights[key]
        for key in FEATURE_KEYS
    ]).reshape(1, -1)

    # L2-normalize the user vector to unit length
    user_vec = l2_normalize(user_vec)

    results = []
    for product in products:
        # Convert product to a weighted vector
        product_vec = np.array([
            getattr(product, key, 5.0) * weights[key]
            for key in FEATURE_KEYS
        ]).reshape(1, -1)

        # L2-normalize the product vector to unit length
        product_vec = l2_normalize(product_vec)

        # Calculate cosine similarity — now guaranteed in [0, 1] for positive vectors
        similarity = cosine_similarity(user_vec, product_vec)[0][0]

        results.append({
            'product_name':     product.name,
            'category':         product.category,
            'price':            product.price,
            'temperature':      product.temperature,
            'description':      product.description,
            'similarity_score': round(float(similarity), 4),
            'feature_vector':   dict(zip(FEATURE_KEYS, product_to_vector(product))),
            'reason':           generate_explanation(product, need_vector, round(float(similarity), 4))
        })

    # Sort by similarity score, highest first
    results.sort(key=lambda x: x['similarity_score'], reverse=True)

    return results[:top_n]   # Return only the top N
