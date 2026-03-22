# training_data.py
# This file contains all the labelled training sentences for your AI model.
# Add more sentences to improve accuracy!

TRAINING_DATA = [
    # --- Greeting ---
    ('hi', 'Greeting'),
    ('hello', 'Greeting'),
    ('hey there', 'Greeting'),
    ('good morning', 'Greeting'),
    ('good evening', 'Greeting'),
    ('howdy', 'Greeting'),
    ('hi chatbot', 'Greeting'),
    ('hello i am here', 'Greeting'),

    # --- Order ---
    ('i want a coffee', 'Order'),
    ('can i order please', 'Order'),
    ('i would like to buy a drink', 'Order'),
    ('place an order for me', 'Order'),
    ('get me a cappuccino', 'Order'),
    ('i will take an espresso', 'Order'),

    # --- Suggest ---
    ('what do you recommend', 'Suggest'),
    ('surprise me', 'Suggest'),
    ('what should i drink', 'Suggest'),
    ('suggest something for me', 'Suggest'),
    ('i dont know what to order', 'Suggest'),
    ('help me choose a coffee', 'Suggest'),
    ('any recommendations', 'Suggest'),

    # --- Question ---
    ('what is a latte', 'Question'),
    ('how much caffeine is in espresso', 'Question'),
    ('what ingredients are in this', 'Question'),
    ('is this coffee sweet', 'Question'),
    ('how many calories', 'Question'),
    ('tell me about americano', 'Question'),

    # --- Complaint ---
    ('this is too bitter', 'Complaint'),
    ('i dont like this recommendation', 'Complaint'),
    ('that was not good', 'Complaint'),
    ('this coffee is too strong', 'Complaint'),
    ('not what i wanted', 'Complaint'),

    # --- Feedback ---
    ('that was great', 'Feedback'),
    ('loved it thank you', 'Feedback'),
    ('perfect recommendation', 'Feedback'),
    ('i enjoyed that coffee', 'Feedback'),
    ('five stars', 'Feedback'),
    ('that was exactly what i needed', 'Feedback'),

    # --- Browse ---
    ('show me the menu', 'Browse'),
    ('what drinks do you have', 'Browse'),
    ('what options are available', 'Browse'),
    ('list all coffees', 'Browse'),
    ('what can i order', 'Browse'),

    # --- Goodbye ---
    ('bye', 'Goodbye'),
    ('goodbye', 'Goodbye'),
    ('thanks see you later', 'Goodbye'),
    ('that will be all', 'Goodbye'),
    ('i am done', 'Goodbye'),
]
