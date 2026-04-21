import asyncio
import os
from integrations import submit_feedback

async def test_feedback():
    print("--- Testing Feedback Integration (Port 8005) ---")
    
    session_id = "test-session-999"
    product = "Caramel Latte"
    
    # Test 1: Submission
    print(f"Submitting 'Accepted' feedback for {product}...")
    result = await submit_feedback(
        session_id=session_id,
        product_name=product,
        accepted=True,
        rating=5.0,
        notes="Best test coffee ever!",
        mood="Happy",
        weather="Sunny"
    )
    
    print(f"Result Type: {type(result)}")
    print(f"Result Content: {result}")
    
    if isinstance(result, dict) and result.get('success'):
        print("SUCCESS: Feedback service responded correctly.")
    else:
        print(f"FAILED: Feedback submission failed.")
        print(f"Details: {result}")

if __name__ == "__main__":
    asyncio.run(test_feedback())
