import os
import tempfile
import traceback
import subprocess
import numpy as np
from typing import Optional

import imageio_ffmpeg

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from services.ai_service import generate_ai_response, text_to_speech
from services.voice_analysis import analyze_voice
from routes.auth import get_current_user
from database import get_db
import whisper
import whisper.audio as _whisper_audio
import soundfile as sf

router = APIRouter()

# ── Bundled ffmpeg ────────────────────────────────────────────────────────────
FFMPEG_EXE  = imageio_ffmpeg.get_ffmpeg_exe()
SAMPLE_RATE = 16000
DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"

# Patch Whisper's load_audio to use the bundled ffmpeg binary
def _patched_load_audio(file: str, sr: int = SAMPLE_RATE):
    cmd = [
        FFMPEG_EXE, "-nostdin", "-threads", "0",
        "-i", file,
        "-f", "s16le", "-ac", "1", "-acodec", "pcm_s16le",
        "-ar", str(sr), "-",
    ]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, np.int16).flatten().astype(np.float32) / 32768.0

_whisper_audio.load_audio = _patched_load_audio

# Load Whisper once at startup
model = whisper.load_model("base")

MIME_TO_EXT = {
    "audio/webm":             ".webm",
    "audio/webm;codecs=opus": ".webm",
    "audio/ogg":              ".ogg",
    "audio/ogg;codecs=opus":  ".ogg",
    "audio/wav":              ".wav",
    "audio/wave":             ".wav",
    "audio/x-wav":            ".wav",
    "audio/mp4":              ".mp4",
    "audio/mpeg":             ".mp3",
}


def to_wav(input_path: str) -> str:
    wav_path = input_path + "_converted.wav"
    result = subprocess.run(
        [FFMPEG_EXE, "-y", "-i", input_path,
         "-ar", str(SAMPLE_RATE), "-ac", "1", "-f", "wav", wav_path],
        stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg: {result.stderr.decode(errors='replace')}")
    return wav_path


@router.post("/")
async def voice_chat(
    audio:        UploadFile       = File(...),
    companion_id: Optional[str]    = Form(None),
    current_user                   = Depends(get_current_user),
    db                             = Depends(get_db),
):
    content_type = (audio.content_type or "audio/webm").split(";")[0].strip()
    ext = MIME_TO_EXT.get(content_type, ".webm")

    # 1. Save raw upload
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await audio.read())
        raw_path = tmp.name

    wav_path = None

    try:
        # 2. Convert to 16 kHz WAV
        wav_path = to_wav(raw_path)

        # 3. Voice analysis (non-fatal)
        try:
            analysis = analyze_voice(wav_path)
        except Exception as e:
            print(f"Voice analysis warning: {e}")
            analysis = {"speed": "normal", "tone": "calm", "style": "deep"}

        # 4. Speech → Text
        result    = model.transcribe(wav_path, fp16=False)
        user_text = result["text"].strip()

        if not user_text:
            return {
                "user_text": "",
                "ai_text":   "I didn't catch that — could you say it again?",
                "analysis":  analysis,
                "audio":     "",
            }

        # 5. Fetch companion persona if companion_id provided
        voice_id     = DEFAULT_VOICE_ID
        name         = "your companion"
        relationship = "friend"
        personality  = "warm and supportive"
        memories_txt = ""

        if companion_id:
            companion = db.companions.find_one({
                "_id":     companion_id,
                "user_id": current_user["_id"],
            })
            if companion:
                name         = companion.get("name", name)
                relationship = companion.get("description", relationship)
                personality  = companion.get("personality", personality)
                memories     = companion.get("memories", [])
                memories_txt = "\n".join(memories[:10])  # cap at 10
                voice_id     = companion.get("voice_id") or DEFAULT_VOICE_ID

        # 6. Build persona-aware prompt
        prompt = f"""You are {name}, the user's {relationship}.
Your personality: {personality}.
{f"Shared memories:{chr(10)}{memories_txt}" if memories_txt else ""}

The user just said (via voice): "{user_text}"

Their voice tone: {analysis['tone']}, speed: {analysis['speed']}, pitch: {analysis['style']}.

Respond naturally as {name}. Match their energy.
Keep it concise — 1 to 3 sentences max. This is a live voice call.
"""

        ai_text = generate_ai_response(prompt)

        # 7. Text → Speech using companion's cloned voice (or default)
        audio_bytes = text_to_speech(ai_text, voice_id)

        return {
            "user_text": user_text,
            "ai_text":   ai_text,
            "analysis":  analysis,
            "audio":     audio_bytes.hex(),
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        for path in [raw_path, wav_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass
