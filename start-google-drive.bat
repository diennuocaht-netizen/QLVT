@echo off
REM Google Drive Upload - Quick Start Script for Windows
REM This script starts both the API server and frontend
REM Usage: Just double-click this file

echo.
echo ========================================
echo Google Drive Integration - Quick Start
echo ========================================
echo.
echo This will start:
echo   1. API Server (port 3001) - handles Google Drive uploads
echo   2. Frontend (port 3004) - React app
echo.
echo Close either terminal window to stop both services.
echo.
pause

echo.
echo 1. Checking setup...
echo.

node scripts/diagnose.js

if errorlevel 1 (
    echo.
    echo ERROR: Setup check failed!
    echo Please fix the issues shown above.
    echo.
    pause
    exit /b 1
)

echo.
echo 2. Starting API Server on port 3001...
echo.

start "API Server - Google Drive Upload" cmd /k npm run api

echo Waiting 3 seconds for API server to start...
timeout /t 3 /nobreak

echo.
echo 3. Starting Frontend on port 3004...
echo.

start "Frontend - React App" cmd /k npm run dev

echo.
echo ========================================
echo Services Started!
echo ========================================
echo.
echo API Server:  http://localhost:3001
echo Frontend:    http://localhost:3004
echo.
echo The browser may open automatically.
echo If not, visit: http://localhost:3004
echo.
echo To upload files:
echo   1. Go to "Phiếu Nhập Kho"
echo   2. Create/Edit a receipt slip
echo   3. Upload a file
echo.
echo Keep both terminal windows open for services to run.
echo.
pause
