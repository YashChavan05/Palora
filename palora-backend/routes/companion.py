import os
import uuid
import json
import subprocess
import tempfile
import traceback
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from dotenv import load_dotenv
import requests
import imageio_ffmpeg

from database import get_db
from models.schemas import Companion
from routes.auth import get_current_user
from services.voice_analysis import analyze_voice

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _to_wav(input_path: str) -> str:
    """Convert any audio file to 16kHz mono WAV using bundled ffmpeg."""
    wav_path = input_path + "_converted.wav"
    result = subprocess.run(
        [FFMPEG_EXE, "-y", "-i", input_path,
         "-ar", "16000", "-ac", "1", "-f", "wav", wav_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode(errors="replace"))
    return wav_path


def clone_voice(name: str, file_path: str) -> str:
    """Upload audio to ElevenLabs and return the new voice_id."""
    url = "https://api.elevenlabs.io/v1/voices/add"
    with open(file_path, "rb") as f:
        response = requests.post(
            url,
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            files={"files": (os.path.basename(file_path), f, "audio/mpeg")},
            data={"name": name},
        )
    if response.status_code != 200:
        raise Exception(f"ElevenLabs clone failed: {response.text}")
    return response.json()["voice_id"]


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=Companion)
async def create_companion(
    name:        str            = Form(...),
    description: str            = Form(...),
    personality: str            = Form("Friendly"),
    memories:    str            = Form("[]"),          # JSON array string
    file:        Optional[UploadFile] = File(None),    # voice file — optional
    current_user = Depends(get_current_user),
    db           = Depends(get_db),
):
    # Parse memories JSON sent from frontend
    try:
        memories_list = json.loads(memories)
    except Exception:
        memories_list = []

    companion_dict = {
        "_id":         str(uuid.uuid4()),
        "name":        name,
        "description": description,
        "personality": personality,
        "memories":    memories_list,
        "user_id":     current_user["_id"],
        "created_at":  datetime.utcnow(),
        "voice_profile": None,
        "voice_id":    None,
    }

    # ── Voice file processing (optional) ────────────────────────────────────
    raw_path = None
    wav_path = None

    if file and file.filename:
        try:
            # Save raw upload
            suffix = os.path.splitext(file.filename)[1] or ".mp3"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(await file.read())
                raw_path = tmp.name

            # Convert to WAV for librosa
            try:
                wav_path = _to_wav(raw_path)
                companion_dict["voice_profile"] = analyze_voice(wav_path)
                print("Voice profile:", companion_dict["voice_profile"])
            except Exception as e:
                print(f"Voice analysis warning (non-fatal): {e}")

            # Clone voice on ElevenLabs
            try:
                voice_id = clone_voice(name, raw_path)
                companion_dict["voice_id"] = voice_id
                print("ElevenLabs voice_id:", voice_id)
            except Exception as e:
                print(f"Voice clone warning (non-fatal): {e}")

        except Exception as e:
            traceback.print_exc()
            print(f"Voice file processing error (non-fatal): {e}")
        finally:
            for p in [raw_path, wav_path]:
                if p and os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

    db.companions.insert_one(companion_dict)
    return companion_dict


@router.get("/", response_model=List[Companion])
def get_companions(current_user=Depends(get_current_user), db=Depends(get_db)):
    return list(db.companions.find({"user_id": current_user["_id"]}))


@router.get("/{companion_id}", response_model=Companion)
def get_companion(companion_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    companion = db.companions.find_one({"_id": companion_id, "user_id": current_user["_id"]})
    if not companion:
        raise HTTPException(status_code=404, detail="Companion not found")
    return companion


@router.delete("/{companion_id}")
def delete_companion(companion_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    companion = db.companions.find_one({"_id": companion_id, "user_id": current_user["_id"]})
    if not companion:
        raise HTTPException(status_code=404, detail="Companion not found")
    db.companions.delete_one({"_id": companion_id})
    db.chats.delete_many({"companion_id": companion_id})
    db.memories.delete_many({"companion_id": companion_id})
    return {"message": "Companion deleted successfully"}


@router.post("/{companion_id}/memory")
def add_memory(companion_id: str, memory: str,
               current_user=Depends(get_current_user), db=Depends(get_db)):
    companion = db.companions.find_one({"_id": companion_id, "user_id": current_user["_id"]})
    if not companion:
        raise HTTPException(status_code=404, detail="Companion not found")
    db.companions.update_one({"_id": companion_id}, {"$push": {"memories": memory}})
    return {"message": "Memory added"}
