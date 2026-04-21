import asyncio
import os
from dialogue_manager import handle_message, build_recommendation
from session_store import create_session, update_session

async def verify():
    session_id = create_session()
    
    print("--- Verifying Suggestion Quick Replies ---")
    update_session(session_id, {'state': 'GATHERING', 'step': 'ask_temp', 'mood': 'Happy'})
    # Simulate answering 'Hot' to trigger recommendation
    res = await handle_message("Hot", session_id)
    
    replies = res.get('quick_replies', [])
    print(f"Quick Replies: {replies}")
    if 'Rate this recommendation' in replies:
        print("SUCCESS: 'Rate this recommendation' button found.")
    else:
        print("FAILURE: 'Rate this recommendation' button missing.")

    print("\n--- Verifying Feedback Signal ---")
    # Simulate clicking 'Rate this recommendation'
    res_f = await handle_message("Rate this recommendation", session_id)
    
    print(f"isFeedback: {res_f.get('isFeedback')}")
    print(f"State: {res_f.get('state')}")
    
    if res_f.get('isFeedback') is True and res_f.get('state') == 'FEEDBACK':
        print("SUCCESS: Feedback widget signal triggered correctly.")
    else:
        print("FAILURE: Feedback signal or state incorrect.")

if __name__ == "__main__":
    asyncio.run(verify())
