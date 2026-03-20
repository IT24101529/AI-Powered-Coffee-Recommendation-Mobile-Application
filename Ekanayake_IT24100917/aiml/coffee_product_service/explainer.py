# explainer.py
# Generates a human-readable explanation for why a product was recommended.
# Owner: Ekanayake E.M.T.D.B. | IT24100917


def generate_explanation(product, need_vector: dict, similarity: float) -> str:
    """
    Builds a natural-language explanation for a recommendation.
    """
    reasons = []

    needed_caffeine  = need_vector.get('caffeine',  5)
    needed_warmth    = need_vector.get('warmth',    5)
    needed_sweetness = need_vector.get('sweetness', 5)
    needed_richness  = need_vector.get('richness',  5)

    # Caffeine reasoning
    if needed_caffeine >= 7 and product.caffeine >= 7:
        reasons.append('high caffeine to boost your energy levels')
    elif needed_caffeine <= 3 and product.caffeine <= 3:
        reasons.append('low caffeine to keep you calm and relaxed')

    # Warmth reasoning
    if needed_warmth >= 7 and product.warmth >= 7:
        reasons.append('a warm, comforting experience suited to the weather')
    elif needed_warmth <= 2 and product.warmth <= 2:
        reasons.append('a refreshingly cold drink perfect for hot weather')

    # Sweetness reasoning
    if needed_sweetness >= 7 and product.sweetness >= 7:
        reasons.append('sweet and indulgent flavours to lift your mood')
    elif needed_sweetness <= 2 and product.sweetness <= 2:
        reasons.append('a clean, not-too-sweet taste for focus')

    # Richness reasoning
    if needed_richness >= 7 and product.richness >= 7:
        reasons.append('a rich, full-bodied taste that is satisfying')

    if not reasons:
        reasons.append('a well-balanced choice that suits your current mood and context')

    match_label = (
        'perfect' if similarity >= 0.92 else
        'great'   if similarity >= 0.78 else
        'good'
    )

    explanation = (
        f'A {match_label} match ({int(similarity * 100)}% similarity)! '
        f'{product.description}. '
        f'It suits you because it offers {", and ".join(reasons)}.'
    )
    return explanation
