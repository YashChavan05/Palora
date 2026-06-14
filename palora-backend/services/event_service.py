from datetime import datetime, timedelta
import json
import re
from services.ai_service import generate_ai_response

def extract_event(message):

    prompt = f"""
Extract event details from the message.

Message: "{message}"

Return ONLY JSON. No explanation.

Format:
{{
  "event_type": "...",
  "event_time_in_minutes": number,
  "message": "..."
}}

If no event, return null.
"""

    try:
        response = generate_ai_response(prompt)

        print("AI RESPONSE >>>", response)

        # 🔥 Extract JSON using regex
        json_match = re.search(r'\{.*\}', response, re.DOTALL)

        if not json_match:
            return None

        json_str = json_match.group()

        data = json.loads(json_str)

        if not data:
            return None

        event_time = datetime.utcnow() + timedelta(
            minutes=int(data["event_time_in_minutes"])
        )

        return {
            "event_type": data["event_type"],
            "event_time": event_time,
            "message": data["message"]
        }

    except Exception as e:
        print("EVENT ERROR:", e)
        return None