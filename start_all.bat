@echo off
setlocal enabledelayedexpansion
set "ROOT_DIR=%~dp0"

echo.
echo  ███████╗███╗   ███╗██████╗ ███████╗██████╗
echo  ██╔════╝████╗ ████║██╔══██╗██╔════╝██╔══██╗
echo  █████╗  ██╔████╔██║██████╔╝█████╗  ██████╔╝
echo  ██╔══╝  ██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██╗
echo  ███████╗██║ ╚═╝ ██║██████╔╝███████╗██║  ██║
echo  ╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
echo.
echo  EMBER Coffee Co. — Full System Startup
echo  ==========================================
echo  Ensure MongoDB and PostgreSQL are running.
echo  ==========================================
echo.

:: ─── [1] MAIN BACKEND ─────────────────────────────────────────────────
echo [1/8] Starting Main Backend API (Node.js) on PORT 5000...
cd /d "%ROOT_DIR%ember-coffee-api"
start "EMBER Backend (Port 5000)" cmd /k "set HOST=0.0.0.0 && npm run dev"
timeout /t 3 /nobreak >nul

:: ─── [2] FRONTEND ─────────────────────────────────────────────────────
echo [2/8] Starting Expo Frontend (React Native)...
cd /d "%ROOT_DIR%EmberCoffeeCo"
start "EMBER Mobile App (Expo)" cmd /k "npx expo start"
timeout /t 2 /nobreak >nul

:: ─── AI MICROSERVICES ─────────────────────────────────────────────────

:: [3] CHATBOT BACKEND (Orchestrator)
echo [3/8] Starting Chatbot Backend on PORT 8000...
cd /d "%ROOT_DIR%ai_microservices\coffee_chatbot_backend"
start "AI Chatbot (Port 8000)" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul

:: [4] SENTIMENT SERVICE
echo [4/8] Starting Sentiment Service on PORT 8001...
cd /d "%ROOT_DIR%ai_microservices\coffee_sentiment_service"
start "AI Sentiment (Port 8001)" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 3 /nobreak >nul

:: [5] CONTEXT SERVICE
echo [5/8] Starting Context-Aware Service on PORT 8002...
cd /d "%ROOT_DIR%ai_microservices\coffee_context_service"
start "AI Context (Port 8002)" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload"
timeout /t 3 /nobreak >nul

:: [6] PRODUCT RECOMMENDATION SERVICE
echo [6/8] Starting Product Recommendation Service on PORT 8003...
cd /d "%ROOT_DIR%ai_microservices\coffee_product_service"
start "AI Products (Port 8003)" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload"
timeout /t 3 /nobreak >nul

:: [7] TREND SERVICE (seeds sales data first)
echo [7/8] Starting Trend Analytics Service on PORT 8004...
cd /d "%ROOT_DIR%ai_microservices\coffee_trend_service"
start "AI Trends (Port 8004)" cmd /k "venv\Scripts\activate.bat && python data_seeder.py && python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload"
timeout /t 3 /nobreak >nul

:: [8] FEEDBACK / BANDIT SERVICE
echo [8/8] Starting Feedback & Learning Service on PORT 8005...
cd /d "%ROOT_DIR%ai_microservices\coffee_feedback_service"
start "AI Feedback (Port 8005)" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload"

:: ─── DONE ─────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   All 8 components launched in separate terminal windows.
echo.
echo   Service               Port   Window Title
echo   ─────────────────── ─────── ──────────────────────────
echo   Main Backend          5000   EMBER Backend
echo   Expo Frontend         19000  EMBER Mobile App
echo   Chatbot (AI)          8000   AI Chatbot
echo   Sentiment (AI)        8001   AI Sentiment
echo   Context/Weather (AI)  8002   AI Context
echo   Product Rec (AI)      8003   AI Products
echo   Trend Analytics (AI)  8004   AI Trends
echo   Feedback/Bandit (AI)  8005   AI Feedback
echo  ============================================================
echo   Scan the QR code in the Expo window to open on your phone.
echo  ============================================================
echo.
pause
