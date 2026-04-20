from trend_engine import calculate_growth_rate, normalise, classify_tier

def test_growth_rate_positive():
    rate = calculate_growth_rate(current=100, previous=70)
    assert round(rate, 2) == 0.43, f'Expected ~0.43, got {rate}'

def test_growth_rate_no_previous():
    rate = calculate_growth_rate(current=50, previous=0)
    assert rate == 1.0, 'New product with sales should return 1.0 growth'

def test_growth_rate_decline():
    rate = calculate_growth_rate(current=30, previous=100)
    assert rate < 0, 'Declining sales should produce negative growth rate'

def test_normalise_midpoint():
    result = normalise(50, 0, 100)
    assert result == 0.5, f'Expected 0.5, got {result}'

def test_normalise_clamps_to_0_and_1():
    assert normalise(200, 0, 100) == 1.0   # Over max → clamp to 1.0
    assert normalise(-50, 0, 100) == 0.0   # Under min → clamp to 0.0

def test_bestseller_classification():
    all_sales = [5, 10, 15, 20, 100, 150, 200]  # 200 is clearly top 10%
    tier = classify_tier(sales_24h=200, growth_rate=0.1, all_sales=all_sales)
    assert tier == 'Bestseller', f'Expected Bestseller, got {tier}'

def test_trending_up_classification():
    all_sales = [10, 20, 30, 40, 50]
    tier = classify_tier(sales_24h=20, growth_rate=0.45, all_sales=all_sales)
    assert tier == 'Trending Up', f'Expected Trending Up, got {tier}'

print('All trend engine tests passed!')
