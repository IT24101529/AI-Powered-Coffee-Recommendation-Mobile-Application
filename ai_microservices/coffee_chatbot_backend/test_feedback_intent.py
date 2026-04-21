from intent_classifier import predict_intent
import os

def test():
    phrase = "Rate this recommendation"
    intent, confidence = predict_intent(phrase)
    print(f"Phrase: '{phrase}' -> Intent: {intent} (Confidence: {confidence})")

if __name__ == "__main__":
    test()
