<<<<<<< HEAD
from database import FeedbackRecord, StrategyScore, FeedbackSession
=======
from database import FeedbackRecord, StrategyScore
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
from datetime import datetime

def save_feedback(db, data: dict) -> int:
    '''
    Saves a feedback record and updates the relevant strategy score.
    Called every time a user accepts, rejects, or rates a recommendation.
    '''
<<<<<<< HEAD
    # Step 0: Ensure session exists in the feedback DB (Lazy creation)
    session_row = db.query(FeedbackSession).filter_by(session_id=data['session_id']).first()
    if not session_row:
        session_row = FeedbackSession(session_id=data['session_id'])
        db.add(session_row)
        db.flush()

=======
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
    # Step 1: Save the raw feedback record
    record = FeedbackRecord(
        session_id      = data['session_id'],
        product_name    = data['product_name'],
        strategy_used   = data['strategy_used'],
        rating          = data.get('rating'),
        accepted        = data['accepted'],
        user_mood       = data.get('user_mood', 'Calm'),
        weather_context = data.get('weather_context', 'Warm'),
        notes           = data.get('notes'),
    )
    db.add(record)
    db.flush()   # Get the auto-generated ID

    # Step 2: Update the strategy score for the strategy that was used
<<<<<<< HEAD
    try:
        strategy_name = data['strategy_used']
        score_row = db.query(StrategyScore).filter_by(strategy_used=strategy_name).first()

        if score_row:
            score_row.total_attempts += 1

            # Update acceptance count
            if data['accepted']:
                score_row.total_accepted += 1

            # Update rating sum
            if data.get('rating') is not None:
                score_row.total_rating += data['rating']

            # Recalculate success rate and average rating
            score_row.success_rate = round(score_row.total_accepted / score_row.total_attempts, 4)

            rating_count = db.query(FeedbackRecord).filter(
                FeedbackRecord.strategy_used == strategy_name,
                FeedbackRecord.rating.isnot(None)
            ).count()

            if rating_count > 0:
                score_row.avg_rating = round(score_row.total_rating / rating_count, 2)

            score_row.last_updated = datetime.utcnow()
    except Exception as se:
        print(f"[Feedback] Warning: Failed to update strategy scores: {se}")
=======
    strategy_name = data['strategy_used']
    score_row = db.query(StrategyScore).filter_by(strategy_used=strategy_name).first()

    if score_row:
        score_row.total_attempts += 1

        # Update acceptance count
        if data['accepted']:
            score_row.total_accepted += 1

        # Update rating sum
        if data.get('rating') is not None:
            score_row.total_rating += data['rating']

        # Recalculate success rate and average rating
        score_row.success_rate = round(score_row.total_accepted / score_row.total_attempts, 4)

        rating_count = db.query(FeedbackRecord).filter(
            FeedbackRecord.strategy_used == strategy_name,
            FeedbackRecord.rating.isnot(None)
        ).count()

        if rating_count > 0:
            score_row.avg_rating = round(score_row.total_rating / rating_count, 2)

        score_row.last_updated = datetime.utcnow()
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b

    db.commit()
    print(f'[Feedback] Saved: {strategy_name} | Accepted: {data["accepted"]} | Rating: {data.get("rating")}')
    return record.id


def get_all_feedback(db) -> list:
    records = db.query(FeedbackRecord).order_by(FeedbackRecord.timestamp.desc()).limit(100).all()
    return [
        {
            'id':             r.id,
            'product_name':   r.product_name,
            'strategy_used':  r.strategy_used,
            'accepted':       r.accepted,
            'rating':         r.rating,
            'user_mood':      r.user_mood,
            'timestamp':      r.timestamp.isoformat() if r.timestamp else None,
        }
        for r in records
    ]
