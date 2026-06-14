import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

# Load dataset
df = pd.read_csv("datasets/text.csv")

# Use only needed columns
X = df["text"]
y = df["label"]

# Convert text to numerical vectors
vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
X_vec = vectorizer.fit_transform(X)

# Train model
model = LogisticRegression(max_iter=200)
model.fit(X_vec, y)

# Save model
joblib.dump(model, "ml/emotion_model.pkl")
joblib.dump(vectorizer, "ml/vectorizer.pkl")

print("Emotion model trained successfully!")