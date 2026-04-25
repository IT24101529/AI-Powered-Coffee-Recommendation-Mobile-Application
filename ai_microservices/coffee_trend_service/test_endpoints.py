import urllib.request
import urllib.error
import urllib.parse
import json
import time
import sys
import os

BASE_URL = "http://127.0.0.1:8004"

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

    # TEST 2: Log Sales
    print_separator("Test 2: Log Sales (POST /sales/log)")
    payload = {"session_id": "test_session_123", "product_name": "Ember Dark Roast", "product_id": "prod_001", "quantity": 1}
    status, response = make_request("POST", "/sales/log", data=payload)
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 3: Popular Trends
    print_separator("Test 3: Popular Trends (GET /trends/popular)")
    status, response = make_request("GET", "/trends/popular")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 4: Tier Trends
    print_separator("Test 4: Tier Trends (GET /trends/tier/premium)")
    status, response = make_request("GET", "/trends/tier/premium")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 5: Trend Pairs
    print_separator("Test 5: Trend Pairs (GET /trends/pairs)")
    status, response = make_request("GET", "/trends/pairs")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 6: Recalculate Trends
    print_separator("Test 6: Recalculate Trends (POST /trends/recalculate)")
    status, response = make_request("POST", "/trends/recalculate")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 7: Recent Sales
    print_separator("Test 7: Recent Sales (GET /sales/recent)")
    status, response = make_request("GET", "/sales/recent")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    print("\nAll Tests Completed Successfully!\n")

if __name__ == "__main__":
    run_tests()
