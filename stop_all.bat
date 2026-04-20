@echo off
echo ===================================================
echo   Stopping Ember Coffee Co Microservices
echo ===================================================

echo Killing uvicorn processes...
taskkill /F /IM uvicorn.exe /T >nul 2>&1

echo Closing CMD windows...
taskkill /F /FI "WINDOWTITLE eq Chatbot Backend*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Sentiment Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Context Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Product Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Trend Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Feedback Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Ember Mobile App*" /T >nul 2>&1

echo Done!
pause
