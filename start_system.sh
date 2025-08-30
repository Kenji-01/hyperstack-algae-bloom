#!/bin/bash
# CLINE: FULL SYSTEM – Camera Segmentation + Auto Valve (Raspberry Pi friendly)
# Goal:
# - Keep existing Lovable frontend.
# - Backend: FastAPI with HSV fallback + optional YOLO. Adds GPIO relay control.
# - Auto-close the valve when coverage_pct >= threshold (env-configurable).
# - Frontend: mount camera client, display % coverage, show valve state, allow manual override, and adjust threshold.
# - Provide run commands + quick tests.

set -e

echo "==== 0) PROJECT OVERVIEW ===="
pwd || true
ls -la || true

################################################################################
# 1) BACKEND: FastAPI with HSV fallback + GPIO relay + optional YOLO
################################################################################

echo "==== 1) SETTING UP BACKEND ===="

# Backend requirements are already in place
echo "Backend requirements.txt already configured"

# Create Python virtual environment if it doesn't exist
if [ ! -d "server/.venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv server/.venv
fi

# Activate virtual environment and install dependencies
echo "Installing Python dependencies..."
source server/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r server/requirements.txt

# Optional: install gpio libs on Pi (skip if already installed via apt)
# sudo apt update && sudo apt install -y python3-gpiozero python3-lgpio || true

# Start backend (background)
echo "Starting FastAPI backend..."
cd server
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

sleep 3
echo "Backend /status:"
curl -s http://127.0.0.1:8000/status || echo "Backend not ready yet"
echo

################################################################################
# 2) FRONTEND: env + camera client + dashboard mount + valve controls
################################################################################

echo "==== 2) SETTING UP FRONTEND ===="

# Environment file is already created
echo "Frontend environment configured"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Start frontend development server
echo "Starting Vite development server..."
npm run dev -- --host &
FRONTEND_PID=$!

sleep 3
echo "---- Vite is running (check the terminal panel for Local/Network URLs) ----"

################################################################################
# 3) QUICK HOW-TO + TESTS
################################################################################
echo ""
echo "====== RUNNING INSTRUCTIONS ======"
echo "Backend (PID: $BACKEND_PID):     http://<this-ip>:8000/status  and  /docs"
echo "To change threshold/pin:         export DUCKWEED_CLOSE_THRESHOLD=40 ; export VALVE_RELAY_PIN=17 ; export VALVE_ACTIVE_LOW=1"
echo "Then restart backend:            kill $BACKEND_PID && uvicorn server.main:app --host 0.0.0.0 --port 8000"
echo "Frontend (PID: $FRONTEND_PID):   Use the Network URL Vite printed (e.g., http://<ip>:5173)"
echo "Dashboard:                       Click START in Duckweed card, allow camera, watch % and valve state."
echo ""
echo "====== CURL TESTS ======"
echo "curl -s http://127.0.0.1:8000/status"
echo "curl -X POST http://127.0.0.1:8000/valve/open"
echo "curl -X POST http://127.0.0.1:8000/valve/close"
echo ""
echo "If you later add YOLO weights at server/weights/duckweed-seg.pt and 'pip install ultralytics', /status will show mode: yolo."
echo ""
echo "====== STOP SERVICES ======"
echo "To stop both services, run:"
echo "kill $BACKEND_PID $FRONTEND_PID"

# Keep script running to maintain services
echo ""
echo "Services are running. Press Ctrl+C to stop all services."
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Wait for services
wait
