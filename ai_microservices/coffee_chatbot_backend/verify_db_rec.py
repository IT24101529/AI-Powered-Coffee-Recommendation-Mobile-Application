import httpx
import asyncio
import json

async def test_integration():
    print("Testing end-to-end recommendation chain...")
    
    # 1. Test Chatbot API Root
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get("http://localhost:8000/")
            print(f"Chatbot Root Status: {resp.status_code}")
    except Exception as e:
        print(f"Chatbot Root Error: {e}")

    # 2. Test Recommendation Flow
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Step 0: Start Session
            print("\nStep 0: Starting Session...")
            resp = await client.post("http://localhost:8000/session/start")
            session_id = resp.json().get('session_id')
            if not session_id:
                print("Failed to get session_id")
                return
            print(f"Session ID: {session_id}")

            # Step 1: Greeting
            print("\nStep 1: Sending Greeting...")
            # Note: greeting is usually handled via /session/greeting but /chat 'hi' works too inside a session
            resp = await client.post(
                "http://localhost:8000/chat",
                json={"message": "Hi", "session_id": session_id}
            )
            data = resp.json()
            if 'error' in data:
                print(f"Error: {data['error']}")
                return
            print(f"Greeting Response: {data.get('reply')[:100]}...")

            # Step 2: Provide Mood (triggers recommendation flow)
            print("\nStep 2: Sending Mood (Tired)...")
            resp = await client.post(
                "http://localhost:8000/chat",
                json={"message": "I am feeling very tired", "session_id": session_id}
            )
            data = resp.json()
            print(f"Mood Response: {data.get('reply')}")
            
            # Step 3: Answer Health Health (triggers recommendation flow)
            print("\nStep 3: Answering Health (No)...")
            resp = await client.post(
                "http://localhost:8000/chat",
                json={"message": "No", "session_id": session_id}
            )
            data = resp.json()
            print(f"Health Response: {data.get('reply')}")

            # Step 4: Temperature Preference (triggers recommendation)
            print("\nStep 4: Sending Temp Pref (Hot)...")
            resp = await client.post(
                "http://localhost:8000/chat",
                json={"message": "Hot", "session_id": session_id}
            )
            data = resp.json()
            reply = data.get('reply', '')
            print(f"Final Recommendation: {reply}")
            
            # Verification: Check if common database products are mentioned
            # Database products: "Pistachio-Rose Velvet Latte", "Classic Double Espresso", "Cafe Americano"
            # Mock products: "Double Espresso", "Americano", "Caramel Latte"
            
            db_products = ["Pistachio-Rose", "Classic Double", "Cafe Americano", "Nitro Brew", "Flat White"]
            found_db = any(p.lower() in reply.lower() for p in db_products)
            
            if found_db:
                print("\nSUCCESS: Recommendation contains database-specific product names!")
            else:
                print("\nFAILURE: Recommendation might still be using mocks or generic names.")
                
    except Exception as e:
        print(f"Integration Test Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_integration())
