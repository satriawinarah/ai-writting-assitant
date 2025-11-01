#!/bin/bash

set -e

echo "=========================================="
echo "Author's Cursor - Development Mode"
echo "=========================================="
echo ""

# Check if database exists
echo "Checking database..."
psql -lqt | cut -d \| -f 1 | grep -qw authoraidb || {
    echo "Database 'authoraidb' not found. Creating..."
    createdb authoraidb
    echo "Database created successfully!"
}

# Check if Ollama is running
echo "Checking Ollama..."
curl -s http://localhost:11434/api/tags > /dev/null || {
    echo "Warning: Ollama is not running. Please start it with: ollama serve"
    echo "Also make sure you have pulled a model: ollama pull mistral"
}

echo ""
echo "Starting development servers..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait
