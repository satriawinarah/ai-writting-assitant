#!/bin/bash

set -e

echo "=========================================="
echo "Indonesian Writing Assistant - Setup"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version || { echo "Error: Python 3 not found. Please install Python 3.11+"; exit 1; }

# Check Node.js version
echo "Checking Node.js version..."
node --version || { echo "Error: Node.js not found. Please install Node.js 18+"; exit 1; }


echo ""
echo "Installing backend dependencies..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Backend dependencies installed"

echo ""
echo "Setting up .env file..."
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Groq API (Free & Fast)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile

# Database
DATABASE_URL=sqlite:///./author_ai.db
EOF
    echo "✓ .env file created"
    echo ""
    echo "⚠ IMPORTANT: Update backend/.env with your Groq API key!"
    echo "  1. Go to: https://console.groq.com"
    echo "  2. Sign up (free, no credit card)"
    echo "  3. Create API key"
    echo "  4. Replace 'your_groq_api_key_here' in backend/.env"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "Installing frontend dependencies..."
cd ../frontend
npm install
echo "✓ Frontend dependencies installed"

echo ""
echo "=========================================="
echo "Setup completed successfully!"
echo "=========================================="
echo ""

# Check if Groq API key is set
cd ../backend
if grep -q "your_groq_api_key_here" .env 2>/dev/null; then
    echo "⚠ NEXT STEP: Get your FREE Groq API key"
    echo ""
    echo "1. Visit: https://console.groq.com"
    echo "2. Sign up (no credit card required)"
    echo "3. Create an API key"
    echo "4. Edit backend/.env and replace 'your_groq_api_key_here'"
    echo ""
    echo "Then run: ./scripts/run.sh"
else
    echo "✓ Ready to run!"
    echo ""
    echo "Run the application: ./scripts/run.sh"
fi
echo ""
