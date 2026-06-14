from fastapi import APIRouter
from pydantic import BaseModel
from services.emotion_model_service import predict_emotion
from services.ai_service import generate_ai_response

router = APIRouter()

conversation_history = []

class AnonymousMessage(BaseModel):
    message: str


@router.post("/anonymous-chat")
def anonymous_chat(data: AnonymousMessage):

    global conversation_history

    # Detect emotion
    emotion = predict_emotion(data.message)

    # Add user message to history
    conversation_history.append(f"User: {data.message}")

    # Keep only last 6 messages
    conversation_history = conversation_history[-6:]

    history_text = "\n".join(conversation_history)

    prompt = f"""
You are a friendly AI companion chatting with a user anonymously.

User's detected emotion: {emotion}

Conversation so far:
{history_text}

Respond naturally according to the user's emotion.
"""

    ai_reply = generate_ai_response(prompt)

    # Save AI response in memory
    conversation_history.append(f"AI: {ai_reply}")

    return {
        "emotion": emotion,
        "response": ai_reply
    }