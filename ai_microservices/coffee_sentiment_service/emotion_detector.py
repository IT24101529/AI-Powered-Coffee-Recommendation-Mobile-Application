import os, pickle, re, nltk, numpy as np, pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score
from pathlib import Path
from emotion_keywords import EMOTION_KEYWORDS, AMPLIFIERS, NEGATORS

nltk.download('punkt',   quiet=True)
nltk.download('wordnet', quiet=True)

MODEL_PATH = 'models/emotion_model.pkl'
EMOTIONS   = ['Tired', 'Stressed', 'Happy', 'Sad', 'Excited', 'Calm', 'Anxious']

# Path to the real-world emotion dataset
EMOTION_CSV = Path(__file__).resolve().parent.parent / 'Emotion_final.csv'

# Mapping from Emotion_final.csv labels → BrewBot emotion labels
EMOTION_MAP = {
    'happy': 'Happy',
    'sadness': 'Sad',
    'anger': 'Stressed',
    'fear': 'Anxious',
    'love': 'Excited',
    'surprise': 'Excited',
}

GREETING_PHRASES = {
    'hi', 'hello', 'hey', 'heyy', 'hii',
    'good morning', 'good afternoon', 'good evening',
}


# ── LAYER 1: Keyword Matching ───────────────────────────────────
def keyword_detect(text: str) -> dict:
    '''
    Scans text for known emotional keywords.
    Returns the best matching emotion and an intensity score.
    Returns None if no keywords found (triggers Layer 2).
    '''
    text_lower = text.lower()
    words      = text_lower.split()
    scores     = {e: 0 for e in EMOTIONS}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:                    # Keyword found
                base_score = 1.0

                # Check for amplifiers near the keyword (boost score)
                for amp in AMPLIFIERS:
                    if amp in text_lower:
                        base_score += 0.3
                        break

                # Check for negators near the keyword (flip to opposite)
                negated = any(neg in text_lower for neg in NEGATORS)
                if negated:
                    # Flip: 'not happy' → probably Sad or Calm
                    opposite = {'Happy': 'Sad', 'Excited': 'Calm',
                                'Calm': 'Stressed', 'Sad': 'Happy',
                                'Stressed': 'Calm', 'Tired': 'Excited',
                                'Anxious': 'Calm'}
                    scores[opposite.get(emotion, 'Calm')] += base_score
                else:
                    scores[emotion] += base_score

    best_emotion = max(scores, key=scores.get)
    best_score   = scores[best_emotion]

    if best_score == 0:
        return None   # No keywords found — fall through to Layer 2

    # Normalise intensity to 0.0–1.0 range
    intensity = min(round(best_score / 3.0, 2), 1.0)

    found_keywords = [kw for kw in EMOTION_KEYWORDS[best_emotion] if kw in text_lower]

    return {
        'emotion':   best_emotion,
        'intensity': intensity,
        'method':    'keyword',
        'keywords':  found_keywords[:5],  # Return up to 5 found keywords
        'all_scores': scores
    }


# ── LAYER 2: ML Emotion Classifier (trained on real data) ──────
# Hand-crafted fallback data for Tired and Calm (not in Emotion_final.csv)
HANDCRAFTED_DATA = [
    ('I can barely keep my eyes open', 'Tired'),
    ('running on empty today', 'Tired'),
    ('feel like a zombie', 'Tired'),
    ('havent had proper rest in days', 'Tired'),
    ('i am exhausted', 'Tired'),
    ('need sleep so bad', 'Tired'),
    ('i am super sleepy', 'Tired'),
    ('so tired i could sleep here', 'Tired'),
    ('just need a normal coffee', 'Calm'),
    ('no strong preference today', 'Calm'),
    ('feeling peaceful and quiet', 'Calm'),
    ('just chilling out', 'Calm'),
    ('relaxed day today', 'Calm'),
    ('pretty neutral', 'Calm'),
    ('feeling chill', 'Calm'),
    ('im okay', 'Calm'),
    ('nothing special today', 'Calm'),
    ('just a regular day', 'Calm'),
    ('all good', 'Calm'),
    ('feeling normal', 'Calm'),
]

def _load_emotion_training_data():
    """Loads Emotion_final.csv + hand-crafted data for Tired/Calm."""
    texts = []
    labels = []

    # Source 1: Emotion_final.csv (21K real-world samples)
    if EMOTION_CSV.exists():
        print(f'[EmotionML] Loading dataset: {EMOTION_CSV.name}...')
        df = pd.read_csv(EMOTION_CSV)
        mapped = 0
        for _, row in df.iterrows():
            raw_emotion = str(row['Emotion']).strip().lower()
            brewbot_emotion = EMOTION_MAP.get(raw_emotion)
            if brewbot_emotion:
                texts.append(str(row['Text']).strip())
                labels.append(brewbot_emotion)
                mapped += 1
        print(f'[EmotionML] Mapped {mapped} samples from Emotion_final.csv.')
    else:
        print(f'[EmotionML] Warning: Emotion_final.csv not found at {EMOTION_CSV}')

    # Source 2: Hand-crafted data for Tired and Calm
    for text, label in HANDCRAFTED_DATA:
        # Oversample to balance against 7K+ happy samples
        for _ in range(50):
            texts.append(text)
            labels.append(label)

    print(f'[EmotionML] Total training samples: {len(texts)}')
    return texts, labels

# Expose for model_accuracy_summary.py
ML_TRAINING_DATA = HANDCRAFTED_DATA


def train_emotion_model():
    texts, labels = _load_emotion_training_data()

    # Constrained RandomForest to prevent overfitting
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
        ('clf', RandomForestClassifier(
            n_estimators=200,
            max_depth=10,             # Prevent memorization
            min_samples_leaf=5,       # Force generalization
            class_weight='balanced',
            random_state=42,
            n_jobs=-1,
        ))
    ])

    # 5-Fold Stratified Cross-Validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, texts, labels, cv=cv, scoring='accuracy')
    print(f'[EmotionML] 5-Fold CV Accuracy: {cv_scores.mean()*100:.1f}% (±{cv_scores.std()*100:.1f}%)')

    # Train production model on all data
    model.fit(texts, labels)

    os.makedirs('models', exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    print(f'[EmotionML] Model saved to {MODEL_PATH}')
    return model


def load_emotion_model():
    if not os.path.exists(MODEL_PATH):
        return train_emotion_model()
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)

_emotion_model = load_emotion_model()

def ml_detect(text: str) -> dict:
    probabilities = _emotion_model.predict_proba([text])[0]
    confidence = float(probabilities.max())
    emotion = _emotion_model.predict([text])[0]
    intensity = round(confidence, 2)

    # For short, ambiguous text, prefer a stable neutral mood
    if confidence < 0.55:
        return {
            'emotion': 'Calm',
            'intensity': round(max(0.25, confidence), 2),
            'method': 'ml_low_confidence',
            'keywords': []
        }

    return {
        'emotion':   emotion,
        'intensity': intensity,
        'method':    'ml_model',
        'keywords':  []
    }


# ── COMBINED DETECTION (Layer 1 first, then Layer 2) ───────────
def detect_emotion(text: str) -> dict:
    '''
    Main function — tries keyword matching first,
    falls back to ML model if no keywords found.
    '''
    if not text or not text.strip():
        return {'emotion': 'Calm', 'intensity': 0.5, 'method': 'default', 'keywords': []}

    clean = re.sub(r'[^a-zA-Z\s]', '', text).strip().lower()
    if clean in GREETING_PHRASES:
        return {
            'emotion': 'Calm',
            'intensity': 0.25,
            'method': 'greeting',
            'keywords': []
        }

    # Layer 1: Try keywords first
    keyword_result = keyword_detect(text)
    if keyword_result is not None:
        return keyword_result   # Keywords found — return directly

    # Layer 2: Keywords not found — use ML model
    return ml_detect(text)


# ── Quick test ──────────────────────────────────────────────────
if __name__ == '__main__':
    train_emotion_model()
    tests = [
        'I am absolutely exhausted today',
        'feeling great and full of energy',
        'so stressed about this deadline',
        'just want a normal coffee',
        'my heart wont stop racing',
        'can barely keep my eyes open',
    ]
    for t in tests:
        r = detect_emotion(t)
        print(f'{r["emotion"]:10s} ({r["intensity"]:.2f}) [{r["method"]:8s}]  {t}')
