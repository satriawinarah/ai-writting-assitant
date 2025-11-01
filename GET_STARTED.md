# Get Started with Author's Cursor

Welcome! This guide will help you get up and running in just a few minutes.

## What is Author's Cursor?

Author's Cursor is a smart writing IDE for book authors that combines:
- A distraction-free editor (like Notion)
- AI-powered text suggestions (like Cursor)
- Project management for manuscripts
- Local-first architecture (your data stays on your machine)

## Prerequisites

You need these installed on your system:

1. **Python 3.11+** - [Download](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download](https://nodejs.org/)
3. **PostgreSQL 14+** - [Installation Guide](INSTALLATION.md#3-postgresql-14-or-higher)
4. **Ollama** - [Install](https://ollama.ai)

## Quick Install (5 minutes)

```bash
# 1. Run setup script
./scripts/setup.sh

# 2. Create database
createdb authoraidb

# 3. Start Ollama (in a separate terminal, keep it running)
ollama serve

# 4. Pull AI model (one-time, ~4GB download)
ollama pull mistral

# 5. Start the application
./scripts/run.sh
```

Then open: **http://localhost:8000**

## Your First Project

1. Click **"+ New Project"**
2. Enter a title like "My First Novel"
3. Start writing in the editor
4. After 2 seconds of not typing, AI suggestions appear on the right
5. Click **"Accept"** to use a suggestion

## Key Features

### Auto-Save
Your work saves automatically 1 second after you stop typing. No save button needed!

### AI Suggestions
- Appear after 2 seconds of inactivity
- Based on your last 500 characters
- Click **Accept**, **Regenerate**, or **Dismiss**

### Multiple Chapters
- Click **"+ New Chapter"** to add chapters
- Switch between chapters with chapter buttons
- Each chapter auto-saves independently

### Project Management
- All projects listed in the left sidebar
- Click any project to open it
- Click project title to edit details

## Documentation

- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Full Installation**: [INSTALLATION.md](INSTALLATION.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Features**: [FEATURES.md](FEATURES.md)

## Running the App

### Production Mode (Recommended)
```bash
./scripts/run.sh
# Visit: http://localhost:8000
```

### Development Mode (for developers)
```bash
./scripts/dev.sh
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## System Check

Run this to verify everything is set up correctly:

```bash
./scripts/verify.sh
```

## Troubleshooting

### Ollama not working?
```bash
# Make sure it's running
ollama serve

# Check if the model is installed
ollama list

# Pull the model if needed
ollama pull mistral
```

### Database issues?
```bash
# Check if PostgreSQL is running
pg_isready

# Create the database if needed
createdb authoraidb
```

### Port 8000 already in use?
```bash
# Use a different port
# Edit backend/.env and change: PORT=8001
```

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more help.

## What's Next?

After you're comfortable with the basics:

1. **Experiment with different AI models**:
   ```bash
   ollama pull llama2  # Faster
   ollama pull phi     # Smallest
   ```
   Then update `backend/.env`: `OLLAMA_MODEL=llama2`

2. **Customize settings** in `backend/.env`:
   - Change AI model
   - Adjust database connection
   - Modify server port

3. **Read the architecture** in [ARCHITECTURE.md](ARCHITECTURE.md)

4. **Check out planned features** in [FEATURES.md](FEATURES.md)

## Getting Help

- **System verification**: `./scripts/verify.sh`
- **Health check**: http://localhost:8000/api/health
- **AI status**: http://localhost:8000/api/ai/status
- **API docs**: http://localhost:8000/docs

## Project Structure

```
author-ai-ide/
├── backend/          # Python FastAPI server
├── frontend/         # React application
├── scripts/          # Setup and run scripts
└── *.md             # Documentation
```

## Tips

- **Write at least 50 characters** before AI suggestions appear
- **Wait 2 seconds** after typing for AI to generate suggestions
- **Use shorter paragraphs** for better AI context
- **Experiment with different models** to find what works best for your writing style
- **Keep Ollama running** in a separate terminal while you write

## Current Limitations (Phase 1)

- Single user only (local development)
- No cloud sync
- No export to PDF/DOCX (coming in Phase 6)
- No style memory (coming in Phase 2)
- No fact checking (coming in Phase 3)

See [FEATURES.md](FEATURES.md) for the full roadmap.

## Need More Help?

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Run the verification script: `./scripts/verify.sh`
3. Review installation guide: [INSTALLATION.md](INSTALLATION.md)
4. Read the FAQ below

## FAQ

**Q: Do I need an internet connection?**
A: No! Everything runs locally. You only need internet to install dependencies and pull the AI model initially.

**Q: Where is my data stored?**
A: Locally in PostgreSQL database on your machine. Nothing is sent to the cloud.

**Q: Can I use different AI models?**
A: Yes! Run `ollama pull <model>` and update `backend/.env`. Try: mistral, llama2, phi, codellama.

**Q: Is my data private?**
A: Yes! Everything is local. No data leaves your machine.

**Q: Can I use this for commercial writing?**
A: Yes! The app is for your personal use. AI models have their own licenses (check Ollama docs).

**Q: How do I backup my work?**
A: Your data is in PostgreSQL. Backup with: `pg_dump authoraidb > backup.sql`

**Q: Can multiple people use this?**
A: Phase 1 is single-user only. Multi-user support planned for Phase 6.

**Q: Does this work on Windows?**
A: It should work but hasn't been fully tested. Please report any issues!

## Support

- **Documentation**: All `.md` files in this directory
- **Verification**: `./scripts/verify.sh`
- **Logs**: Check terminal output where you ran the app

---

**Version**: 0.1.0 (Phase 1)
**Status**: Complete and ready to use! ✅

Happy Writing! 📝✨
