@echo off
REM CLINE: FULL SYSTEM – Camera Segmentation + Auto Valve (Windows compatible)
echo ==== DUCKWEED SEGMENTATION SYSTEM STARTUP ====

cd /d "%~dp0"
echo Current directory: %CD%

echo.
echo ==== 1) SETTING UP BACKEND ====

REM Create virtual environment if it doesn't exist
if not exist "server\.venv" (
    echo Creating Python virtual environment...
    python -m venv server\.venv
)

REM Activate virtual environment and install dependencies
echo Installing Python dependencies...
call server\.venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r server\requirements.txt

REM Start backend
echo Starting FastAPI backend...
cd server
start "Backend Server" cmd /k "uvicorn main:app --host 0.0.0.0 --port 8000"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo.
echo ==== 2) SETTING UP FRONTEND ====

REM Install frontend dependencies if needed
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install
)

REM Start frontend development server
echo Starting Vite development server...
start "Frontend Server" cmd /k "npm run dev -- --host"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo ==== SYSTEM STARTED ====
echo Backend: http://localhost:8000/status
echo Frontend: Check the Frontend Server window for the Network URL
echo Dashboard: Navigate to the frontend URL and go to Dashboard
echo.
echo ==== TESTING COMMANDS ====
echo curl -s http://127.0.0.1:8000/status
echo curl -X POST http://127.0.0.1:8000/valve/open
echo curl -X POST http://127.0.0.1:8000/valve/close
echo.
echo ==== CONFIGURATION ====
echo To change threshold: set DUCKWEED_CLOSE_THRESHOLD=40
echo To change GPIO pin: set VALVE_RELAY_PIN=17
echo To change relay type: set VALVE_ACTIVE_LOW=1
echo Then restart the backend server.
echo.
echo Press any key to exit...
pause >nul
