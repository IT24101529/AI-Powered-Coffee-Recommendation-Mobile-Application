@echo off
setlocal
set "ROOT_DIR=%~dp0"
echo [DEBUG] ROOT_DIR is: "%ROOT_DIR%"

set "CUR_DIR=%ROOT_DIR%ai_microservices\coffee_chatbot_backend"
echo [DEBUG] Attempting to cd to: "%CUR_DIR%"
cd /d "%CUR_DIR%"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to change directory to "%CUR_DIR%"
    pause
    exit /b %errorlevel%
)

echo [DEBUG] Now in: "%CD%"
if exist "venv\Scripts\activate.bat" (
    echo [DEBUG] Found venv, activating...
    call venv\Scripts\activate
) else (
    echo [ERROR] No venv found in "%CD%"
    pause
    exit /b 1
)

echo [DEBUG] Active Venv: "%VIRTUAL_ENV%"
echo [DEBUG] Attempting to start uvicorn...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
