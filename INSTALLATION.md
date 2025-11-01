# Installation Guide

This guide will help you set up and run Author's Cursor on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

### 1. Python 3.11 or higher

Check your Python version:
```bash
python3 --version
```

If you don't have Python installed, download it from [python.org](https://www.python.org/downloads/)

### 2. Node.js 18 or higher

Check your Node.js version:
```bash
node --version
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/)

### 3. PostgreSQL 14 or higher

Check if PostgreSQL is installed:
```bash
psql --version
```

Installation options:
- **macOS**: `brew install postgresql@14`
- **Ubuntu/Debian**: `sudo apt install postgresql postgresql-contrib`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

Start PostgreSQL service:
- **macOS**: `brew services start postgresql@14`
- **Ubuntu/Debian**: `sudo systemctl start postgresql`
- **Windows**: PostgreSQL service starts automatically

### 4. Ollama (Local LLM)

Check if Ollama is installed:
```bash
ollama --version
```

Install Ollama:
- Visit [ollama.ai](https://ollama.ai) and follow the installation instructions for your platform
- **macOS/Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`

## Installation Steps

### Step 1: Clone or navigate to the project directory

```bash
cd /Users/satriawinarah/Projects/Personal/author-ai-ide
```

### Step 2: Run the setup script

```bash
./scripts/setup.sh
```

This script will:
- Check all prerequisites
- Create a Python virtual environment
- Install Python dependencies
- Install Node.js dependencies
- Create a `.env` file from the example

### Step 3: Create the database

```bash
createdb authoraidb
```

If you encounter permission issues, you may need to create a PostgreSQL user first:
```bash
# Login as postgres user
sudo -u postgres psql

# Create user and database
CREATE USER postgres WITH PASSWORD 'postgres';
ALTER USER postgres CREATEDB;
CREATE DATABASE authoraidb OWNER postgres;
\q
```

### Step 4: Start Ollama and pull a model

In a separate terminal, start Ollama:
```bash
ollama serve
```

Then pull the Mistral model (recommended for Phase 1):
```bash
ollama pull mistral
```

Other model options:
- `ollama pull llama2` - Smaller, faster
- `ollama pull codellama` - Better for code
- `ollama pull phi` - Very small and fast

### Step 5: Configure environment variables (optional)

Edit `backend/.env` if you need to change any settings:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/authoraidb

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Application
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

## Running the Application

### Production Mode (Recommended)

This mode builds the frontend and serves it through the Python backend:

```bash
./scripts/run.sh
```

Then open your browser to: **http://localhost:8000**

### Development Mode

This mode runs both frontend and backend in development mode with hot-reload:

```bash
./scripts/dev.sh
```

Then open your browser to: **http://localhost:3000** (frontend dev server)

The backend API will be available at: **http://localhost:8000**

## Verification

### 1. Check if the backend is running

Visit http://localhost:8000/api/health

You should see:
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### 2. Check if AI service is available

Visit http://localhost:8000/api/ai/status

You should see:
```json
{
  "status": "available",
  "model": "mistral",
  "base_url": "http://localhost:11434"
}
```

### 3. Check the frontend

Visit http://localhost:8000 (or http://localhost:3000 in dev mode)

You should see the Author's Cursor interface.

## Troubleshooting

### Database connection errors

**Error**: `could not connect to server`

**Solution**: Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql@14

# Ubuntu/Debian
sudo systemctl start postgresql

# Check status
pg_isready
```

### Ollama not available

**Error**: `Model 'mistral' is not available`

**Solution**:
1. Make sure Ollama is running: `ollama serve`
2. Pull the model: `ollama pull mistral`
3. Check available models: `ollama list`

### Port already in use

**Error**: `Address already in use`

**Solution**: Change the port in `backend/.env`:
```bash
PORT=8001
```

### Python dependencies installation fails

**Solution**: Make sure you're using Python 3.11+:
```bash
python3 --version
```

If you have multiple Python versions, create the venv with:
```bash
python3.11 -m venv backend/venv
```

### Frontend build fails

**Solution**: Clear npm cache and reinstall:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

Once the application is running:

1. **Create a new project**: Click "+ New Project" in the sidebar
2. **Start writing**: Begin typing in the editor
3. **Get AI suggestions**: After typing for 2 seconds, AI suggestions will appear on the right
4. **Accept suggestions**: Click "Accept" to insert the AI-generated text
5. **Manage chapters**: Use the chapter buttons to create and switch between chapters

## Uninstallation

To remove the application:

```bash
# Remove virtual environment
rm -rf backend/venv

# Remove node modules
rm -rf frontend/node_modules

# Drop database
dropdb authoraidb

# Remove Ollama models (optional)
ollama rm mistral
```

## Getting Help

If you encounter any issues:

1. Check the logs in the terminal where you ran the application
2. Verify all prerequisites are correctly installed
3. Make sure all services (PostgreSQL, Ollama) are running
4. Check the [README.md](README.md) for additional information
