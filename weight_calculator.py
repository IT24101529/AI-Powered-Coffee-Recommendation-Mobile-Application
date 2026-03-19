# Assembles the final weight vector by combining:
#   1. Fuzzy Logic output (warmth, caffeine)
#   2. Decision Tree prediction (which category)
#   3. context_rules table lookup (base weight vector + additional weights)

import json
from database import ContextRule
from fuzzy_engine import run_fuzzy
from decision_tree import predict_context_type

def lookup_rule(db, temp_tag: str, condition_tag: str, time_of_day: str) -> dict:
    '''
    Searches context_rules for the best matching rule.
    Tries exact match first, then 'Any' wildcard fallback.
    Returns the weight_json and recommended_type from the matching rule.
    '''
    # Priority 1: Exact match on all 3 fields
    rule = db.query(ContextRule).filter(
        ContextRule.weather_condition == condition_tag,
        ContextRule.temp_tag          == temp_tag,
        ContextRule.time_of_day       == time_of_day,
    ).order_by(ContextRule.confidence_score.desc()).first()

    if rule:
        return {'weights': json.loads(rule.weight_json),
                'recommended_type': rule.recommended_type,
                'confidence': rule.confidence_score, 'match_type': 'exact'}

    # Priority 2: Match condition + temp, Any time
    rule = db.query(ContextRule).filter(
        ContextRule.weather_condition == condition_tag,
        ContextRule.temp_tag          == temp_tag,
        ContextRule.time_of_day       == 'Any',
    ).order_by(ContextRule.confidence_score.desc()).first()

    if rule:
        return {'weights': json.loads(rule.weight_json),
                'recommended_type': rule.recommended_type,
                'confidence': rule.confidence_score, 'match_type': 'partial_time'}

    # Priority 3: Match temp only, Any condition, Any time
    rule = db.query(ContextRule).filter(
        ContextRule.temp_tag          == temp_tag,
        ContextRule.weather_condition == 'Any',
        ContextRule.time_of_day       == 'Any',
    ).order_by(ContextRule.confidence_score.desc()).first()

    if rule:
        return {'weights': json.loads(rule.weight_json),
                'recommended_type': rule.recommended_type,
                'confidence': rule.confidence_score, 'match_type': 'temp_only'}

    # Fallback: neutral weights
    print('[WeightCalc] No matching rule found. Using neutral defaults.')
    return {'weights': {'warmth': 0.5, 'caffeine': 0.5},
            'recommended_type': 'Balanced options',
            'confidence': 0.5, 'match_type': 'default'}


def compute_weight_vector(
    db,
    temp_celsius:   float,
    condition_tag:  str,
    temp_tag:       str,
    time_of_day:    str,
    current_hour:   int,
) -> dict:
    '''
    Main weight calculation function.
    Combines fuzzy, decision tree, and rule table outputs into one vector.

    Args:
        db             — database session
        temp_celsius   — raw temperature
        condition_tag  — e.g. 'Rainy'
        temp_tag       — e.g. 'Cool'
        time_of_day    — e.g. 'Morning'
        current_hour   — e.g. 8

    Returns dict with 'weight_vector' (JSON string) and metadata.
    '''
    # ── Layer 1: Rule table lookup ────────────────────────────────
    rule_result = lookup_rule(db, temp_tag, condition_tag, time_of_day)
    base_weights = rule_result['weights'].copy()

    # ── Layer 2: Fuzzy Logic refinement ──────────────────────────
    fuzzy_result = run_fuzzy(temp_celsius, current_hour)

    # Override warmth and caffeine in base_weights with fuzzy values
    # Fuzzy values are blended with rule values (70% rule, 30% fuzzy)
    # This preserves the rule's domain knowledge while adding fuzzy precision
    if 'warmth' in base_weights:
        base_weights['warmth'] = round(
            0.70 * base_weights['warmth'] + 0.30 * fuzzy_result['warmth_weight'], 3
        )
    else:
        base_weights['warmth'] = fuzzy_result['warmth_weight']

    if 'caffeine' in base_weights:
        base_weights['caffeine'] = round(
            0.70 * base_weights['caffeine'] + 0.30 * fuzzy_result['caffeine_weight'], 3
        )
    else:
        base_weights['caffeine'] = fuzzy_result['caffeine_weight']

    # ── Layer 3: Decision Tree validation ────────────────────────
    dt_result = predict_context_type(temp_tag, condition_tag, time_of_day)

    # All weights must be clamped to 0.0–1.0
    final_weights = {k: round(min(1.0, max(0.0, v)), 3) for k, v in base_weights.items()}

    return {
        'weight_vector':    json.dumps(final_weights),
        'weights_dict':     final_weights,
        'recommended_type': rule_result['recommended_type'],
        'rule_match_type':  rule_result['match_type'],
        'rule_confidence':  rule_result['confidence'],
        'dt_context_type':  dt_result['context_type'],
        'dt_confidence':    dt_result['confidence'],
        'fuzzy_warmth':     fuzzy_result['warmth_weight'],
        'fuzzy_caffeine':   fuzzy_result['caffeine_weight'],
    }