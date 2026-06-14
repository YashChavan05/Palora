from services.ai_service import generate_ai_response

def extract_memory(message):

    prompt = f"""
Determine if the following message contains an important personal fact.

Examples of facts:
- birthday
- hobbies
- important events
- preferences

If it contains a fact, rewrite it as a short memory.

If not, return: NONE

Message:
{message}
"""

    result = generate_ai_response(prompt)

    if "NONE" in result.upper():
        return None

    return result.strip()