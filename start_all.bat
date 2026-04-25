@echo off
<<<<<<< HEAD
setlocal enabledelayedexpansion
set "ROOT_DIR=%~dp0"

echo ===================================================
echo   EMBER COFFEE CO - GLOBAL STARTUP (SIMPLIFIED)
echo   Script Dir: %ROOT_DIR%
echo ===================================================

:: --- [1] FRONTEND ---
echo [1/8] Starting Frontend Application (Expo)
cd /d "%ROOT_DIR%EmberCoffeeCo"
start "Ember Mobile App" cmd /k "npx expo start"

:: --- [2] MAIN API ---
echo [2/8] Starting Main Backend API (Port 5000)
cd /d "%ROOT_DIR%ember-coffee-api"
start "Ember Main Backend" cmd /k "set HOST=0.0.0.0&& npm run dev"

:: --- MICROSERVICES ---

:: [3] CHATBOT
echo [3/8] Starting Chatbot API (Port 8000)
set "CUR_DIR=%ROOT_DIR%ai_microservices\coffee_chatbot_backend"
cd /d "%CUR_DIR%"
start "Chatbot Backend" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: [4] SENTIMENT
echo [4/8] Starting Sentiment Service (Port 8001)
set "CUR_DIR=%ROOT_DIR%ai_microservices\coffee_sentiment_service"
cd /d "%CUR_DIR%"
start "Sentiment Service" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

:: [5] CONTEXT
echo [5/8] Starting Context Service (Port 8002)
set "CUR_DIR=%ROOT_DIR%ai_microservices\coffee_context_service"
cd /d "%CUR_DIR%"
start "Context Service" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload"

:: [6] PRODUCT
echo [6/8] Starting Product Service (Port 8003)
set "CUR_DIR=%ROOT_DIR%ai_microservices\coffee_product_service"
cd /d "%CUR_DIR%"
start "Product Service" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload"

:: [7] TREND
echo [7/8] Starting Trend Service (Port 8004)
set "CUR_DIR=%ROOT_DIR%ai_microservices\coffee_trend_service"
cd /d "%CUR_DIR%"
start "Trend Service" cmd /k "venv\Scripts\activate.bat && python data_seeder.py && python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload"

:: [8] FEEDBACK
echo [8/8] Starting Feedback Service (Port 8005)
set "CUR_DIR=%ROOT_DIR%ai_microservices\coffee_feedback_service"
cd /d "%CUR_DIR%"
start "Feedback Service" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload"

:: --- WRAP UP ---
echo ===================================================
echo   All components are starting in separate windows.
echo   Verify each window for a successful startup.
=======
echo ===================================================
echo   Starting Ember Coffee Co Platform & Microservices
echo ===================================================

echo [1/8] Starting Frontend Application (Expo)
cd "EmberCoffeeCo"
start "Ember Mobile App" cmd /k "npx expo start"
cd ..

echo [2/8] Starting Main Backend API (Port 5000)
cd "ember-coffee-api"
start "Ember Main Backend" cmd /k "set HOST=0.0.0.0&& npm run dev"
cd ..

echo [3/8] Starting Chatbot API (Port 8000)
cd "ai_microservices\coffee_chatbot_backend"
start "Chatbot Backend" cmd /k "if exist venv\Scripts\activate (call venv\Scripts\activate) && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
cd ..\..

echo [4/8] Starting Sentiment Service (Port 8001)
cd "ai_microservices\coffee_sentiment_service"
start "Sentiment Service" cmd /k "if exist venv\Scripts\activate (call venv\Scripts\activate) && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
cd ..\..

echo [5/8] Starting Context Service (Port 8002)
cd "ai_microservices\coffee_context_service"
start "Context Service" cmd /k "if exist venv\Scripts\activate (call venv\Scripts\activate) && uvicorn main:app --host 0.0.0.0 --port 8002 --reload"
cd ..\..

echo [6/8] Starting Product Service (Port 8003)
cd "ai_microservices\coffee_product_service"
start "Product Service" cmd /k "if exist venv\Scripts\activate (call venv\Scripts\activate) && uvicorn main:app --host 0.0.0.0 --port 8003 --reload"
cd ..\..

echo [7/8] Starting Trend Service (Port 8004)
cd "ai_microservices\coffee_trend_service"
start "Trend Service" cmd /k "if exist venv\Scripts\activate (call venv\Scripts\activate) && python data_seeder.py && uvicorn main:app --host 0.0.0.0 --port 8004 --reload"
cd ..\..

echo [8/8] Starting Feedback Service (Port 8005)
cd "ai_microservices\coffee_feedback_service"
start "Feedback Service" cmd /k "if exist venv\Scripts\activate (call venv\Scripts\activate) && uvicorn main:app --host 0.0.0.0 --port 8005 --reload"
cd ..\..

echo ===================================================
echo   All components are starting in separate windows.
echo   You can close this window now.
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
echo ===================================================
pause
