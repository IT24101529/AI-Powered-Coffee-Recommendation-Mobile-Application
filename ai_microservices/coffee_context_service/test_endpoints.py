import urllib.request
import urllib.error
import urllib.parse
import json
import time
import sys
import os

BASE_URL = "http://127.0.0.1:8002"

def print_separator(title: str):
    print(f"\n{'-'*60}")
    print(f" {title}")
    print(f"{'-'*60}")

def make_request(method, endpoint, data=None, params=None):
    url = f"{BASE_URL}{endpoint}"
    if params:
        query_string = urllib.parse.urlencode(params)
        url = f"{url}?{query_string}"
    headers = {'Content-Type': 'application/json'}
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.status
            body = response.read().decode('utf-8')
            try:
                parsed_body = json.loads(body)
            except json.JSONDecodeError:
                parsed_body = body
            return status, parsed_body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            parsed_body = json.loads(body)
        except json.JSONDecodeError:
            parsed_body = body
        return e.code, parsed_body
    except urllib.error.URLError as e:
        print(f"ERROR: Cannot connect to {BASE_URL}.")
        print("Make sure your FastAPI server is currently running.")
        sys.exit(1)

def run_tests():
    print(f"Starting Endpoint Automated Tests.")
    print(f"Targeting server at {BASE_URL}...\n")
    
    # TEST 1: Health Check
    print_separator("Test 1: Health Check (GET /)")
    status, response = make_request("GET", "/")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 2: Weather Context
    print_separator("Test 2: Weather Context (GET /context/weather)")
    status, response = make_request("GET", "/context/weather")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 3: Time Context
    print_separator("Test 3: Time Context (GET /context/time)")
    status, response = make_request("GET", "/context/time")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 4: All Context
    print_separator("Test 4: All Context (GET /context/all)")
    status, response = make_request("GET", "/context/all")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 5: Context Override
    print_separator("Test 5: Context Override (POST /context/override)")
    payload = {"session_id": "test_session_123", "weather": "Rainy", "time_of_day": "Evening"}
    status, response = make_request("POST", "/context/override", data=payload)
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 6: Get Session Context
    print_separator("Test 6: Get Session Context (GET /context/session/test_session_123)")
    status, response = make_request("GET", "/context/session/test_session_123")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 7: Delete Context Override
    print_separator("Test 7: Delete Context Override (DELETE /context/override/test_session_123)")
    status, response = make_request("DELETE", "/context/override/test_session_123")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    print("\nAll Tests Completed Successfully!\n")

if __name__ == "__main__":
    run_tests()
