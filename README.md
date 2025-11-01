# Indonesian Writing Assistant

An AI-powered writing assistant for Indonesian language with smart text continuation and improvement features.

## Features

- ✍️ **Smart Text Continuation**: Generate natural continuations for your writing
- ✨ **Text Improvement**: Select any text and request AI-powered improvements
- 🌐 **Cloud AI**: Uses Groq API (fast, free, no setup required)
- 🇮🇩 **Indonesian Language**: Optimized for Bahasa Indonesia
- 💾 **Chapter Management**: Organize your writing into chapters
- 🎯 **Context Control**: Adjust how many lines of context the AI uses

## Tech Stack

- **Frontend**: React, TipTap Editor
- **Backend**: FastAPI, Python
- **Database**: SQLite
- **AI**: Groq API (Llama 3.1 70B)

## Setup

### 1. Get Groq API Key (Free)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (no credit card required)
3. Create an API key
4. Copy your API key

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GROQ_API_KEY=your_api_key_here" > .env

# Run backend
python -m uvicorn app.main:app --reload
```

The backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm start
```

The frontend will run on `http://localhost:3000`

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Groq API (Free & Fast)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile

# Database
DATABASE_URL=sqlite:///./author_ai.db
```

## How It Works

### AI Provider

The app uses Groq API (cloud-based, free):

- **Model**: Llama 3.1 70B
- **Speed**: < 1 second response time
- **Cost**: Free with generous limits (30 requests/min)
- **Quality**: Excellent Indonesian language support
- **No Setup**: No local GPU or model downloads needed

### Features

#### Text Continuation

1. Write some text in the editor
2. Set the number of context lines (default: 10)
3. Click "Generate Suggestion"
4. AI generates a natural continuation
5. Accept or regenerate

#### Text Improvement

1. Select any text in the editor
2. An improvement panel appears
3. Customize the instruction (e.g., "Make it more formal")
4. Click "Request Improvement"
5. Review the improved version
6. Replace, regenerate, or dismiss

## API Endpoints

### Generate Continuation

```bash
POST /api/ai/continue
Content-Type: application/json

{
  "context": "Your text context...",
  "max_tokens": 150,
  "temperature": 0.7
}
```

Response:
```json
{
  "continuation": "Generated text...",
  "model": "llama-3.1-70b-versatile"
}
```

### Improve Text

```bash
POST /api/ai/improve
Content-Type: application/json

{
  "text": "Text to improve...",
  "instruction": "Make it more engaging",
  "temperature": 0.7
}
```

Response:
```json
{
  "improved_text": "Improved version...",
  "model": "llama-3.1-70b-versatile"
}
```

### Check Status

```bash
GET /api/ai/status
```

Response:
```json
{
  "status": "available",
  "providers": {
    "provider": "groq",
    "model": "llama-3.1-70b-versatile",
    "available": true
  }
}
```

## Groq API Limits

**Free Tier:**
- 30 requests per minute per API key
- 6,000 requests per minute (total)
- No cost
- No credit card required

**Models Available:**
- `llama-3.1-70b-versatile` (Recommended - Best for Indonesian)
- `llama-3.1-8b-instant` (Faster, smaller)
- `mixtral-8x7b-32768` (Good alternative)

## Troubleshooting

### Groq API Not Working

**Error**: "Groq failed: API key invalid"
- Check your `GROQ_API_KEY` in `.env` file
- Make sure there are no extra spaces
- Verify the key is active at [console.groq.com](https://console.groq.com)

**Error**: "Rate limit exceeded"
- You've hit the free tier limit (30 requests/min)
- Wait a minute and try again
- Consider upgrading to paid tier for higher limits

### Database Issues

**Error**: "Database not found"
- The SQLite database is created automatically on first run
- Make sure you have write permissions in the `backend` directory

## Development

### Project Structure

```
author-ai-ide/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── models/       # Database models
│   │   ├── config.py     # Configuration
│   │   └── main.py       # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API client
│   │   └── App.js
│   └── package.json
└── README.md
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Cost

**Groq Free Tier**
- Cost: $0 (completely free)
- Speed: ~1 second per request
- Quality: Excellent for Indonesian
- Limit: 30 requests/minute

## License

MIT License

## Support

For issues or questions:
- Check the [Groq Documentation](https://console.groq.com/docs)
- Open an issue in this repository

---

**Built with ❤️ for Indonesian writers**
