from datetime import datetime, timezone, timedelta

# Sri Lanka Standard Time = UTC + 5 hours 30 minutes
SRI_LANKA_TZ = timezone(timedelta(hours=5, minutes=30))

# Time boundaries (24-hour format)
# These match exactly what is specified in the PRD
TIME_BOUNDARIES = {
    'Morning':    (6,  12),   # 06:00 – 11:59
    'Afternoon':  (12, 17),   # 12:00 – 16:59
    'Evening':    (17, 21),   # 17:00 – 20:59
    'Night':      (21, 24),   # 21:00 – 23:59
    'Late Night': (0,   6),   # 00:00 – 05:59
}

def get_current_hour_slt() -> int:
    '''Returns the current hour (0-23) in Sri Lanka Standard Time.'''
    now_slt = datetime.now(SRI_LANKA_TZ)
    return now_slt.hour

def get_time_of_day(hour: int = None) -> str:
    '''
    Returns the time-of-day category for the given hour.
    If no hour is provided, uses the current SLT hour.

    Returns one of: Morning, Afternoon, Evening, Night, Late Night
    '''
    if hour is None:
        hour = get_current_hour_slt()

    # Check each time window
    for label, (start, end) in TIME_BOUNDARIES.items():
        if start < end:            # Normal window (e.g. 6 to 12)
            if start <= hour < end:
                return label
        else:                      # Wrap-around window (Late Night: 0 to 6 OR midnight wrap)
            if hour >= start or hour < end:
                return label

    return 'Afternoon'   # Default fallback (should never reach here)


def get_hour_fraction() -> float:
    '''
    Returns the current time as a fraction of 24 hours (0.0 to 1.0).
    Used by the Fuzzy Logic system in Step 8 as a continuous input variable.
    Example: 08:30 → 8.5 / 24 = 0.354
    '''
    now = datetime.now(SRI_LANKA_TZ)
    return (now.hour + now.minute / 60) / 24


def get_full_time_context() -> dict:
    '''
    Returns a complete time context dict for use in the main pipeline.
    '''
    hour         = get_current_hour_slt()
    time_of_day  = get_time_of_day(hour)
    hour_fraction= get_hour_fraction()

    return {
        'hour':          hour,
        'time_of_day':   time_of_day,
        'hour_fraction': round(hour_fraction, 4),
    }


# ── Test directly ────────────────────────────────────────────────
if __name__ == '__main__':
    print('Current time context:')
    ctx = get_full_time_context()
    for k, v in ctx.items():
        print(f'  {k}: {v}')

    print('\nAll time boundary tests:')
    test_hours = [0, 3, 6, 9, 12, 15, 17, 20, 21, 23]
    for h in test_hours:
        print(f'  Hour {h:02d}:00 → {get_time_of_day(h)}')