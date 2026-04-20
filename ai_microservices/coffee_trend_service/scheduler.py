from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from trend_engine import calculate_all_trends

scheduler = BackgroundScheduler()

def scheduled_recalculate():
    '''This function runs automatically every hour.'''
    print('[Scheduler] Running scheduled trend recalculation...')
    db = SessionLocal()
    try:
        count = calculate_all_trends(db)
        print(f'[Scheduler] Done. Updated {count} products.')
    finally:
        db.close()

def start_scheduler():
    # Run every 60 minutes
    scheduler.add_job(scheduled_recalculate, 'interval', minutes=60)
    scheduler.start()
    print('[Scheduler] Trend recalculation scheduled every 60 minutes.')

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
