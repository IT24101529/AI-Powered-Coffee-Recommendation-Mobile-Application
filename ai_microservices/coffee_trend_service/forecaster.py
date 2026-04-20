# DEPRECATED: Forecaster logic replaced by Velocity Score in trend_engine.py
# The ML GradientBoostingRegressor was underperforming (R-squared = -25.4) 
# and has been replaced by a more stable and reliable 'Sales Velocity' ratio.

def predict_next_sales(history):
    '''
    Fallback shim for any legacy calls. 
    Returns the last known value (Persistence model).
    '''
    return history[-1] if history else 0
