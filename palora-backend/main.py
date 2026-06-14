import os
from dotenv import load_dotenv
load_dotenv()
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, companion, chat, memory, anonymous_chat
from services.event_worker import start_event_worker
import threading
import uvicorn
from routes import voice_chat

app = FastAPI(title="Palora Backend", description="FastAPI Backend for Palora Companion Project")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_chat.router, prefix="/voice-chat")
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(companion.router, prefix="/companions", tags=["Companions"])
app.include_router(chat.router, prefix="/chat")
app.include_router(memory.router, prefix="/memories", tags=["Memories"])
app.include_router(anonymous_chat.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Palora API"}

@app.on_event("startup")
def start_background_worker():
    threading.Thread(target=start_event_worker, daemon=True).start()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)