import os, httpx
from datetime import datetime, timedelta
from dotenv import load_dotenv
from database import WeatherCache

load_dotenv()
API_KEY      = os.getenv('OPENWEATHER_API_KEY')
CACHE_MINUTES= int(os.getenv('CACHE_TTL_MINUTES', 5))
BASE_URL     = 'https://api.openweathermap.org/data/2.5/weather'

if not API_KEY:
    raise ValueError('OPENWEATHER_API_KEY not found in .env file!')


def get_weather(db, location: str) -> dict:
    '''
    Main function. Returns weather data for the given location.
    Checks cache first, calls API only if necessary.

    Args:
        db:       SQLAlchemy database session
        location: location string, e.g. 'Kandy,LK' or 'Colombo,LK'

    Returns dict with keys:
        temperature_celsius, condition, humidity_percent,
        wind_speed_ms, raw_description, from_cache (bool)
    '''
    # ── Step A: Check if a valid cache entry exists ─────────────
    now = datetime.utcnow()
    cached = db.query(WeatherCache).filter(
        WeatherCache.location == location,
        WeatherCache.expires_at > now      # Only return if NOT expired
    ).order_by(WeatherCache.fetched_at.desc()).first()

    if cached:
        print(f'[WeatherFetcher] Cache HIT for {location}. Expires at {cached.expires_at}')
        return {
            'temperature_celsius': cached.temperature_celsius,
            'condition':           cached.condition,
            'humidity_percent':    cached.humidity_percent,
            'wind_speed_ms':       cached.wind_speed_ms,
            'raw_description':     cached.raw_description,
            'from_cache':          True,
            'cache_id':            cached.id,
        }

    # ── Step B: Cache MISS — call the API ───────────────────────
    print(f'[WeatherFetcher] Cache MISS for {location}. Calling OpenWeatherMap API...')
    return _call_api_and_cache(db, location)


def _call_api_and_cache(db, location: str) -> dict:
    '''Makes the live API call and saves the result to the cache.'''
    params = {
        'q':     location,   # e.g. 'Kandy,LK'
        'appid': API_KEY,
        'units': 'metric',   # Returns temperature in Celsius
    }

    try:
        # Make the HTTP GET request to OpenWeatherMap
        # timeout=10 means: if no response in 10 seconds, raise an error
        response = httpx.get(BASE_URL, params=params, timeout=10)
        response.raise_for_status()   # Raises an error if HTTP status is 4xx or 5xx
        data = response.json()

        # Parse the API response
        # OpenWeatherMap returns a nested JSON — we extract what we need
        temperature  = data['main']['temp']                  # e.g. 17.4
        condition    = data['weather'][0]['main']            # e.g. 'Rain'
        description  = data['weather'][0]['description']     # e.g. 'light rain'
        humidity     = data['main']['humidity']              # e.g. 85
        wind_speed   = data['wind']['speed']                 # e.g. 3.2

        print(f'[WeatherFetcher] API response: {temperature}°C, {condition}, humidity={humidity}%')

        # Save to cache
        now        = datetime.utcnow()
        expires_at = now + timedelta(minutes=CACHE_MINUTES)
        cache_entry = WeatherCache(
            location            = location,
            temperature_celsius = temperature,
            condition           = condition,
            humidity_percent    = humidity,
            wind_speed_ms       = wind_speed,
            raw_description     = description,
            fetched_at          = now,
            expires_at          = expires_at,
        )
        db.add(cache_entry)
        db.commit()
        db.refresh(cache_entry)

        print(f'[WeatherFetcher] Cached. Expires at {expires_at}.')
        return {
            'temperature_celsius': temperature,
            'condition':           condition,
            'humidity_percent':    humidity,
            'wind_speed_ms':       wind_speed,
            'raw_description':     description,
            'from_cache':          False,
            'cache_id':            cache_entry.id,
        }

    except httpx.TimeoutException:
        print('[WeatherFetcher] ERROR: API call timed out. Using fallback.')
        return _fallback_weather(db, location)

    except httpx.HTTPStatusError as e:
        print(f'[WeatherFetcher] ERROR: API returned {e.response.status_code}.')
        if e.response.status_code == 401:
            print('  → Check your OPENWEATHER_API_KEY in .env file!')
        elif e.response.status_code == 404:
            print(f'  → Location not found: {location}. Try format: CityName,CountryCode')
        return _fallback_weather(db, location)

    except Exception as e:
        print(f'[WeatherFetcher] Unexpected error: {e}')
        return _fallback_weather(db, location)


def _fallback_weather(db, location: str) -> dict:
    '''
    Returns safe fallback data when the API is unavailable.
    Also checks if there is any cached entry (even expired) to use.
    '''
    # Try to use an expired cache entry as a last resort
    last_known = db.query(WeatherCache).filter(
        WeatherCache.location == location
    ).order_by(WeatherCache.fetched_at.desc()).first()

    if last_known:
        print(f'[WeatherFetcher] Using expired cache entry as fallback.')
        return {
            'temperature_celsius': last_known.temperature_celsius,
            'condition':           last_known.condition,
            'humidity_percent':    last_known.humidity_percent,
            'wind_speed_ms':       last_known.wind_speed_ms,
            'raw_description':     last_known.raw_description,
            'from_cache':          True,
            'cache_id':            last_known.id,
            'is_fallback':         True,
        }

    # Absolute last resort — hard-coded neutral values
    print('[WeatherFetcher] No cache available. Using neutral fallback values.')
    return {
        'temperature_celsius': 25.0,   # Warm
        'condition':           'Clear',
        'humidity_percent':    60,
        'wind_speed_ms':       2.0,
        'raw_description':     'fallback - no data',
        'from_cache':          False,
        'cache_id':            None,
        'is_fallback':         True,
    }


# ── Test this file directly ─────────────────────────────────────
if __name__ == '__main__':
    from database import SessionLocal
    db = SessionLocal()
    result = get_weather(db, 'Kandy,LK')
    print('\nWeather result:')
    for k, v in result.items():
        print(f'  {k}: {v}')
    db.close()