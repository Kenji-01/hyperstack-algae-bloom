#!/bin/bash

# Activate virtual environment and start the FastAPI server
cd "$(dirname "$0")"
source .venv/bin/activate
echo "🚀 Starting FastAPI server for Algae Bloom Detection..."
echo "📍 Server will be available at: http://localhost:8000"
echo "📖 API documentation at: http://localhost:8000/docs"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
