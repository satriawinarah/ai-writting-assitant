#!/bin/bash

echo "=========================================="
echo "Author's Cursor - System Verification"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2 is installed"
        if [ ! -z "$3" ]; then
            echo "  Version: $($3)"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $2 is NOT installed"
        return 1
    fi
}

check_service() {
    if $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2 is running"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $2 is NOT running"
        return 1
    fi
}

echo "Checking Prerequisites..."
echo "─────────────────────────────────────────"

# Check Python
check_command python3 "Python" "python3 --version"
PYTHON_OK=$?

# Check Node
check_command node "Node.js" "node --version"
NODE_OK=$?

# Check npm
check_command npm "npm" "npm --version"
NPM_OK=$?

# Check PostgreSQL
check_command psql "PostgreSQL" "psql --version"
POSTGRES_OK=$?

# Check Ollama
check_command ollama "Ollama" "ollama --version"
OLLAMA_OK=$?

echo ""
echo "Checking Services..."
echo "─────────────────────────────────────────"

# Check if PostgreSQL is running
check_service "pg_isready -q" "PostgreSQL service"
POSTGRES_RUNNING=$?

# Check if Ollama is running
check_service "curl -s http://localhost:11434/api/tags > /dev/null" "Ollama service"
OLLAMA_RUNNING=$?

echo ""
echo "Checking Database..."
echo "─────────────────────────────────────────"

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw authoraidb; then
    echo -e "${GREEN}✓${NC} Database 'authoraidb' exists"
    DB_EXISTS=0
else
    echo -e "${YELLOW}⚠${NC} Database 'authoraidb' does NOT exist"
    echo "  Run: createdb authoraidb"
    DB_EXISTS=1
fi

echo ""
echo "Checking Ollama Models..."
echo "─────────────────────────────────────────"

# Check if Mistral model is installed
if ollama list 2>/dev/null | grep -q mistral; then
    echo -e "${GREEN}✓${NC} Mistral model is installed"
    MODEL_OK=0
else
    echo -e "${YELLOW}⚠${NC} Mistral model is NOT installed"
    echo "  Run: ollama pull mistral"
    MODEL_OK=1
fi

echo ""
echo "Checking Project Structure..."
echo "─────────────────────────────────────────"

# Check backend files
if [ -f "backend/requirements.txt" ]; then
    echo -e "${GREEN}✓${NC} Backend files present"
    BACKEND_FILES=0
else
    echo -e "${RED}✗${NC} Backend files missing"
    BACKEND_FILES=1
fi

# Check frontend files
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✓${NC} Frontend files present"
    FRONTEND_FILES=0
else
    echo -e "${RED}✗${NC} Frontend files missing"
    FRONTEND_FILES=1
fi

# Check if virtual environment exists
if [ -d "backend/venv" ]; then
    echo -e "${GREEN}✓${NC} Python virtual environment exists"
    VENV_EXISTS=0
else
    echo -e "${YELLOW}⚠${NC} Python virtual environment NOT created"
    echo "  Run: ./scripts/setup.sh"
    VENV_EXISTS=1
fi

# Check if node_modules exists
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Node modules installed"
    NODE_MODULES=0
else
    echo -e "${YELLOW}⚠${NC} Node modules NOT installed"
    echo "  Run: ./scripts/setup.sh"
    NODE_MODULES=1
fi

# Check if .env exists
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Environment file (.env) exists"
    ENV_EXISTS=0
else
    echo -e "${YELLOW}⚠${NC} Environment file (.env) NOT found"
    echo "  Run: cp backend/.env.example backend/.env"
    ENV_EXISTS=1
fi

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="

TOTAL_CHECKS=11
PASSED=0

[ $PYTHON_OK -eq 0 ] && ((PASSED++))
[ $NODE_OK -eq 0 ] && ((PASSED++))
[ $NPM_OK -eq 0 ] && ((PASSED++))
[ $POSTGRES_OK -eq 0 ] && ((PASSED++))
[ $OLLAMA_OK -eq 0 ] && ((PASSED++))
[ $POSTGRES_RUNNING -eq 0 ] && ((PASSED++))
[ $OLLAMA_RUNNING -eq 0 ] && ((PASSED++))
[ $DB_EXISTS -eq 0 ] && ((PASSED++))
[ $MODEL_OK -eq 0 ] && ((PASSED++))
[ $VENV_EXISTS -eq 0 ] && ((PASSED++))
[ $NODE_MODULES -eq 0 ] && ((PASSED++))

echo ""
echo "Status: $PASSED/$TOTAL_CHECKS checks passed"
echo ""

if [ $PASSED -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}✓ All checks passed! You're ready to run the application.${NC}"
    echo ""
    echo "Run: ./scripts/run.sh"
    exit 0
elif [ $PASSED -ge 8 ]; then
    echo -e "${YELLOW}⚠ Most checks passed. Review warnings above.${NC}"
    echo ""
    echo "You may be able to run the application, but some features might not work."
    exit 0
else
    echo -e "${RED}✗ Several checks failed. Please install missing dependencies.${NC}"
    echo ""
    echo "Run: ./scripts/setup.sh"
    exit 1
fi
