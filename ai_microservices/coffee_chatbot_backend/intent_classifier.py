import os
import pickle
import hashlib
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
import nltk
from nltk.stem import WordNetLemmatizer
from training_data import TRAINING_DATA
from pathlib import Path

nltk.download('punkt',     quiet=True)
nltk.download('wordnet',   quiet=True)
nltk.download('punkt_tab', quiet=True)

MODEL_PATH = 'models/intent_model.pkl'

# ── Bitext Dataset Mapping ──────────────────────────────────────
# Maps the 27 Bitext customer-support intents to our 8 chatbot intents
BITEXT_INTENT_MAP = {
    # Order-related
    'place_order': 'Order',
    'cancel_order': 'Order',
    'change_order': 'Order',
    # Complaint
    'complaint': 'Complaint',
    # Feedback / Review
    'review': 'Feedback',
    # Browse / Contact
    'contact_customer_service': 'Browse',
    'contact_human_agent': 'Browse',
    # Question — all inquiry-type intents
    'check_invoice': 'Question',
    'check_payment_methods': 'Question',
    'delivery_options': 'Question',
    'delivery_period': 'Question',
    'check_refund_policy': 'Question',
    'get_refund': 'Question',
    'track_refund': 'Question',
    'check_cancellation_fee': 'Question',
    'track_order': 'Question',
    'create_account': 'Question',
    'delete_account': 'Question',
    'edit_account': 'Question',
    'recover_password': 'Question',
    'switch_account': 'Question',
    'registration_problems': 'Question',
    'payment_issue': 'Question',
    'newsletter_subscription': 'Question',
    'set_up_shipping_address': 'Question',
    'change_shipping_address': 'Question',
    'get_invoice': 'Question',
}

BITEXT_CSV = Path(__file__).resolve().parent.parent / 'Bitext_Sample_Customer_Support_Training_Dataset_27K_responses-v11.csv'


def _training_signature():
    payload = '\n'.join(f'{text}\t{label}' for text, label in TRAINING_DATA)
    # Include Bitext file modification time for cache invalidation
    if BITEXT_CSV.exists():
        payload += f'\nbitext_mtime={os.path.getmtime(BITEXT_CSV)}'
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()


# ── Text Preprocessing ─────────────────────────────────────────
lemmatizer = WordNetLemmatizer()

def preprocess(text):
    if not text:
        return ""
    words = nltk.word_tokenize(text.lower())
    words = [lemmatizer.lemmatize(w) for w in words if w.strip()]
    return ' '.join(words)


# ── Load Combined Training Data ────────────────────────────────
def _load_all_training_data():
    """Loads hand-crafted data + Bitext 27K dataset, returns (X_texts, y_labels)."""
    texts = []
    labels = []

    # Source 1: Hand-crafted data (Greeting, Suggest, Goodbye, etc.)
    for text, label in TRAINING_DATA:
        texts.append(text)
        labels.append(label)

    # Source 2: Bitext 27K dataset  
    if BITEXT_CSV.exists():
        print(f'[IntentClassifier] Loading Bitext dataset: {BITEXT_CSV.name}...')
        df = pd.read_csv(BITEXT_CSV, usecols=['instruction', 'intent'])
        mapped = 0
        for _, row in df.iterrows():
            bitext_intent = str(row['intent']).strip()
            brewbot_intent = BITEXT_INTENT_MAP.get(bitext_intent)
            if brewbot_intent:
                texts.append(str(row['instruction']).strip())
                labels.append(brewbot_intent)
                mapped += 1
        print(f'[IntentClassifier] Mapped {mapped} Bitext samples to BrewBot intents.')
    else:
        print(f'[IntentClassifier] Warning: Bitext CSV not found at {BITEXT_CSV}')

    return texts, labels


# ── Heuristic Fallback ──────────────────────────────────────────
INTENT_KEYWORDS = {
    'Greeting': {'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'},
    'Order': {'order', 'buy', 'take', 'place order', 'get me', 'i will take'},
    'Suggest': {'recommend', 'suggest', 'surprise me', 'what should i drink', 'help me choose', 'tired', 'stressed', 'happy', 'sad', 'energetic', 'exhausted', 'sleepy', 'anxious', 'excited', 'normal', 'calm', 'down', 'feeling', 'lost', 'grief', 'grieving'},
    'Question': {'what is', 'how much', 'tell me about', 'price'},
    'Complaint': {'too bitter', 'not good', 'dont like', 'do not like', 'too strong', 'not what i wanted'},
    'Feedback': {'great', 'loved', 'perfect', 'enjoyed', 'five stars', 'excellent'},
    'Browse': {'menu', 'show me what you have', 'available', 'list all', 'what can i order'},
    'Goodbye': {'bye', 'goodbye', 'see you', 'done', 'that will be all'},
}

def _heuristic_intent(cleaned_text):
    if not cleaned_text:
        return None, 0.0
    scores = {}
    for intent, patterns in INTENT_KEYWORDS.items():
        score = 0
        for pattern in patterns:
            if pattern in cleaned_text:
                score += 2 if ' ' in pattern else 1
        if score > 0:
            scores[intent] = score
    if not scores:
        return None, 0.0
    best_intent = max(scores, key=scores.get)
    max_score = scores[best_intent]
    confidence = min(0.92, 0.55 + (max_score * 0.08))
    return best_intent, round(confidence, 2)


# Exact intent map for known phrases
EXACT_INTENT_MAP = {preprocess(text): label for text, label in TRAINING_DATA}


# ── Build the Model Pipeline ───────────────────────────────────
def build_model():
    model = Pipeline([
        (
            'tfidf',
            TfidfVectorizer(
                ngram_range=(1, 2),
                sublinear_tf=True,
                max_features=5000,    # Increased for 27K dataset
            )
        ),
        (
            'clf',
            LinearSVC(
                max_iter=3000,
                class_weight='balanced',
                C=1.0,
                random_state=42,
            )
        ),
    ])
    return model


# ── Train the Model ────────────────────────────────────────────
def train_model():
    texts, labels = _load_all_training_data()
    X = [preprocess(t) for t in texts]
    y = labels

    print(f'[IntentClassifier] Total training samples: {len(X)}')
    
    # 5-Fold Stratified Cross-Validation for realistic accuracy
    model = build_model()
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
    print(f'[IntentClassifier] 5-Fold CV Accuracy: {cv_scores.mean()*100:.1f}% (±{cv_scores.std()*100:.1f}%)')

    # Train the production model on ALL data
    model = build_model()
    model.fit(X, y)

    os.makedirs('models', exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump({
            'model': model,
            'training_signature': _training_signature(),
        }, f)
    print(f'[IntentClassifier] Model saved to {MODEL_PATH}')
    return model


# ── Load the Model ─────────────────────────────────────────────
def load_model():
    if not os.path.exists(MODEL_PATH):
        print('No saved model found. Training now...')
        return train_model()
    try:
        with open(MODEL_PATH, 'rb') as f:
            payload = pickle.load(f)
    except Exception:
        print('Saved model could not be loaded. Retraining now...')
        return train_model()

    if isinstance(payload, dict) and 'model' in payload:
        if payload.get('training_signature') == _training_signature():
            return payload['model']
        print('Training data changed. Retraining model...')
        return train_model()

    print('Legacy model format detected. Retraining model...')
    return train_model()


# ── Predict Intent ─────────────────────────────────────────────
_model = load_model()

def predict_intent(text):
    cleaned = preprocess(text)
    if cleaned in EXACT_INTENT_MAP:
        return EXACT_INTENT_MAP[cleaned], 0.95

    # LinearSVC: use decision_function + softmax for confidence
    decision_scores = _model.decision_function([cleaned])[0]
    model_intent = _model.classes_[np.argmax(decision_scores)]
    
    exp_scores = np.exp(decision_scores - np.max(decision_scores))
    model_proba = float(np.max(exp_scores / exp_scores.sum()))

    heuristic_intent, heuristic_conf = _heuristic_intent(cleaned)

    # Trust heuristic only if model is very uncertain
    if heuristic_intent and (model_proba < 0.45 or heuristic_conf >= model_proba + 0.15):
        return heuristic_intent, heuristic_conf

    return model_intent, round(model_proba, 2)


if __name__ == '__main__':
    train_model()
