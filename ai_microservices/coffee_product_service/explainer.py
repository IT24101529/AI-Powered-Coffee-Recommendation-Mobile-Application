def generate_explanation(product, need_vector: dict, similarity: float) -> str:
    '''
    Builds a natural language explanation for a recommendation.
    '''
    reasons = []

    # Caffeine reasoning
    needed_caffeine = need_vector.get('caffeine', 5)
    if needed_caffeine >= 7 and product.caffeine >= 7:
        reasons.append('high caffeine to boost your energy')
    elif needed_caffeine <= 3 and product.caffeine <= 3:
        reasons.append('low caffeine to keep you calm and relaxed')

    # Warmth reasoning
    needed_warmth = need_vector.get('warmth', 5)
    if needed_warmth >= 7 and product.warmth >= 7:
        reasons.append('warm and comforting for the weather')
    elif needed_warmth <= 2 and product.warmth <= 2:
        reasons.append('refreshingly cold and perfect for hot weather')

    # Sweetness reasoning
    needed_sweetness = need_vector.get('sweetness', 5)
    if needed_sweetness >= 7 and product.sweetness >= 7:
        reasons.append('sweet and indulgent to lift your mood')
    elif needed_sweetness <= 2 and product.sweetness <= 2:
        reasons.append('not too sweet, clean and focused taste')

    # Build final explanation string
    if not reasons:
        reasons.append('a well-balanced choice for your current needs')

    match_quality = 'perfect' if similarity >= 0.9 else 'great' if similarity >= 0.75 else 'good'

    explanation = f'A {match_quality} match! This is {product.description.lower()}. '
    explanation += 'It suits you because it has ' + ', and '.join(reasons) + '.'

    return explanation
