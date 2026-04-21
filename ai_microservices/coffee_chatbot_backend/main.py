from fastapi import FastAPI, HTTPException, Request  # Added Request and HTTPException
import logging                                       # Added logging
from fastapi.middleware.cors import CORSMiddleware  # Allows React Native to connect
from pydantic import BaseModel       # Used to define the shape of incoming data
from dialogue_manager import handle_message, handle_greeting  # Your conversation logic (Step 4)
from session_store import create_session, get_session, delete_session  # Step 5

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("ChatbotAPI")

app = FastAPI()  # Create the app

# CORS — this allows your React Native phone app to talk to this server
# Without this, the app will get a 'blocked' error
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],   # Allow any device (change this in production)
    allow_methods=['*'],
    allow_headers=['*'],
)

# Define what a chat message looks like when it arrives
class ChatRequest(BaseModel):
    session_id: str   # Unique ID for this user's conversation
    message: str      # What the user typed

class GreetingRequest(BaseModel):
    session_id: str

# Route 1: Start a new conversation session
# Called when the user opens the chatbot
@app.post('/session/start')
def start_session():
    session_id = create_session()   # Generate unique ID and store it
    return {'session_id': session_id, 'message': 'Session started'}

# Route 2: Send a message and get a reply
@app.post('/chat')
async def chat(request: ChatRequest):
    logger.info(f"Incoming chat request: Session={request.session_id}, Msg='{request.message}'")
    session = get_session(request.session_id)
    if not session:
        logger.warning(f"Session not found: {request.session_id}")
        return {'error': 'Session not found. Please start a new session.'}
    
    try:
        response = await handle_message(request.message, request.session_id)
        logger.info(f"Chat response generated for session {request.session_id}")
        return response
    except Exception as e:
        logger.error(f"Error in handle_message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# Route 2B: Auto-greeting
@app.post('/session/greeting')
async def session_greeting(request: GreetingRequest):
    logger.info(f"Incoming greeting request: Session={request.session_id}")
    session = get_session(request.session_id)
    if not session:
        logger.warning(f"Session not found for greeting: {request.session_id}")
        return {'error': 'Session not found. Please start a new session.'}
    
    try:
        response = await handle_greeting(request.session_id, session)
        logger.info(f"Greeting response generated for session {request.session_id}")
        return response
    except Exception as e:
        logger.error(f"Error in handle_greeting: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# Route 3: End the session (user closes the chat)
@app.post('/session/end')
def end_session(session_id: str):
    delete_session(session_id)
    return {'message': 'Session ended'}

# Route 4: Health check — just confirms the server is running
@app.get('/')
def health_check():
    return {'status': 'Chatbot server is running!'}
