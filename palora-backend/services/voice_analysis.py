import librosa
import numpy as np

def analyze_voice(file_path):
    y, sr = librosa.load(file_path)

    # Speed (tempo) — beat_track may return array in newer librosa
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    tempo = float(np.atleast_1d(tempo)[0])

    # Energy (loudness)
    energy = float(np.mean(librosa.feature.rms(y=y)))

    # Pitch
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_vals = pitches[magnitudes > np.median(magnitudes)]
    pitch = float(np.mean(pitch_vals)) if pitch_vals.size > 0 else 0.0

    # Convert to human traits
    if tempo < 90:
        speed = "slow"
    elif tempo < 140:
        speed = "normal"
    else:
        speed = "fast"

    if energy < 0.02:
        tone = "calm"
    else:
        tone = "energetic"

    if pitch < 150:
        style = "deep"
    else:
        style = "high"

    return {
        "speed": speed,
        "tone": tone,
        "style": style
    }