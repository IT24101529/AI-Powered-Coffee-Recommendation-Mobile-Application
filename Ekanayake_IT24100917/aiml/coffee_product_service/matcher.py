# matcher.py
# Cosine-similarity matching algorithm.
# Compares a user need-vector against all products and returns the top N matches.
# Owner: Ekanayake E.M.T.D.B. | IT24100917

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from explainer import generate_explanation

# Feature keys must match CoffeeProduct column names in database.py
FEATURE_KEYS = ['caffeine', 'warmth', 'sweetness', 'bitterness', 'richness', 'acidity']


def product_to_vector(product) -> list:
    """Converts a CoffeeProduct object into a flat list of feature values."""
    return [getattr(product, key, 5.0) for key in FEATURE_KEYS]


def apply_context_weights(need_vector: dict, profile: dict = None) -> dict:
    """
    Returns a weight dict that amplifies the most relevant features
    based on the user's mood and weather context.
    """
    weights = {key: 1.0 for key in FEATURE_KEYS}

    if not profile:
        return weights

    mood    = profile.get('mood',    'Calm')
    weather = profile.get('weather', 'Warm')

    # Mood-based weights
    if mood == 'Tired':
        weights['caffeine'] = 2.5
        weights['richness'] = 1.5
    elif mood == 'Stressed':
        weights['caffeine'] = 0.5
        weights['sweetness'] = 1.5
        weights['warmth']    = 1.5
    elif mood in ('Happy', 'Excited'):
        weights['sweetness'] = 1.8
    elif mood == 'Sad':
        weights['sweetness'] = 2.0
        weights['warmth']    = 1.5
    elif mood == 'Anxious':
        weights['caffeine'] = 0.3

    # Weather-based weights
    if weather in ('Cold', 'Rainy'):
        weights['warmth'] = max(weights['warmth'], 2.0)
    elif weather == 'Hot':
        weights['warmth'] = 0.2

    return weights


def find_best_matches(need_vector: dict, products: list,
                      top_n: int = 3, profile: dict = None) -> list:
    """
    Main matching function.
    Returns a sorted list of top N matching products with similarity scores.
    """
    if not products:
        return []

    weights   = apply_context_weights(need_vector, profile)

    user_vec  = np.array([
        need_vector.get(key, 5.0) * weights[key]
        for key in FEATURE_KEYS
    ]).reshape(1, -1)

    results = []
    for product in products:
        prod_vec = np.array([
            getattr(product, key, 5.0) * weights[key]
            for key in FEATURE_KEYS
        ]).reshape(1, -1)

        similarity = float(cosine_similarity(user_vec, prod_vec)[0][0])

        results.append({
            'product_name':     product.name,
            'category':         product.category,
            'price':            product.price,
            'temperature':      product.temperature,
            'description':      product.description,
            'similarity_score': round(similarity, 4),
            'feature_vector':   dict(zip(FEATURE_KEYS, product_to_vector(product))),
            'reason': generate_explanation(product, need_vector, round(similarity, 4)),
        })

    results.sort(key=lambda x: x['similarity_score'], reverse=True)
    return results[:top_n]
