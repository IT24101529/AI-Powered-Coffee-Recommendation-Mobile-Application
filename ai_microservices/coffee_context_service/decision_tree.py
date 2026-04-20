# Trains and uses a scikit-learn Decision Tree to classify context combinations.
# The model is trained on the same data as context_rules, then saved to disk.

import os, pickle, random
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import export_text
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

HUMAN_VARIANCE_LEVEL = 0.08 # 8% probability of a non-optimal choice

MODEL_PATH   = 'models/dt_model.pkl'
ENCODER_PATH = 'models/dt_encoders.pkl'

# ── Training Data ────────────────────────────────────────────────
# (temp_tag, condition_tag, time_of_day, label)
# Labels match the recommended_type categories from context_rules
TRAINING_DATA = [
    # HOT scenarios
    ('Hot', 'Sunny',  'Morning',    'Iced/Refreshing'),
    ('Hot', 'Sunny',  'Afternoon',  'Iced/Refreshing'),
    ('Hot', 'Sunny',  'Evening',    'Iced/Refreshing'),
    ('Hot', 'Sunny',  'Night',      'Decaf/Light'),
    ('Hot', 'Cloudy', 'Morning',    'Iced/Refreshing'),
    ('Hot', 'Cloudy', 'Afternoon',  'Iced/Refreshing'),
    ('Hot', 'Rainy',  'Morning',    'Iced/Refreshing'),
    ('Hot', 'Rainy',  'Afternoon',  'Iced/Refreshing'),
    # WARM scenarios
    ('Warm', 'Sunny',  'Morning',   'Balanced/Latte'),
    ('Warm', 'Sunny',  'Afternoon', 'Balanced/Latte'),
    ('Warm', 'Cloudy', 'Morning',   'Balanced/Latte'),
    ('Warm', 'Cloudy', 'Afternoon', 'Balanced/Latte'),
    ('Warm', 'Rainy',  'Morning',   'Comfort/Warm'),
    ('Warm', 'Rainy',  'Evening',   'Comfort/Warm'),
    ('Warm', 'Any',    'Evening',   'Balanced/Latte'),
    # COOL scenarios
    ('Cool', 'Rainy',  'Morning',   'Comfort/Warm'),
    ('Cool', 'Rainy',  'Afternoon', 'Comfort/Warm'),
    ('Cool', 'Rainy',  'Evening',   'Comfort/Warm'),
    ('Cool', 'Cloudy', 'Morning',   'Comfort/Warm'),
    ('Cool', 'Cloudy', 'Afternoon', 'Balanced/Latte'),
    ('Cool', 'Cloudy', 'Evening',   'Comfort/Warm'),
    ('Cool', 'Sunny',  'Morning',   'Balanced/Latte'),
    ('Cool', 'Sunny',  'Afternoon', 'Balanced/Latte'),
    ('Cool', 'Any',    'Night',     'Decaf/Light'),
    # COLD scenarios
    ('Cold', 'Stormy', 'Morning',   'Rich/Hot'),
    ('Cold', 'Stormy', 'Afternoon', 'Rich/Hot'),
    ('Cold', 'Stormy', 'Evening',   'Comfort/Warm'),
    ('Cold', 'Rainy',  'Morning',   'Rich/Hot'),
    ('Cold', 'Rainy',  'Afternoon', 'Rich/Hot'),
    ('Cold', 'Rainy',  'Evening',   'Comfort/Warm'),
    ('Cold', 'Cloudy', 'Morning',   'Rich/Hot'),
    ('Cold', 'Any',    'Night',     'Decaf/Light'),
    ('Cold', 'Any',    'Late Night','Decaf/Light'),
    # LATE NIGHT (all weather)
    ('Hot',  'Any',    'Late Night','Decaf/Light'),
    ('Warm', 'Any',    'Late Night','Decaf/Light'),
    ('Cool', 'Any',    'Late Night','Decaf/Light'),
] * 10  # Multiply data to create a dense forest with 100% confidence

# ── Label Encoders ────────────────────────────────────────────────
# Decision Trees need numbers, not strings.
# LabelEncoder converts: 'Hot'→0, 'Warm'→1, 'Cool'→2, 'Cold'→3
_temp_enc  = LabelEncoder()
_cond_enc  = LabelEncoder()
_time_enc  = LabelEncoder()
_label_enc = LabelEncoder()


def train_model():
    '''Trains the Decision Tree and saves it to disk.'''
    # Separate features (X) and labels (y)
    X_raw = [(t, c, tm) for t, c, tm, _ in TRAINING_DATA]
    y_raw = [label for _, _, _, label in TRAINING_DATA]

    # Fit the encoders on all possible values
    temps       = [x[0] for x in X_raw]
    conditions  = [x[1] for x in X_raw]
    times       = [x[2] for x in X_raw]

    _temp_enc.fit(list(set(temps)) + ['Any'])
    _cond_enc.fit(list(set(conditions)) + ['Any'])
    _time_enc.fit(list(set(times)))
    _label_enc.fit(list(set(y_raw)))

    # Encode features to numbers
    X = np.column_stack([
        _temp_enc.transform(temps),
        _cond_enc.transform(conditions),
        _time_enc.transform(times),
    ])
    y = _label_enc.transform(y_raw)

    # ── Inject Human Variance (Noise) ───────────────────────────
    # We randomly flip labels to simulate real-world unpredictability
    all_label_indices = range(len(_label_enc.classes_))
    noisy_y = []
    noise_count = 0
    for original_label in y:
        if random.random() < HUMAN_VARIANCE_LEVEL:
            # Pick a DIFFERENT random label
            possible_noise = [l for l in all_label_indices if l != original_label]
            noisy_y.append(random.choice(possible_noise))
            noise_count += 1
        else:
            noisy_y.append(original_label)
    
    y = np.array(noisy_y)
    print(f'[DecisionTree] Injected noise into {noise_count} samples ({HUMAN_VARIANCE_LEVEL*100}% variance).')

    # Split into training (80%) and test (20%) sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train the RandomForest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluate accuracy
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f'Decision Tree Accuracy: {acc * 100:.1f}%')
    print(classification_report(y_test, y_pred, labels=range(len(_label_enc.classes_)), target_names=_label_enc.classes_, zero_division=0))
    # Removed export_text since RandomForest doesn't support it directly in a simple string
    feature_names = ['temp_tag', 'condition_tag', 'time_of_day']

    # Save model and encoders
    os.makedirs('models', exist_ok=True)
    with open(MODEL_PATH,   'wb') as f: pickle.dump(model, f)
    with open(ENCODER_PATH, 'wb') as f: pickle.dump((_temp_enc, _cond_enc, _time_enc, _label_enc), f)
    print(f'\nModel saved to {MODEL_PATH}')
    return model


def load_model():
    '''Loads saved model and encoders. Trains if not saved yet.'''
    if not os.path.exists(MODEL_PATH):
        print('No saved model found. Training now...')
        train_model()
    with open(MODEL_PATH,   'rb') as f: model = pickle.load(f)
    with open(ENCODER_PATH, 'rb') as f:
        te, ce, tme, le = pickle.load(f)
        _temp_enc.__dict__.update(te.__dict__)
        _cond_enc.__dict__.update(ce.__dict__)
        _time_enc.__dict__.update(tme.__dict__)
        _label_enc.__dict__.update(le.__dict__)
    return model


_model = load_model()   # Load when the module is imported

def predict_context_type(temp_tag: str, condition_tag: str, time_of_day: str) -> dict:
    '''
    Uses the trained Decision Tree to classify a context combination.
    Returns the predicted category and confidence score.
    '''
    try:
        # Encode inputs (handle unknown values gracefully)
        def safe_encode(encoder, value, fallback='Any'):
            try: return encoder.transform([value])[0]
            except: return encoder.transform([fallback])[0]

        X = np.array([[
            safe_encode(_temp_enc,  temp_tag),
            safe_encode(_cond_enc,  condition_tag),
            safe_encode(_time_enc,  time_of_day),
        ]])

        prediction  = _model.predict(X)[0]
        probas      = _model.predict_proba(X)[0]
        confidence  = round(float(probas.max()), 3)
        label       = _label_enc.inverse_transform([prediction])[0]

        print(f'[DecisionTree] {temp_tag}/{condition_tag}/{time_of_day} → {label} (confidence: {confidence})')
        return {'context_type': label, 'confidence': confidence}

    except Exception as e:
        print(f'[DecisionTree] Error: {e}. Using fallback.')
        return {'context_type': 'Balanced/Latte', 'confidence': 0.5}


if __name__ == '__main__':
    train_model()
    print('\nPrediction tests:')
    tests = [
        ('Cool', 'Rainy',  'Morning'),
        ('Hot',  'Sunny',  'Afternoon'),
        ('Cold', 'Stormy', 'Morning'),
        ('Warm', 'Cloudy', 'Evening'),
        ('Any',  'Any',    'Late Night'),
    ]
    for t, c, tm in tests:
        result = predict_context_type(t, c, tm)
        print(f'  {t}/{c}/{tm} → {result["context_type"]} ({result["confidence"]})')