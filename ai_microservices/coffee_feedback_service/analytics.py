from database import FeedbackRecord, StrategyScore
from sqlalchemy import func

def get_strategy_stats(db) -> list:
    '''
    Returns performance statistics for each strategy.
    Displayed in the admin dashboard.
    '''
    scores = db.query(StrategyScore).all()
    return [
        {
            'strategy':       s.strategy_used,
            'attempts':       s.total_attempts,
            'accepted':       s.total_accepted,
            'success_rate':   f'{s.success_rate * 100:.1f}%',
            'avg_rating':     round(s.avg_rating, 2),
            'last_updated':   s.last_updated.isoformat() if s.last_updated else None,
        }
        for s in scores
    ]


def get_overall_stats(db) -> dict:
    '''
    Returns summary statistics across all strategies.
    '''
    total = db.query(FeedbackRecord).count()
    accepted = db.query(FeedbackRecord).filter_by(accepted=True).count()
    rated    = db.query(FeedbackRecord).filter(FeedbackRecord.rating.isnot(None)).count()

    avg_rating_result = db.query(func.avg(FeedbackRecord.rating)).scalar()
    avg_rating = round(float(avg_rating_result), 2) if avg_rating_result else 0.0

    # Find the best performing strategy
    best = db.query(StrategyScore).order_by(StrategyScore.success_rate.desc()).first()

    return {
        'total_feedback_records': total,
        'total_accepted':         accepted,
        'total_rated':            rated,
        'overall_acceptance_rate': f'{(accepted / total * 100):.1f}%' if total > 0 else '0.0%',
        'overall_avg_rating':     avg_rating,
        'best_strategy':          best.strategy_used if best else 'N/A',
        'best_strategy_rate':     f'{best.success_rate * 100:.1f}%' if best else '0.0%',
    }
