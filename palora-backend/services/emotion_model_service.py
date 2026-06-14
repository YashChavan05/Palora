import joblib

# Load trained model
model = joblib.load("ml/emotion_model.pkl")
vectorizer = joblib.load("ml/vectorizer.pkl")

def predict_emotion(text):

    # Convert text into vector
    text_vector = vectorizer.transform([text])

    # Predict emotion
    emotion = model.predict(text_vector)[0]

    return str(emotion)