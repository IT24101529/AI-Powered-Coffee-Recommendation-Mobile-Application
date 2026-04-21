import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

async def test():
    api_key = os.getenv('GEMINI_API_KEY')
    print(f"Testing with key: {api_key[:10]}...")
    client = genai.Client(api_key=api_key)
    
    try:
        # Testing simple prompt
        print("Sending request to gemini-2.5-flash...")
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents='Say "Hello from 2026!"'
        )
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
