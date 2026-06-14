from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models.schemas import Chat, ChatCreate, ChatMessage
from routes.auth import get_current_user
from services.ai_service import generate_ai_response_stream, text_to_speech
from services.memory_service import extract_memory
from services.event_service import extract_event
from fastapi.responses import StreamingResponse

import io
import uuid
from datetime import datetime
from typing import List

router = APIRouter()


# Create a new chat session
@router.post("/", response_model=Chat)
def create_chat(chat: ChatCreate, current_user=Depends(get_current_user), db=Depends(get_db)):

    companion = db.companions.find_one({
        "_id": chat.companion_id,
        "user_id": current_user["_id"]
    })

    if not companion:
        raise HTTPException(status_code=404, detail="Companion not found")

    chat_dict = chat.model_dump()
    chat_dict["_id"] = str(uuid.uuid4())
    chat_dict["user_id"] = current_user["_id"]
    chat_dict["messages"] = []
    chat_dict["created_at"] = datetime.utcnow()
    chat_dict["updated_at"] = datetime.utcnow()

    db.chats.insert_one(chat_dict)

    return chat_dict


# Get all chats
@router.get("/", response_model=List[Chat])
def get_chats(current_user=Depends(get_current_user), db=Depends(get_db)):
    return list(db.chats.find({"user_id": current_user["_id"]}))


# Get single chat
@router.get("/{chat_id}", response_model=Chat)
def get_chat(chat_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):

    chat = db.chats.find_one({
        "_id": chat_id,
        "user_id": current_user["_id"]
    })

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return chat


# Send message + stream AI response
@router.post("/{chat_id}/message")
def add_message(chat_id: str, message: ChatMessage, current_user=Depends(get_current_user), db=Depends(get_db)):

    chat = db.chats.find_one({
        "_id": chat_id,
        "user_id": current_user["_id"]
    })

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    history = chat.get("messages", [])[-6:]
    conversation = ""

    for msg in history:
        conversation += f"{msg['role']}: {msg['content']}\n"

    # Save user message
    user_message = {
        "role": "user",
        "content": message.content,
        "timestamp": datetime.utcnow()
    }

    db.chats.update_one(
        {"_id": chat_id},
        {"$push": {"messages": user_message}}
    )

    # MEMORY
    memory = extract_memory(message.content)

    if memory:
        existing_memory = db.memories.find_one({
            "user_id": current_user["_id"],
            "companion_id": chat["companion_id"],
            "content": memory
        })

        if not existing_memory:
            db.memories.insert_one({
                "user_id": current_user["_id"],
                "companion_id": chat["companion_id"],
                "content": memory,
                "created_at": datetime.utcnow()
            })

    # EVENT
    event = extract_event(message.content)
    print(event)

    if event:
        db.events.insert_one({
            "user_id": current_user["_id"],
            "companion_id": chat["companion_id"],
            "event_type": event["event_type"],
            "event_time": event["event_time"],
            "message": event["message"],
            "triggered": False
        })

    # COMPANION DATA
    companion = db.companions.find_one({"_id": chat["companion_id"]})

    name = companion.get("name", "Friend")
    relationship = companion.get("relationship", "best friend")
    personality = companion.get("personality", "funny and supportive")
    memories = companion.get("memories", [])

    memory_text = "\n".join(memories)

    prompt = f"""
    You are {name}.

    You are the user's {relationship}.
    Your personality is: {personality}.

    Shared memories:
    {memory_text}

    Conversation history:
    {conversation}

    Rules:
    - Speak casually
    - Be emotional
    - Be human-like

    User:
    {message.content}

    Reply as {name}.
    """

    # STREAMING FUNCTION
    def stream_ai():
        full_reply = ""

        for chunk in generate_ai_response_stream(prompt):
            full_reply += chunk
            yield chunk

        # Save AI message after streaming
        ai_message = {
            "role": "assistant",
            "content": full_reply,
            "timestamp": datetime.utcnow()
        }

        db.chats.update_one(
            {"_id": chat_id},
            {"$push": {"messages": ai_message}}
        )

    return StreamingResponse(stream_ai(), media_type="text/plain")


# 🔥 VOICE ENDPOINT (SEPARATE — IMPORTANT)
@router.get("/{chat_id}/voice")
def get_voice(chat_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):

    chat = db.chats.find_one({
        "_id": chat_id,
        "user_id": current_user["_id"]
    })

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    companion = db.companions.find_one({"_id": chat["companion_id"]})

    voice_id = companion.get("voice_id", "EXAVITQu4vr4xnSDxMaL")

    if not chat.get("messages"):
        raise HTTPException(status_code=400, detail="No messages yet")

    last_message = chat["messages"][-1]["content"]

    audio_bytes = text_to_speech(last_message, voice_id)

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg"
    )