import urllib.request
import urllib.error
import json
import time
import sys
import os

# Base URL for the FastAPI server
BASE_URL = "http://127.0.0.1:8000"

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
        print("(e.g., using 'uvicorn main:app --reload' in another terminal)")
        sys.exit(1)

def run_tests():
    print(f"Starting Endpoint Automated Tests.")
    print(f"Targeting server at {BASE_URL}...\n")
    
    # TEST 1: Health Check
    print_separator("Test 1: Health Check (GET /)")
    status, response = make_request("GET", "/")
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 2: Start Session
    print_separator("Test 2: Start Session (POST /session/start)")
    status, response = make_request("POST", "/session/start")
    print(f"Status  : {status}")
    print(f"Response: {response}")
    
    if isinstance(response, dict):
        session_id = response.get("session_id")
    else:
        session_id = None
        
    if not session_id:
        print("ERROR: Failed to retrieve a valid session_id. Cannot proceed.")
        sys.exit(1)

    # TEST 3: Greeting
    print_separator("Test 3: Request Greeting (POST /session/greeting)")
    status, response = make_request("POST", "/session/greeting", data={"session_id": session_id})
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 4: Chat Message 1
    msg = "Hi, I'm looking for a smooth dark roast coffee."
    print_separator(f"Test 4: Send Chat Message (POST /chat)\nMessage : -> '{msg}'")
    status, response = make_request("POST", "/chat", data={"session_id": session_id, "message": msg})
    print(f"Status  : {status}")
    print(f"Response: {response}")
    
    # Brief pause to simulate human interaction
    time.sleep(1)

    # TEST 5: Chat Message 2
    msg = "Can you add the Ember Dark Roast to my cart?"
    print_separator(f"Test 5: Send Follow-up Message (POST /chat)\nMessage : -> '{msg}'")
    status, response = make_request("POST", "/chat", data={"session_id": session_id, "message": msg})
    print(f"Status  : {status}")
    print(f"Response: {response}")

    # TEST 6: End Session
    print_separator("Test 6: End Session (POST /session/end)")
    # Note: The endpoint expects session_id as a query string parameter
    status, response = make_request("POST", "/session/end", params={"session_id": session_id})
    print(f"Status  : {status}")
    print(f"Response: {response}")
    
    print("\nAll Tests Completed Successfully!\n")

if __name__ == "__main__":
    import urllib.parse
    run_tests()
