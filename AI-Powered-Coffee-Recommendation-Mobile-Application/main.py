# main.py
# This is the entry point of your backend server.
# It creates the API and defines the routes (URLs) the app can call.

from fastapi import FastAPI          # Import FastAPI library
from fastapi.middleware.cors import CORSMiddleware  # Allows React Native to connect
from pydantic import BaseModel       # Used to define the shape of incoming data
from dialogue_manager import handle_message  # Your conversation logic (Step 4)
from session_store import create_session, get_session, delete_session  # Step 5

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

# Route 1: Start a new conversation session
# Called when the user opens the chatbot
@app.post('/session/start')
def start_session():
    session_id = create_session()   # Generate unique ID and store it
    return {'session_id': session_id, 'message': 'Session started'}

# Route 2: Send a message and get a reply
# This is the MAIN route — called every time the user sends a message
@app.post('/chat')
async def chat(request: ChatRequest):
    session = get_session(request.session_id)   # Load this user's history
    if not session:
        return {'error': 'Session not found. Please start a new session.'}
    response = await handle_message(request.message, request.session_id)
    return response

# Route 3: End the session (user closes the chat)
@app.post('/session/end')
def end_session(session_id: str):
    delete_session(session_id)
    return {'message': 'Session ended'}

# Route 4: Health check — just confirms the server is running
@app.get('/')
def health_check():
    return {'status': 'Chatbot server is running!'}
