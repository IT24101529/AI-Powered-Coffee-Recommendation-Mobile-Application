import asyncio
from dialogue_manager import handle_message
from session_store import create_session, update_session

async def test_cart_schema_alignment():
    print("--- Testing Cart Schema Alignment (Main API Format) ---")
    session_id = create_session()
    
    # Simulate a recommendation was made
    product_name = "Cappuccino"
    update_session(session_id, {'last_recommendation': product_name, 'state': 'CONFIRM'})
    
    print(f"User says 'Yes, order it!' for {product_name}...")
    result = await handle_message("Yes, order it!", session_id)
    
    product = result.get('product')
    print(f"Reply: {result.get('reply')}")
    
    if product:
        print(f"SUCCESS: Product details found in response!")
        print(f"Details: {product}")
        
        # Check Main API fields
        checks = {
            '_id': product.get('_id'),
            'productName': product.get('productName'),
            'productImageUrl': product.get('productImageUrl'),
            'price': product.get('price')
        }
        
        failed = [k for k, v in checks.items() if not v]
        if not failed:
            print("VERIFIED: All Main API schema fields (_id, productName, productImageUrl, price) are present!")
        else:
            print(f"FAILED: Missing fields in response: {failed}")
            
        if result.get('isFeedback'):
            print("VERIFIED: isFeedback flag is present to trigger inline Feedback Card.")
        else:
            print("FAILED: isFeedback flag is missing.")
            
        if not result.get('quick_replies'):
            print("VERIFIED: Quick replies were removed as requested.")
        else:
            print("FAILED: Quick replies are still present.")
    else:
        print("FAILED: No product object in response.")

if __name__ == "__main__":
    asyncio.run(test_cart_schema_alignment())
