# Troubleshooting Guide

Common issues and their solutions for Author's Cursor.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Database Issues](#database-issues)
3. [Ollama/AI Issues](#ollamai-issues)
4. [Backend Issues](#backend-issues)
5. [Frontend Issues](#frontend-issues)
6. [Runtime Issues](#runtime-issues)

## Installation Issues

### Python version too old

**Error**: `Python 3.11+ is required`

**Solution**:
```bash
# Check your version
python3 --version

# Install Python 3.11+ from python.org
# Or use pyenv
pyenv install 3.11
pyenv local 3.11
```

### Node.js version too old

**Error**: `Node 18+ is required`

**Solution**:
```bash
# Check your version
node --version

# Install from nodejs.org
# Or use nvm
nvm install 18
nvm use 18
```

### Permission denied when running scripts

**Error**: `Permission denied: ./scripts/setup.sh`

**Solution**:
```bash
chmod +x scripts/*.sh
```

### pip install fails

**Error**: `error: externally-managed-environment`

**Solution**:
```bash
# Make sure you're in the virtual environment
cd backend
source venv/bin/activate

# Your prompt should show (venv)
pip install -r requirements.txt
```

## Database Issues

### PostgreSQL not installed

**Error**: `psql: command not found`

**Solution**:
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from postgresql.org
```

### PostgreSQL not running

**Error**: `could not connect to server`

**Solution**:
```bash
# macOS
brew services start postgresql@14

# Ubuntu/Debian
sudo systemctl start postgresql

# Check if it's running
pg_isready

# Check the status
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### Cannot create database

**Error**: `permission denied to create database`

**Solution**:
```bash
# Create PostgreSQL user with permissions
sudo -u postgres psql

# In psql shell:
CREATE USER your_username WITH PASSWORD 'your_password' CREATEDB;
\q

# Update backend/.env with your credentials
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/authoraidb
```

### Database already exists error

**Error**: `database "authoraidb" already exists`

**Solution**:
```bash
# This is not actually an error - the database exists!
# Just proceed with running the application

# Or if you want to start fresh:
dropdb authoraidb
createdb authoraidb
```

### Connection refused

**Error**: `Connection refused at localhost:5432`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Check if it's listening on the correct port
netstat -an | grep 5432

# Try restarting PostgreSQL
brew services restart postgresql@14  # macOS
sudo systemctl restart postgresql  # Linux
```

## Ollama/AI Issues

### Ollama not installed

**Error**: `ollama: command not found`

**Solution**:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Or visit https://ollama.ai for manual installation
```

### Ollama not running

**Error**: `Model 'mistral' is not available`

**Solution**:
```bash
# Start Ollama in a separate terminal
ollama serve

# Leave this terminal running
```

### Model not pulled

**Error**: `model 'mistral' not found`

**Solution**:
```bash
# Pull the Mistral model
ollama pull mistral

# Check installed models
ollama list

# Try a different model if Mistral is too large
ollama pull phi  # Smaller, faster
```

### Ollama connection timeout

**Error**: `Connection timeout to http://localhost:11434`

**Solution**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Check if the port is correct in backend/.env
OLLAMA_BASE_URL=http://localhost:11434
```

### Model too large for system

**Error**: Out of memory or system hangs

**Solution**:
```bash
# Use a smaller model
ollama pull phi
# or
ollama pull llama2:7b

# Update backend/.env
OLLAMA_MODEL=phi
```

### AI suggestions not appearing

**Symptoms**: Editor works but no AI suggestions

**Solution**:
1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. Check AI status: Visit `http://localhost:8000/api/ai/status`
3. Check browser console for errors (F12)
4. Make sure you have at least 50 characters of text
5. Wait 2 seconds after typing

## Backend Issues

### Import errors

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
# Activate virtual environment
cd backend
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Port already in use

**Error**: `Address already in use: 8000`

**Solution**:
```bash
# Option 1: Kill the process using port 8000
lsof -ti:8000 | xargs kill -9

# Option 2: Use a different port
# Edit backend/.env
PORT=8001

# Then visit http://localhost:8001
```

### Database migration errors

**Error**: Table/column doesn't exist

**Solution**:
```bash
# The app creates tables automatically on startup
# If you have issues, drop and recreate the database

dropdb authoraidb
createdb authoraidb

# Restart the application
./scripts/run.sh
```

### Static files not found

**Error**: `Static directory not found`

**Solution**:
```bash
# Build the frontend first
cd frontend
npm run build

# This creates backend/static/
# Then start the backend
cd ../backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Frontend Issues

### npm install fails

**Error**: Various npm errors

**Solution**:
```bash
cd frontend

# Clear cache
rm -rf node_modules package-lock.json
npm cache clean --force

# Reinstall
npm install
```

### Build fails

**Error**: Build errors during `npm run build`

**Solution**:
```bash
cd frontend

# Check Node version
node --version  # Should be 18+

# Try clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Blank page in browser

**Symptoms**: Browser shows blank page

**Solution**:
1. Check browser console (F12) for errors
2. Verify backend is running: `curl http://localhost:8000/api/health`
3. Check if frontend is built: `ls backend/static/`
4. Try rebuilding: `cd frontend && npm run build`
5. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

### API calls failing

**Error**: Network errors in console

**Solution**:
```bash
# Development mode: Check proxy in vite.config.js
# Make sure backend is running on port 8000

# Production mode: Make sure frontend is built
cd frontend
npm run build

# Restart backend
cd ../backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Runtime Issues

### Auto-save not working

**Symptoms**: Changes not persisted after refresh

**Solution**:
1. Check browser console for errors
2. Verify database connection: `psql -d authoraidb -c "SELECT * FROM chapters;"`
3. Check backend logs for save errors
4. Try typing and waiting 2 seconds (auto-save debounce)

### Editor content disappears

**Symptoms**: Content vanishes when switching chapters

**Solution**:
1. This might be expected behavior if you haven't saved
2. Wait 1 second after typing for auto-save
3. Check if content is in database: `psql -d authoraidb -c "SELECT id, title, length(content) FROM chapters;"`

### Slow AI suggestions

**Symptoms**: Suggestions take a long time

**Solution**:
```bash
# Use a smaller/faster model
ollama pull phi
# or
ollama pull llama2:7b

# Update backend/.env
OLLAMA_MODEL=phi

# Restart backend
```

### High CPU usage

**Symptoms**: System slow when using app

**Solution**:
1. Use a smaller model (phi instead of mistral)
2. Increase temperature for faster generation
3. Reduce max_tokens in Editor.jsx
4. Close other applications
5. Consider using GPU if available

### Memory issues

**Symptoms**: System runs out of memory

**Solution**:
```bash
# Use smallest model
ollama pull phi

# Or stop Ollama when not writing
# Just won't get AI suggestions
```

## Development Mode Issues

### Hot reload not working

**Symptoms**: Changes don't appear without restart

**Solution**:
```bash
# Frontend: Make sure dev server is running
cd frontend
npm run dev

# Backend: Make sure --reload flag is used
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### CORS errors

**Error**: CORS policy errors in browser

**Solution**:
- Check `backend/app/main.py` has CORS middleware
- Allow origins should include http://localhost:3000
- Restart backend after changes

## Verification

Run the verification script to check your setup:

```bash
./scripts/verify.sh
```

This will check:
- All prerequisites installed
- Services running
- Database exists
- Models pulled
- Project structure correct

## Getting More Help

### Check logs

**Backend logs**:
- Look at terminal where backend is running
- Errors will show in red

**Frontend logs**:
- Open browser console (F12)
- Look for red errors

**Database logs**:
```bash
# Check PostgreSQL logs
# macOS
tail -f /opt/homebrew/var/log/postgresql@14.log

# Linux
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Health checks

```bash
# Backend health
curl http://localhost:8000/api/health

# AI service status
curl http://localhost:8000/api/ai/status

# Database connectivity
psql -d authoraidb -c "SELECT 1;"

# Ollama status
curl http://localhost:11434/api/tags
```

### Clean restart

Sometimes the best solution is a clean restart:

```bash
# 1. Stop all services
# Press Ctrl+C in terminals running services

# 2. Restart PostgreSQL
brew services restart postgresql@14  # macOS

# 3. Restart Ollama
ollama serve  # in separate terminal

# 4. Rebuild frontend
cd frontend
npm run build

# 5. Restart backend
cd ../backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Still Having Issues?

If none of these solutions work:

1. Run the verification script: `./scripts/verify.sh`
2. Check all prerequisites are installed correctly
3. Review the [INSTALLATION.md](INSTALLATION.md) guide
4. Check the error messages carefully
5. Search for the specific error online
6. Check if your system meets requirements

## System Requirements

**Minimum**:
- 8GB RAM
- 2 CPU cores
- 10GB disk space
- macOS 10.15+ / Ubuntu 20.04+ / Windows 10+

**Recommended**:
- 16GB RAM
- 4+ CPU cores
- 20GB disk space
- GPU (for faster AI inference)

---

**Last Updated**: 2025-01-30
