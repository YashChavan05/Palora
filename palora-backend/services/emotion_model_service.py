import warnings
import joblib

# ── Lazy model loading — avoids RAM spike at boot ─────────────────────────────
_model = None
_vectorizer = None

def _load_models():
    """Load sklearn model and vectorizer once, suppress version mismatch warnings."""
    global _model, _vectorizer
    if _model is None or _vectorizer is None:
        # Suppress scikit-learn unpickling version warnings cleanly
        with warnings.catch_warnings():
            warnings.filterwarnings(
                "ignore",
                category=UserWarning,
                message=".*InconsistentVersionWarning.*"
            )
            warnings.filterwarnings(
                "ignore",
                category=UserWarning,
                module="sklearn"
            )
            _model      = joblib.load("ml/emotion_model.pkl")
            _vectorizer = joblib.load("ml/vectorizer.pkl")
        print("Emotion model and vectorizer loaded.")

    return _model, _vectorizer


def predict_emotion(text: str) -> str:
    model, vectorizer = _load_models()

    # Convert text into vector and predict emotion
    text_vector = vectorizer.transform([text])
    emotion     = model.predict(text_vector)[0]

    return str(emotion)
