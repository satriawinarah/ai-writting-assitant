#!/bin/bash

set -e

echo "=========================================="
echo "Indonesian Writing Assistant"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "Error: backend/.env file not found!"
    echo "Please run: ./scripts/setup.sh first"
    exit 1
fi

# Check if Groq API key is set
if grep -q "your_groq_api_key_here" backend/.env; then
    echo "⚠ WARNING: Groq API key not set!"
    echo ""
    echo "Please set your Groq API key in backend/.env"
    echo "1. Visit: https://console.groq.com"
    echo "2. Sign up and create API key"
    echo "3. Edit backend/.env and replace 'your_groq_api_key_here'"
    echo ""
    exit 1
fi

# Check if virtual environment exists
if [ ! -d backend/venv ]; then
    echo "Error: Virtual environment not found!"
    echo "Please run: ./scripts/setup.sh first"
    exit 1
fi

echo "Starting application..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend on http://localhost:8000..."
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Error: Backend failed to start!"
    echo "Check backend.log for details"
    exit 1
fi

echo "✓ Backend running (PID: $BACKEND_PID)"

# Start frontend
echo "Starting frontend on http://localhost:5173..."
cd ../frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✓ Frontend running (PID: $FRONTEND_PID)"
echo ""
echo "=========================================="
echo "Application is running!"
echo "=========================================="
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
