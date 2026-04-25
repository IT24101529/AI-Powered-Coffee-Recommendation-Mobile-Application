# EMBER Coffee Co. — AI-Powered Personalized Coffee Experience

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React Native](https://img.shields.io/badge/Mobile-React_Native-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)

**EMBER Coffee Co.** is a next-generation coffee recommendation ecosystem that uses Artificial Intelligence to match users with their perfect brew. By analyzing mood, weather, time of day, and personal taste preferences, EMBER transforms a simple coffee order into a curated experience.

---

## 🚀 Vision
To revolutionize the coffee industry by integrating modern AI/ML techniques into the daily ritual of coffee selection, making every cup feel uniquely crafted for the moment.

## ✨ Key Features
- **🤖 Intelligence-Driven Chatbot**: A natural language interface that understands intent and provides context-aware suggestions.
- **🎭 Sentiment & Emotion Analysis**: Analyzes user input to detect moods (Tired, Stressed, Happy, etc.) and adjusts tone and recommendations accordingly.
- **☁️ Context-Aware Engine**: Considers external factors like weather (Cold/Hot) and time of day (Morning/Night) to suggest the most suitable beverages.
- **📊 Trending & Popularity Tracking**: Real-time tracking of what's popular among the EMBER community.
- **📱 Modern Mobile Experience**: A sleek, intuitive React Native application built with Expo.

---

## 🏗️ System Architecture
EMBER is built on a robust **Microservices Architecture**, ensuring scalability and separation of concerns.

### 1. Frontend (Mobile App)
- **Tech Stack**: React Native (Expo), Redux, Axios.
- **Location**: `/EmberCoffeeCo`
- **Responsibility**: User interface, chat interaction, and order management.

### 2. Main Backend (Core API)
- **Tech Stack**: Node.js, Express.js, MongoDB (Mongoose).
- **Location**: `/ember-coffee-api`
- **Responsibility**: User authentication (BCrypt/JWT), database management, and transaction processing.

### 3. AI Microservices (Intelligence Layer)
A suite of Python-based services built with **FastAPI**:
- **Chatbot Backend**: Orchestrates the conversation flow and intent classification.
- **Sentiment Service**: Uses VADER and custom keyword analysis for emotion detection.
- **Context Service**: Processes weather and time-based data for recommendation weighting.
- **Product Service**: Implements Content-Based Filtering using Cosine Similarity to find the best product matches.
- **Trend Service**: Analyzes sales patterns to identify trending items.
- **Feedback Service**: Manages user ratings and enhances the continuous learning loop.

---

## 📂 Repository Structure
```text
EMBER-Coffee-Co/
├── EmberCoffeeCo/          # React Native Mobile App
├── ember-coffee-api/       # Main Node.js Backend
├── ai_microservices/       # Intelligence Layer (Python/FastAPI)
│   ├── coffee_chatbot_backend/
│   ├── coffee_sentiment_service/
│   ├── coffee_context_service/
│   ├── coffee_product_service/
│   ├── coffee_trend_service/
│   └── coffee_feedback_service/
├── products.json           # Centralized Product Catalog
├── users.json              # User Base Mock Data
├── start_all.bat           # One-click system startup script
└── README.md               # You are here
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB** (Local or Atlas)
- **Expo Go** (SDK 55 - for mobile testing)

### Step 1: Clone the Repository
```bash
git clone https://github.com/IT24101529/AI-Powered-Coffee-Recommendation-Mobile-Application.git
cd EMBER-Coffee-Co
```
The Fully Tested Application is pushed to the branch "**EmberCoffeeCo**".

### Step 2: Setup Environment Variables
Create `.env` files in:
- `/ember-coffee-api/.env`
- `/EmberCoffeeCo/.env`
- Each microservice directory within `/ai_microservices`

### Step 3: Install Dependencies
```bash
# Main Backend
cd ember-coffee-api && npm install

# Frontend
cd ../EmberCoffeeCo && npm install

# AI Microservices (Example for Product Service)
cd ../ai_microservices/coffee_product_service
pip install -r requirements.txt
```

### Step 4: Run the System
For Windows users, use the provided startup script:
```bash
start_all.bat
```
This will launch the Expo development server, the Main Node.js API, and all AI microservices in separate terminal windows.

---

## 👥 Meet the Team
*Project developed for the IT2021 AIML Module.*
- **Wijerathna** — Chatbot Core & Orchestration
- **Bandara** — Sentiment & Emotion Analysis
- **Ranasinghe** — Context-Aware Integration
- **Ekanayake** — Product Service
- **Ishaak** — Trending Analysis & Popularity Logic
- **Aaquif** — Feedback Loop & Adaptive Learning
---

