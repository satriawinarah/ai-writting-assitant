# Quick Start Guide

Get Author's Cursor up and running in 5 minutes!

## Prerequisites Check

Ensure you have these installed:
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Ollama

## Installation (One-Time Setup)

```bash
# 1. Install dependencies
./scripts/setup.sh

# 2. Create database
createdb authoraidb

# 3. Start Ollama (in a separate terminal)
ollama serve

# 4. Pull AI model
ollama pull mistral
```

## Running the Application

```bash
# Production mode (recommended)
./scripts/run.sh

# Or development mode (with hot-reload)
./scripts/dev.sh
```

Then open: **http://localhost:8000**

## First Steps

1. Click **"+ New Project"** to create your first manuscript
2. Add a title and description
3. Start writing in the editor
4. After 2 seconds of inactivity, AI suggestions will appear on the right
5. Click **"Accept"** to use the suggestion, or **"Regenerate"** for a new one

## Common Commands

```bash
# Setup (first time only)
./scripts/setup.sh

# Run in production mode
./scripts/run.sh

# Run in development mode
./scripts/dev.sh

# Create database
createdb authoraidb

# Start Ollama
ollama serve

# Pull a different model
ollama pull llama2  # Faster, smaller
ollama pull codellama  # Better for technical writing
```

## Troubleshooting

### Ollama Not Found
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Or visit: https://ollama.ai
```

### PostgreSQL Not Running
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

### Port 8000 Already in Use
Edit `backend/.env` and change:
```
PORT=8001
```

## Features in Phase 1

- Distraction-free writing editor
- AI-powered text continuation
- Auto-save every 1 second
- Project & chapter management
- Local-first (all data stored on your machine)
- Debounced suggestions (appears after 2s of no typing)

## What's Next?

Check out [README.md](README.md) for the full architecture and roadmap.

For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md).

## Need Help?

- API Documentation: http://localhost:8000/docs
- Check AI Status: http://localhost:8000/api/ai/status
- Health Check: http://localhost:8000/api/health

Happy Writing!
