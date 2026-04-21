import asyncio
import os
import sys
from dialogue_manager import handle_message

async def verify_response(session_id, message, description):
    print(f"\n--- Testing: {description} ---")
    print(f"Input: {message}")
    
    result = await handle_message(message, session_id)
    reply = result.get('reply', '')
    
    print(f"Reply: {reply}")
    
    filler_words = ['Okay', 'Certainly', 'I see', 'Here are a few', 'Here is the analysis', 'Here are some']
    found_filler = [w for w in filler_words if reply.startswith(w) or f" {w}" in reply]
    
    if found_filler:
        print(f"FAILED: Found filler words: {found_filler}")
    else:
        print("PASSED: No blatant filler detected.")
    
    return result

async def main():
    # Ensure LLM is enabled for testing if key exists
    if not os.getenv('GEMINI_API_KEY'):
        print("WARNING: GEMINI_API_KEY not found. Test might use fallbacks.")
    
    from session_store import create_session
    session_id = create_session()
    
    # Test 1: Initial Greeting
    await verify_response(session_id, "Hi", "Initial Greeting")
    
    # Test 2: Greeting during Gathering
    await verify_response(session_id, "Hello", "Greeting during GATHERING")
    
    # Test 3: Sugar Question (Deterministic Fallback)
    await verify_response(session_id, "Is the Espresso high in sugar?", "Product attribute question")
    
    # Test 4: Complex Prompt (Agentic Reasoning)
    await verify_response(session_id, "I'm really tired and it's cold outside, what should I drink?", "Complex Agentic Reasoning")

if __name__ == "__main__":
    asyncio.run(main())
