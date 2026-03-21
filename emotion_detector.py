# emotion_detector.py
# Two-layer emotion detection:
#   Layer 1: Fast keyword matching
#   Layer 2: ML classifier for cases where keywords are not found

import os
import pickle
import nltk
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from emotion_keywords import EMOTION_KEYWORDS, AMPLIFIERS, NEGATORS

nltk.download('punkt',   quiet=True)
nltk.download('wordnet', quiet=True)

MODEL_PATH = 'models/emotion_model.pkl'
EMOTIONS   = ['Tired', 'Stressed', 'Happy', 'Sad', 'Excited', 'Calm', 'Anxious']


#  LAYER 1 — KEYWORD MATCHING

def keyword_detect(text: str) -> dict:
    '''
    Scans text for known emotional keywords.
    Uses word-boundary matching to avoid partial word matches.
    Returns None if no keywords found (triggers Layer 2).
    '''
    text_lower = text.lower()
    scores     = {e: 0.0 for e in EMOTIONS}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:

         
            if f' {kw} ' in f' {text_lower} ':
                base_score = 1.0

                for amp in AMPLIFIERS:
                    if amp in text_lower:
                        base_score += 0.3
                        break

                negated = any(neg in text_lower for neg in NEGATORS)
                if negated:
                    opposite = {
                        'Happy':    'Sad',
                        'Excited':  'Calm',
                        'Calm':     'Stressed',
                        'Sad':      'Happy',
                        'Stressed': 'Calm',
                        'Tired':    'Excited',
                        'Anxious':  'Calm',
                    }
                    scores[opposite.get(emotion, 'Calm')] += base_score
                else:
                    scores[emotion] += base_score

    best_emotion = max(scores, key=scores.get)
    best_score   = scores[best_emotion]

    if best_score == 0:
        return None

    intensity      = min(round(best_score / 3.0, 2), 1.0)
    found_keywords = [kw for kw in EMOTION_KEYWORDS[best_emotion]
                      if f' {kw} ' in f' {text_lower} ']

    return {
        'emotion':    best_emotion,
        'intensity':  intensity,
        'method':     'keyword',
        'keywords':   found_keywords[:5],
        'all_scores': scores,
    }



#  LAYER 2 — ML CLASSIFIER

ML_TRAINING_DATA = [

    # TIRED (10 examples)
    ('I can barely keep my eyes open',              'Tired'),
    ('running on empty today',                      'Tired'),
    ('feel like a zombie right now',                'Tired'),
    ('havent had proper rest in days',              'Tired'),
    ('my body just wants to shut down',             'Tired'),
    ('cannot focus on anything today',              'Tired'),
    ('my eyelids keep drooping',                    'Tired'),
    ('i keep losing concentration',                 'Tired'),
    ('moving in slow motion today',                 'Tired'),
    ('feel like i need a nap badly',                'Tired'),

    # STRESSED (10 examples)
    ('too many things to handle at once',           'Stressed'),
    ('my mind wont stop racing',                    'Stressed'),
    ('everything is piling up',                     'Stressed'),
    ('i just need a break from all of this',        'Stressed'),
    ('everything is due at the same time',          'Stressed'),
    ('i feel completely stretched thin',            'Stressed'),
    ('there is no end to this workload',            'Stressed'),
    ('i cannot keep up with everything',            'Stressed'),
    ('the pressure is getting to me',               'Stressed'),
    ('i have too much on my plate right now',       'Stressed'),

    # HAPPY (10 examples)
    ('just had the best news ever',                 'Happy'),
    ('things are going really well',                'Happy'),
    ('life is good right now',                      'Happy'),
    ('i got the job i wanted',                      'Happy'),
    ('everything worked out perfectly',             'Happy'),
    ('i feel on top of things today',               'Happy'),
    ('today has been going so smoothly',            'Happy'),
    ('i got a surprise that made my day',           'Happy'),
    ('my mood has been lifted today',               'Happy'),
    ('everything just came together nicely',        'Happy'),

    # SAD (10 examples)
    ('nothing is going right',                      'Sad'),
    ('feeling really low today',                    'Sad'),
    ('everything feels pointless',                  'Sad'),
    ('i just want to hide from the world',          'Sad'),
    ('nothing feels worth it today',                'Sad'),
    ('i feel completely empty inside',              'Sad'),
    ('everything feels heavy today',                'Sad'),
    ('i just cannot find any motivation',           'Sad'),
    ('the day has been really hard on me',          'Sad'),
    ('i feel disconnected from everything',         'Sad'),

    # EXCITED (10 examples)
    ('i have so much energy right now',             'Excited'),
    ('about to start something really new',         'Excited'),
    ('i just cannot sit still today',               'Excited'),
    ('the day i have been waiting for is here',     'Excited'),
    ('everything is happening today',               'Excited'),
    ('i feel electric and ready',                   'Excited'),
    ('my heart is beating fast with anticipation',  'Excited'),
    ('i feel unstoppable right now',                'Excited'),
    ('i am bursting with energy today',             'Excited'),
    ('i am raring to take on the day',              'Excited'),

    # CALM (14 examples — plain coffee orders land here via ML)
    ('just need a normal coffee',                   'Calm'),
    ('i want a coffee please',                      'Calm'),
    ('i would like a coffee',                       'Calm'),
    ('can i get a coffee',                          'Calm'),
    ('a coffee for me please',                      'Calm'),
    ('just a coffee thanks',                        'Calm'),
    ('give me a black coffee',                      'Calm'),
    ('i will have a latte',                         'Calm'),
    ('one espresso please',                         'Calm'),
    ('a medium coffee please',                      'Calm'),
    ('no strong preference today',                  'Calm'),
    ('whatever you suggest is fine',                'Calm'),
    ('i am just taking it easy today',              'Calm'),
    ('nothing special happening today',             'Calm'),

    # ANXIOUS (10 examples)
    ('my heart is racing with worry',               'Anxious'),
    ('cant stop worrying about it',                 'Anxious'),
    ('what if something goes wrong',                'Anxious'),
    ('i keep imagining bad outcomes',               'Anxious'),
    ('my stomach is in knots',                      'Anxious'),
    ('i keep thinking about worst case scenarios',  'Anxious'),
    ('i cannot shake this uneasy feeling',          'Anxious'),
    ('i feel on edge and cannot calm down',         'Anxious'),
    ('my thoughts keep spiralling out of control',  'Anxious'),
    ('i feel unsettled and cannot explain why',     'Anxious'),
]


def train_emotion_model():
    '''Trains on ALL data and saves the model.'''
    X = [text  for text, label in ML_TRAINING_DATA]
    y = [label for text, label in ML_TRAINING_DATA]

    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ('clf',   LogisticRegression(max_iter=1000, C=1.0)),
    ])
    model.fit(X, y)

    y_pred = model.predict(X)
    acc    = accuracy_score(y, y_pred)
    print(f'  Emotion ML Model Accuracy: {acc * 100:.1f}%')

    os.makedirs('models', exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    print(f'  Emotion model saved to {MODEL_PATH}')
    return model


def load_emotion_model():
    if not os.path.exists(MODEL_PATH):
        print('  No saved model found — training now...')
        return train_emotion_model()
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)


_emotion_model = load_emotion_model()


def ml_detect(text: str) -> dict:
    emotion   = _emotion_model.predict([text])[0]
    intensity = round(float(_emotion_model.predict_proba([text]).max()), 2)
    return {'emotion': emotion, 'intensity': intensity, 'method': 'ml_model', 'keywords': []}


#  COMBINED DETECTION — public function used by main.py

def detect_emotion(text: str) -> dict:
    if not text or not text.strip():
        return {'emotion': 'Calm', 'intensity': 0.5, 'method': 'default', 'keywords': []}

    keyword_result = keyword_detect(text)
    if keyword_result is not None:
        return keyword_result

    return ml_detect(text)


# Quick test 
if __name__ == '__main__':
    print('\n── Emotion Detector Quick Test ──────────────────')
    tests = [
        ('I am absolutely exhausted today',         'Tired'),
        ('feeling great and full of energy',        'Happy'),
        ('so stressed about this deadline',         'Stressed'),
        ('just want a normal coffee',               'Calm'),
        ('my heart wont stop racing with worry',    'Anxious'),
        ('can barely keep my eyes open',            'Tired'),
        ('I am not happy at all today',             'Sad'),
        ('everything is piling up lately',          'Stressed'),
        ('I want a coffee please',                  'Calm'),
        ('i feel completely empty inside',          'Sad'),
    ]
    passed = 0
    for text, expected in tests:
        r = detect_emotion(text)
        status = 'PASS' if r['emotion'] == expected else f'FAIL (expected {expected})'
        print(f"  {r['emotion']:10s} ({r['intensity']:.2f}) [{r['method']:8s}] {status}  |  {text}")
        if r['emotion'] == expected:
            passed += 1
    print(f'\n  Result: {passed}/{len(tests)} correct')
