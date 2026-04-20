from intent_classifier import predict_intent

def test_greeting_intent():
    intent, confidence = predict_intent('hello')
    assert intent == 'Greeting', f'Expected Greeting, got {intent}'
    assert confidence > 0.7,    f'Confidence too low: {confidence}'

def test_suggest_intent():
    intent, confidence = predict_intent('what do you recommend')
    assert intent == 'Suggest'

def test_complaint_intent():
    intent, confidence = predict_intent('this coffee is too bitter')
    assert intent == 'Complaint'

def test_goodbye_intent():
    intent, confidence = predict_intent('goodbye see you later')
    assert intent == 'Goodbye'

def test_browse_intent():
    intent, confidence = predict_intent('show me what you have')
    assert intent == 'Browse'

print('All tests passed!')
