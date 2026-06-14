from datetime import datetime
import time
from database import get_db
from services.ai_service import generate_ai_response

def start_event_worker():

    db = get_db()

    while True:

        now = datetime.utcnow()

        events = db.events.find({
            "event_time": {"$lte": now},
            "triggered": False
        })

        for event in events:

            companion = db.companions.find_one({"_id": event["companion_id"]})

            prompt = f"""
                You are the user's personal AI companion.

                An important event has occurred:

                Event: {event['event_type']}

                Respond naturally based on context.
                Be human-like and emotionally aware.
                """

            ai_message = generate_ai_response(prompt)

            db.chats.update_one(
                {"companion_id": event["companion_id"]},
                {
                    "$push": {
                        "messages": {
                            "role": "assistant",
                            "content": ai_message,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )

            db.events.update_one(
                {"_id": event["_id"]},
                {"$set": {"triggered": True}}
            )

        time.sleep(30)