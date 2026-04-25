@echo off
<<<<<<< HEAD
setlocal
echo ===================================================
2nd Year 2nd Semester\IT2021 - AIML Project\AI Project\EMBER Coffee Co\stop_all.bat; echo   EMBER COFFEE CO - GLOBAL CLEANUP
echo ===================================================

echo [1/3] Terminating Python/Uvicorn Microservices...
taskkill /F /IM uvicorn.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1

echo [2/3] Terminating Node/Mobile App Processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo [3/3] Closing specific CMD windows by title...
taskkill /F /FI "WINDOWTITLE eq Ember Mobile App*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Ember Main Backend*" /T >nul 2>&1
=======
echo ===================================================
echo   Stopping Ember Coffee Co Microservices
echo ===================================================

echo Killing uvicorn processes...
taskkill /F /IM uvicorn.exe /T >nul 2>&1

echo Closing CMD windows...
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
taskkill /F /FI "WINDOWTITLE eq Chatbot Backend*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Sentiment Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Context Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Product Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Trend Service*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Feedback Service*" /T >nul 2>&1
<<<<<<< HEAD

echo.
echo ===================================================
echo   System cleanup successful. All ports released.
echo ===================================================
=======
taskkill /F /FI "WINDOWTITLE eq Ember Mobile App*" /T >nul 2>&1

echo Done!
>>>>>>> b3b40c1cbab73a4be9054ae12b0b384e3224533b
pause
