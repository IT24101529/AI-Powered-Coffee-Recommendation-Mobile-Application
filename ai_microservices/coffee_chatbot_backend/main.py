from fastapi import FastAPI, HTTPException, Request
import logging
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dialogue_manager import handle_message, handle_greeting
from session_store import create_session, get_session, delete_session

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("ChatbotAPI")

app = FastAPI()

# CORS — this allows your React Native phone app to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# Define models
class ChatRequest(BaseModel):
    session_id: str
    message: str

class GreetingRequest(BaseModel):
    session_id: str

# Route 1: Start a new conversation session
@app.post('/session/start')
def start_session():
    session_id = create_session()
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

# Route 3: End the session
@app.post('/session/end')
def end_session(session_id: str):
    delete_session(session_id)
    return {'message': 'Session ended'}

# Route 4: Health check
@app.get('/')
def health_check():
    return {'status': 'Chatbot server is running!'}
