# intent_classifier.py
# This file builds, trains, and saves your intent classification AI model.

import os
import pickle                             # Used to save/load the model to disk
import numpy as np
from sklearn.pipeline import Pipeline     # Chains steps together
from sklearn.feature_extraction.text import TfidfVectorizer  # Converts text to numbers
from sklearn.linear_model import LogisticRegression           # The ML algorithm
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from training_data import TRAINING_DATA

# Download required NLTK data (only needed the first time)
nltk.download('punkt_tab', quiet=True)
nltk.download('wordnet',   quiet=True)
nltk.download('punkt',     quiet=True)

MODEL_PATH = 'models/intent_model.pkl'

# ── Text Preprocessing ─────────────────────────────────────────
# Before training, we 'clean' the text:
#   1. Lowercase everything (Hello = hello)
#   2. Remove common words like 'the', 'a', 'is' (stopwords)
#   3. Reduce words to their base form: 'ordering' → 'order' (lemmatization)

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def preprocess(text):
    words = nltk.word_tokenize(text.lower())   # Split into words, lowercase
    words = [lemmatizer.lemmatize(w) for w in words if w.isalpha() and w not in stop_words]
    return ' '.join(words)   # Join back into a string

# ── Build the Model Pipeline ───────────────────────────────────
# A Pipeline is like an assembly line:
#   Step 1: TF-IDF Vectorizer → converts text into a table of numbers
#   Step 2: Logistic Regression → learns patterns and predicts the intent

def build_model():
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),  # Looks at 1 and 2 word combos
        ('clf',   LogisticRegression(max_iter=500)),     # The classifier
    ])
    return model

# ── Train the Model ────────────────────────────────────────────
def train_model():
    # Separate sentences (X) and labels (y)
    X = [preprocess(sentence) for sentence, label in TRAINING_DATA]
    y = [label for sentence, label in TRAINING_DATA]

    # Split into 80% training, 20% testing
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = build_model()
    model.fit(X_train, y_train)   # Train the model on the training data

    # Check accuracy on test data
    y_pred = model.predict(X_test)
    print(f'Model Accuracy: {accuracy_score(y_test, y_pred) * 100:.1f}%')

    # Save the model to disk
    os.makedirs('models', exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    print('Model saved to', MODEL_PATH)
    return model

# ── Load the Model ─────────────────────────────────────────────
def load_model():
    if not os.path.exists(MODEL_PATH):
        print('No saved model found. Training now...')
        return train_model()
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)

# ── Predict Intent ─────────────────────────────────────────────
_model = load_model()  # Load model when the server starts

def predict_intent(text):
    cleaned = preprocess(text)         # Clean the input text
    intent = _model.predict([cleaned])[0]  # Predict the intent
    proba  = _model.predict_proba([cleaned]).max()  # Confidence score
    return intent, round(float(proba), 2)  # e.g. ('Suggest', 0.94)

# ── Run this file directly to train the model ──────────────────
if __name__ == '__main__':
    train_model()
