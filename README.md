<div align="center">

# ☕ EMBER Coffee Co.
### AI-Powered Personalized Coffee Experience

*A full-stack mobile application built for two modules simultaneously — Web & Mobile Technologies (SE2020) and AI & Machine Learning (IT2021)*

---

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

</div>

---

## 📖 Project Overview

**EMBER Coffee Co.** is a next-generation coffee shop mobile application that transforms the daily ritual of ordering coffee into a personalized, AI-driven experience. By analyzing the user's **mood**, **real-time weather**, **time of day**, and **personal health preferences**, EMBER suggests the perfect brew — every time.

> **"Two birds, one stone"** — This single project satisfies the requirements of two university modules by integrating a production-grade full-stack mobile app with a sophisticated AI/ML microservices layer.

---

## 🎓 Module Coverage

| Module | Code | Description | Tech |
|--------|------|-------------|------|
| **Web & Mobile Technologies** | SE2020 | Full-stack mobile application for a coffee shop | React Native, Node.js, MongoDB |
| **AI & Machine Learning Project** | IT2021 | Intelligent recommendation engine with 6 AI microservices | Python, FastAPI, Gemini LLM, scikit-learn |

---

## ✨ Key Features

### 🛍️ Core App (SE2020)
- **User Authentication** — JWT-based secure login/register with bcrypt password hashing
- **Product Catalog** — Browsable coffee menu with category filters, search, and availability management
- **Shopping Cart & Checkout** — Full cart logic with promo code validation and payment screenshot upload
- **Order Lifecycle** — Real-time order tracking from Pending → Brewing → Ready → Delivered
- **Loyalty & Rewards** — Points-based tier system (Seedling → Ember Elite) with reward redemption
- **Reviews & Ratings** — Product and store-wide reviews with photo uploads and 1–5 star ratings
- **Promotions System** — CRUD for discount codes with expiry validation at checkout
- **Admin Dashboard** — Role-based (Admin/Manager) panel for managing products, orders, users, rewards, and promotions
- **Image Management** — All images hosted on **Cloudinary CDN**

### 🤖 AI Layer (IT2021)
- **Conversational Chatbot** — NLP-powered barista that guides users to their perfect coffee
- **Sentiment & Emotion Analysis** — Detects mood (Tired, Stressed, Happy, etc.) from natural language
- **Context-Aware Recommendations** — Integrates live weather and time of day to weight suggestions
- **Content-Based Filtering** — Cosine similarity matching on a multi-dimensional coffee feature vector
- **Trend Analytics** — Velocity-based trending scores with tier classification (Bestseller, Hidden Gem)
- **Continuous Learning** — Contextual Multi-Armed Bandit (Thompson Sampling) that improves with every rating

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│            📱 React Native Mobile App (Expo)                 │
│                     /EmberCoffeeCo                           │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP REST
          ┌─────────────┴──────────────────────┐
          │                                    │
┌─────────▼─────────────┐      ┌───────────────▼─────────────────────────────────┐
│  ⚙️  Main Backend      │      │        🤖 AI Microservices (Python/FastAPI)     │
│  Node.js + Express.js  │      │                                                 │
│  MongoDB + Mongoose    │      │  Port 8000  Chatbot Orchestrator (Gemini LLM)   │
│  Cloudinary CDN        │      │  Port 8001  Sentiment & Emotion Detector        │
│  JWT + bcrypt Auth     │      │  Port 8002  Context Service (Weather + Time)    │
│  /ember-coffee-api     │      │  Port 8003  Product Recommendation Engine       │
│                        │      │  Port 8004  Trend Analytics Service             │
│  REST Endpoints:       │      │  Port 8005  Feedback & Bandit Learning          │
│  /api/auth             │      └─────────────────────────────────────────────────┘
│  /api/products         │
│  /api/orders           │
│  /api/promotions       │
│  /api/rewards          │
│  /api/reviews          │
└────────────────────────┘
```

---

## 👥 Team & Individual Contributions

### SE2020 — Web & Mobile Technologies

| Member | Student ID | Module | Responsibilities |
|--------|-----------|--------|-----------------|
| **E.M.T.D.B. Ekanayake** | IT24100917 | User Auth & Profile | JWT authentication, bcrypt hashing, registration/login, profile management, admin user CRUD, auth middleware |
| **M.R.C.D. Bandara** | IT24102854 | Menu & Products | Full product CRUD, category grouping, availability management, admin product screens, Cloudinary image upload |
| **M.F. Aaquif** | IT24101109 | Order Processing | Cart & checkout logic, order lifecycle, payment screenshot upload, order history, admin order dashboard, cancellation |
| **B.G.G.S. Wijerathna** | IT24101058 | Loyalty & Rewards | Reward CRUD, loyalty point tracking, atomic redemption, redemption history, rewards dashboard |
| **M.I.M. Ishaak** | IT24100497 | Reviews & Ratings | Product and store-wide review CRUD, star ratings, photo uploads, public feeds, owner-only permissions |
| **R.M.N.K. Ranasinghe** | IT24101529 | Promotions & Deployment | Promo code CRUD, discount logic, checkout validation, Railway deployment, MongoDB Atlas, global error handling |

**Shared Responsibilities**: UI/UX consistency · Cloudinary integration · Unit and property-based testing (Jest + fast-check) · Documentation

---

### IT2021 — AI & Machine Learning

| Member | Student ID | AI Feature | Techniques Used |
|--------|-----------|------------|----------------|
| **B.G.G.S. Wijerathna** | IT24101058 | Chatbot Core & Orchestration | Gemini 2.5 Flash agentic reasoning, local intent classifier, conversation state machine, RAG knowledge base |
| **M.R.C.D. Bandara** | IT24102854 | Sentiment & Emotion Analysis | 2-layer: keyword matching + RandomForest TF-IDF (21K training samples, 5-fold CV) |
| **R.M.N.K. Ranasinghe** | IT24101529 | Context-Aware Integration | OpenWeatherMap API, Decision Tree, Fuzzy Logic, time-of-day classification |
| **M.I.M. Ishaak** | IT24100497 | Trend Analytics & Popularity | Sales velocity scoring, growth rate analysis, tier classification (Bestseller / Trending Up / Hidden Gem) |
| **E.M.T.D.B. Ekanayake** | IT24100917 | Product Recommendation Engine | Content-based filtering, Cosine Similarity on 6D feature vectors |
| **M.F. Aaquif** | IT24101109 | Feedback & Continuous Learning | Contextual Multi-Armed Bandit with Bayesian Thompson Sampling |

---

## 📱 Screenshots

> 📸 *Run the app locally and use Expo Go to explore all features*

---

## 🛠️ Local Development Setup

> **Prerequisites**: Node.js v18+, Python 3.10+, MongoDB (local), PostgreSQL (local), Expo Go app on your phone

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd "EMBER Coffee Co"
```

### Step 2: Find Your Local IP Address

You need your machine's Wi-Fi IP so Expo Go on your phone can reach the local backend.

```powershell
# Windows
ipconfig
# Look for "IPv4 Address" under "Wireless LAN adapter Wi-Fi"
```

### Step 3: Set Up Environment Files

#### Main Backend — `ember-coffee-api/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/CoffeeDB
MONGO_URI_TEST=mongodb://localhost:27017/CoffeeDB
JWT_SECRET=<generate-a-strong-secret>
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

#### Mobile App — `EmberCoffeeCo/.env`
```env
EXPO_PUBLIC_API_HOST=192.168.x.x   # <-- your Wi-Fi IP here
```

#### AI Chatbot — `ai_microservices/coffee_chatbot_backend/.env`
```env
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/coffee_db
MONGO_URI=mongodb://localhost:27017/CoffeeDB
SENTIMENT_API=http://localhost:8001
CONTEXT_API=http://localhost:8002
PRODUCT_API=http://localhost:8003
LLM_ENABLED=true
```

#### Context Service — `ai_microservices/coffee_context_service/.env`
```env
OPENWEATHER_API_KEY=<your-openweather-key>
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/coffee_db
DEFAULT_LOCATION=Kandy,LK
```

#### All other AI services — set `DATABASE_URL` pointing to your local PostgreSQL.

### Step 4: Install Dependencies

```bash
# Main Backend
cd ember-coffee-api && npm install

# Mobile App
cd ../EmberCoffeeCo && npm install

# Each AI service (example — repeat for all 6)
cd ../ai_microservices/coffee_chatbot_backend
python -m venv venv
venv\Scripts\activate        # Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### Step 5: Seed MongoDB

```bash
cd ember-coffee-api
node seed.mjs --local
# Seeds: 15 users, 31 products, 3 promotions, 3 rewards, 5 orders, 3 reviews
```

### Step 6: Start All Services

**Windows — One-Click:**
```bash
start_all.bat
```

**Manual — open 8 separate terminals:**

| Service | Command | Port |
|---------|---------|------|
| Main Backend | `cd ember-coffee-api && npm run dev` | 5000 |
| Mobile App | `cd EmberCoffeeCo && npx expo start` | 19000 |
| Chatbot | `cd ai_microservices/coffee_chatbot_backend && uvicorn main:app --port 8000 --reload` | 8000 |
| Sentiment | `cd ai_microservices/coffee_sentiment_service && uvicorn main:app --port 8001 --reload` | 8001 |
| Context | `cd ai_microservices/coffee_context_service && uvicorn main:app --port 8002 --reload` | 8002 |
| Products | `cd ai_microservices/coffee_product_service && uvicorn main:app --port 8003 --reload` | 8003 |
| Trends | `cd ai_microservices/coffee_trend_service && uvicorn main:app --port 8004 --reload` | 8004 |
| Feedback | `cd ai_microservices/coffee_feedback_service && uvicorn main:app --port 8005 --reload` | 8005 |

### Step 7: Open on Your Phone

Scan the QR code in the Expo terminal with **Expo Go**.

---

## ⚡ Service Health Checks

```bash
curl http://localhost:5000/api/health   # Main Backend
curl http://localhost:8000/             # Chatbot
curl http://localhost:8001/             # Sentiment
curl http://localhost:8002/context/time # Context
curl http://localhost:8003/             # Products
curl http://localhost:8004/             # Trends
curl http://localhost:8005/             # Feedback
```

---

## 🧪 Running Tests

```bash
# Node.js backend (Jest + supertest + fast-check)
cd ember-coffee-api && npm test

# Python AI services (pytest)
cd ai_microservices/coffee_chatbot_backend
pytest test_endpoints.py -v
```

---

## 📦 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile App | React Native (Expo ~55) | Cross-platform iOS & Android UI |
| Navigation | React Navigation v6 | Stack + Tab navigation |
| HTTP Client | Axios | API calls |
| Main Backend | Node.js + Express.js | RESTful API server |
| Database | MongoDB + Mongoose | Application database |
| Auth | JWT + bcrypt | Authentication & authorization |
| Image Storage | Cloudinary | Product / review / profile images |
| AI Orchestrator | FastAPI + Google Gemini | Chatbot + LLM reasoning |
| Emotion Detection | RandomForest + TF-IDF | Sentiment classification |
| Weather | OpenWeatherMap API | Real-time weather context |
| Recommendation | Cosine Similarity | Content-based filtering |
| Trend Analysis | Velocity formula | Sales trend scoring |
| Adaptive Learning | Thompson Sampling | Multi-armed bandit |
| AI Database | PostgreSQL (SQLAlchemy) | AI service data persistence |
| Deployment | Railway | Cloud deployment |
| APK Build | Expo EAS | Android APK generation |

---

## 📂 Project Structure

```
EMBER Coffee Co/
├── EmberCoffeeCo/                  # 📱 React Native Mobile App
│   ├── src/
│   │   ├── screens/                # 21 screens (Customer + Admin)
│   │   ├── components/             # Reusable UI + Chat components
│   │   ├── navigation/             # Stack & Tab navigators
│   │   ├── context/                # AuthContext, CartContext
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── config/                 # API URL configuration
│   │   └── theme/                  # Design tokens
│   └── App.js
├── ember-coffee-api/               # ⚙️ Node.js/Express Backend
│   └── src/
│       ├── controllers/            # 7 controllers
│       ├── models/                 # 8 Mongoose models
│       ├── routes/                 # 7 route files
│       ├── middleware/             # Auth + error handling
│       └── config/                 # DB connection
├── ai_microservices/               # 🤖 AI Intelligence Layer
│   ├── coffee_chatbot_backend/     # Port 8000
│   ├── coffee_sentiment_service/   # Port 8001
│   ├── coffee_context_service/     # Port 8002
│   ├── coffee_product_service/     # Port 8003
│   ├── coffee_trend_service/       # Port 8004
│   └── coffee_feedback_service/    # Port 8005
├── products.json                   # 31 coffee products (seed data)
├── users.json                      # 15 users (seed data)
├── orders.json                     # Sample orders
├── promotions.json                 # Promo codes
├── rewards.json                    # Reward catalog
├── reviews.json                    # Store reviews
└── start_all.bat                   # Windows one-click startup
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

*Built with ❤️ by the EMBER Coffee Co. Team — Faculty of Computing, SLIIT*
*Year 2 · Semester 2 · 2025/2026*

</div>
