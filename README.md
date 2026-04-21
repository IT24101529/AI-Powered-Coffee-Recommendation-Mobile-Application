Full AI/ML Overhaul — All 6 Microservices + Frontend
Complete overhaul of every AI model in the Ember Coffee stack, using the provided production datasets, fixing critical accuracy issues, and upgrading the diagnostic suite.

User Review Required
IMPORTANT

This is a major overhaul touching every microservice. Each change is designed to fix a specific problem you identified. Please review each section carefully.

WARNING

XGBoost is not installed in the trend service venv. I will use sklearn.ensemble.GradientBoostingRegressor instead — it's already available and produces comparable results without needing a new dependency.

Proposed Changes
1. Frontend — Auto-Greeting + Quick Reply Fix
[MODIFY] 
ChatbotScreen.js
Auto-greeting: Add a useEffect that fires once sessionReady && contextData are available. It will call the backend /chat endpoint with a special __init__ message (or call a new /session/greeting endpoint) to get the weather-aware greeting automatically — no user input needed.
Quick reply fix: Only render quickReplies on the most recent bot message. When a new bot message arrives, strip quickReplies from all previous messages to prevent stale button triggers.
[MODIFY] 
main.py
 (Backend)
Add a POST /session/greeting endpoint that calls handle_greeting() directly, returning the weather-aware greeting + quick replies without requiring any user message.
2. Intent Classifier — Train on 27K Bitext Dataset (Wijerathna)
Problem: 56% accuracy on 160 hand-crafted samples. Basically a coin toss.

Fix: Train on the 27K Bitext Customer Support Dataset by mapping its 27 intents to our 8 chatbot intents.

[MODIFY] 
intent_classifier.py
Dataset mapping (Bitext → BrewBot):
Bitext Intent	→	BrewBot Intent
place_order, cancel_order, change_order	→	Order
complaint	→	Complaint
review	→	Feedback
check_invoice, check_payment_methods, delivery_options, delivery_period, check_refund_policy, get_refund, track_refund, check_cancellation_fee, track_order	→	Question
contact_customer_service, contact_human_agent	→	Browse
create_account, delete_account, edit_account, recover_password, switch_account, registration_problems, payment_issue, newsletter_subscription, set_up_shipping_address, change_shipping_address, get_invoice	→	Question
Augment with our existing 160 hand-crafted samples (Greeting, Suggest, Goodbye intents that don't exist in Bitext).
Algorithm: Keep LinearSVC (proven best for large text classification) but now with 27K+ training samples.
Evaluation: Use StratifiedKFold(k=5) cross-validation instead of a single random split.
Target: >90% accuracy.
[MODIFY] 
training_data.py
Keep existing hand-crafted data as-is. The classifier will now load from both sources.
3. Emotion ML — Fix Overfitting with Real Dataset (Bandara)
Problem: 100% accuracy = pure memorization of 230 duplicated samples.

Fix: Train on the Emotion_final.csv dataset (21,459 real-world samples).

[MODIFY] 
emotion_detector.py
Dataset mapping (Emotion_final → BrewBot):
Dataset Emotion	→	BrewBot Emotion
happy	→	Happy
sadness	→	Sad
anger	→	Stressed
fear	→	Anxious
love	→	Excited
surprise	→	Excited
Model constraints (to prevent overfitting):
max_depth=10 (was unlimited)
min_samples_leaf=5 (forces generalization)
n_estimators=200
Evaluation: Use StratifiedKFold(k=5) cross-validation.
Add "Tired" and "Calm" classes by keeping our existing hand-crafted samples for those emotions (they don't exist in the dataset).
Target: 75-85% accuracy (realistic for emotion detection).
4. AR Forecaster — Replace LinearRegression with GradientBoosting (Ishaak)
Problem: R²=-9.761. The linear model is worse than guessing the average.

Fix: Switch to GradientBoostingRegressor which handles non-linear sales patterns.

[MODIFY] 
forecaster.py
Replace LinearRegression with GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.1).
Increase lags from 3 to 7 (capture weekly seasonality).
Add day-of-week as an extra feature (coffee sales are cyclical).
Use proper train/test time-series split (no random shuffle — chronological split).
Target: R² > 0.3, MAE < 3.0.
5. Contextual Bandit Upgrade (Aaquif)
Current: Thompson Sampling works well (66.7% for hybrid).

Upgrade: Make it a Contextual Bandit — track state-dependent win rates.

[MODIFY] 
bandit.py
Add context-awareness: Instead of global α/β for each arm, track per-context α/β where context = mood (e.g., hybrid|Stressed has its own α/β).
Fall back to global α/β when a context has < 3 observations.
The thompson_sampling() function will now accept an optional mood parameter.
[MODIFY] 
strategy_selector.py
Pass the user's mood to thompson_sampling().
6. Product Matcher — L2 Normalization (Ekanayake)
Problem: Context weight biases (e.g., caffeine=2.5) distort vector magnitudes, making cosine similarity erratic.

Fix: L2-normalize both vectors before computing the dot product.

[MODIFY] 
matcher.py
After applying context weights, L2-normalize both user_vec and product_vec using sklearn.preprocessing.normalize.
This ensures similarity scores stay strictly in [0.0, 1.0].
7. Context Service — Add to Diagnostic Suite (Ranasinghe)
Problem: The decision_tree.py (RandomForest context classifier) is completely missing from model_accuracy_summary.py.

[MODIFY] 
model_accuracy_summary.py
Add evaluate_context() function that trains/evaluates the context RandomForest with proper cross-validation.
Update all evaluation functions to use real datasets:
Intent: Load from Bitext CSV + hand-crafted data, use 5-fold CV.
Emotion: Load from Emotion_final.csv, use 5-fold CV.
Forecast: Use GradientBoosting with time-series split.
Make output more detailed: add per-class precision/recall, confusion matrix summary, and cross-validation std deviation.
Verification Plan
Automated Tests
bash
python ai_microservices/model_accuracy_summary.py
Expected output targets:

Model	Current	Target
Intent Classifier	56.2%	>90%
Emotion ML	100% (overfit)	75-85% (real)
Context RF	Not reported	>95%
AR Forecast R²	-9.76	>0.3
Bandit	Working ✓	Contextual ✓
Matcher	Unbounded scores	[0,1] range ✓
Manual Verification
Open chat → greeting appears automatically with weather.
Type "What is 10-8?" → bot politely refuses (no goodbye).
Quick reply buttons only appear on the latest bot message.




- Chat requests
The database is currently incomplete. Here is the full database details.
1. Chatbot Core and Intent Handler (chatbot backend)
    - Sessions: session_id(pk), state, step, mood, temp_pref, last_recommendation, created_at
    - Intents: intent_id(pk), intent_name, intent_type, description
    - User Queries: query_id(pk), session_id(fk), user_input, intent_id(fk), confidence, created_at
    - Responses: response_id(pk), intent_id(fk), response_text, response_type
    - Context Variables: context_id(pk), session_id(fk), variable_name, variable_value, updated_at

2. Sentiment and Emotion Analysis (sentiment service)
    - sessions: session_id(pk), user_id(fk), created_at, state
    - emotion_logs: log_id(pk), session_id(fk), keyword_id(fk), message_text, sentiment_polarity, sentiment score, emotion_label, intensity, detection_method, keywords_found, tone_style, recommendation_strategy, created_at
    - emotion_keywords: keword_id(pk), emotion, keyword, weight, is_active, created_at
    - session_mood_summary: summary_id(pk), session_id(fk), current_mood, dominant_mood, mood_trend, message_count, last_score, updated_at
    - recommenation_feedback: feedback_id(pk), log_id(fk), session_id(fk), rating, accepted, emotion_was, strategy_used, submitted_at

3. Context Integration Service (context service)
    - Session: session_id(pk), user_id(fk), created_at, state
    - Context Logs: id(pk), session_id(fk), weather_cache_id(fk), temp_tag, condition_tag, time_of_day, weight_vector, is_override, created_at
    - Weather Cache: id(pk), location, temperature_celcius, condition, humidity_percent, wind_speed_ms, raw_description, fetched_at, expires_at
    - Contect Rules (Read only): id(pk), weather_condition, temp_tag, time_of_day, recommended_type, weight_json, confidence_score

4. Content-Based Filtering Service (product service)
    - Category: category_id(PK), category_name
    - Products: product_id(PK), category_id(FK), name, description, price, image_url, sweetness, bitterness, acidity, richness, caffine_level, temperature, calories, fat_content, sugar_content, popularity_score, feature_vector
    - User: user_id(PK), name, email, password, created_at, preference_id(fk)
    - User Preferences: preference_id(PK), user_id(FK), sweetness, bitterness, acidity, richness, caffine_level, temperature
    - Recommendation_history: recommendation_id(PK), user_id(FK), product_id(FK),  recommended_at, score

5. Feddback and Optimization Loop (feedback service)
    - sessions: session_id(pk), user_id(fk), created_at, state
    - feedback: feedback_id(pk), session_id(fk), user_id(fk), product_id(fk) product_name, strategy_used, rating, accepted, user_mood, weather_context, timestamp, notes
    - strategy_scores: id(pk), strategy_used, total_attempts, total_accepted, total_rating, success_rate, avg_rating, last_updated

6. Trend Service
