import random
from collections import defaultdict
from scipy.stats import beta  # For Bayesian Thompson Sampling
from database import StrategyScore

# The four 'arms' of the bandit (the four recommendation strategies)
STRATEGIES = ['content_based', 'mood_based', 'trending', 'hybrid']

# ── In-memory contextual tracking ──────────────────────────────
# Tracks per-context (mood) α/β for each strategy  
# Structure: { "strategy|mood" : { "alpha": int, "beta": int } }
_contextual_scores = defaultdict(lambda: {"alpha": 1, "beta": 1})

# Minimum observations before trusting context-specific data
MIN_CONTEXT_OBS = 3


def thompson_sampling(db, mood: str = None) -> str:
    '''
    Contextual Bayesian Thompson Sampling algorithm.
    Models each strategy's success rate as a Beta distribution.
    When mood context is available and has enough data, uses
    context-specific α/β instead of global parameters.
    
    Returns: the name of the strategy with the highest random sample.
    '''
    # Load global strategy scores from the database
    scores = db.query(StrategyScore).all()

    if not scores:
        return random.choice(STRATEGIES)

    # ── Bayesian Sampling with Context ─────────────────────────
    samples = {}
    for s in scores:
        # Global α/β from database
        global_alpha = s.total_accepted + 1
        global_beta_param = (s.total_attempts - s.total_accepted) + 1
        
        # Check for context-specific data
        if mood:
            ctx_key = f"{s.strategy_used}|{mood}"
            ctx = _contextual_scores[ctx_key]
            total_ctx_obs = (ctx["alpha"] - 1) + (ctx["beta"] - 1)
            
            if total_ctx_obs >= MIN_CONTEXT_OBS:
                # Enough context data → use context-specific parameters
                alpha = ctx["alpha"]
                beta_param = ctx["beta"]
                print(f'[Bandit] Using context {ctx_key}: α={alpha}, β={beta_param}')
            else:
                # Not enough context data → use global parameters
                alpha = global_alpha
                beta_param = global_beta_param
        else:
            alpha = global_alpha
            beta_param = global_beta_param
        
        # Draw a sample from the Beta distribution
        samples[s.strategy_used] = beta.rvs(alpha, beta_param)

    # ── Choose the winner ──────────────────────────────────────
    chosen = max(samples, key=samples.get)
    ctx_info = f' (mood={mood})' if mood else ''
    print(f'[Bandit] Thompson Sampling{ctx_info} → chose: {chosen} (sample: {samples[chosen]:.3f})')
    
    return chosen


def update_contextual_score(strategy: str, mood: str, success: bool):
    '''
    Updates the contextual α/β for a strategy given a mood context.
    Called after feedback is received from the user.
    '''
    if not mood:
        return
    
    ctx_key = f"{strategy}|{mood}"
    if success:
        _contextual_scores[ctx_key]["alpha"] += 1
    else:
        _contextual_scores[ctx_key]["beta"] += 1
    
    print(f'[Bandit] Updated context {ctx_key}: α={_contextual_scores[ctx_key]["alpha"]}, β={_contextual_scores[ctx_key]["beta"]}')


def get_contextual_scores() -> dict:
    '''Returns all contextual α/β scores for diagnostics.'''
    return dict(_contextual_scores)


def get_all_scores(db) -> dict:
    '''Returns current success rates and Bayesian parameters for all strategies.'''
    scores = db.query(StrategyScore).all()
    return {
        s.strategy_used: {
            'success_rate':   round(s.success_rate, 4),
            'avg_rating':     round(s.avg_rating, 2),
            'total_attempts': s.total_attempts,
            'total_accepted': s.total_accepted,
            'alpha':          s.total_accepted + 1,
            'beta':           (s.total_attempts - s.total_accepted) + 1
        }
        for s in scores
    }


# ── Quick simulation to verify the algorithm works ───────────────
if __name__ == '__main__':
    print('Simulating 200 contextual strategy selections (no database)...')
    mock_params = {
        'content_based': [81, 21], 
        'mood_based':    [61, 41], 
        'trending':      [56, 46], 
        'hybrid':        [71, 31]
    }

    selections = {'content_based': 0, 'mood_based': 0, 'trending': 0, 'hybrid': 0}
    for i in range(200):
        samples = {name: beta.rvs(p[0], p[1]) for name, p in mock_params.items()}
        chosen = max(samples, key=samples.get)
        selections[chosen] += 1

    print('Selection counts over 200 trials:')
    for s, count in sorted(selections.items(), key=lambda x: -x[1]):
        print(f'  {s:15s}: {count} times ({count/2:.1f}%)')
    print('(content_based should dominate since it has the highest success probability)')
