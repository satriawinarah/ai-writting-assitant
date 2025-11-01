# Architecture Documentation

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     http://localhost:8000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    MONOLITHIC APPLICATION                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              FASTAPI BACKEND (:8000)                   │    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │          API Routes (/api/*)                    │  │    │
│  │  │  ┌──────────────┐  ┌──────────────┐           │  │    │
│  │  │  │  Projects    │  │     AI       │           │  │    │
│  │  │  │    API       │  │    API       │           │  │    │
│  │  │  └──────┬───────┘  └──────┬───────┘           │  │    │
│  │  └─────────┼──────────────────┼───────────────────┘  │    │
│  │            │                  │                       │    │
│  │  ┌─────────▼──────────────────▼───────────────────┐  │    │
│  │  │          Business Logic Layer                  │  │    │
│  │  │                                                 │  │    │
│  │  │  ┌──────────────┐      ┌──────────────┐       │  │    │
│  │  │  │   Project    │      │     LLM      │       │  │    │
│  │  │  │   Service    │      │   Service    │       │  │    │
│  │  │  └──────┬───────┘      └──────┬───────┘       │  │    │
│  │  └─────────┼──────────────────────┼───────────────┘  │    │
│  │            │                      │                   │    │
│  │  ┌─────────▼────────────┐  ┌─────▼──────────────┐   │    │
│  │  │   SQLAlchemy ORM     │  │   Ollama Client    │   │    │
│  │  └─────────┬────────────┘  └─────┬──────────────┘   │    │
│  └────────────┼───────────────────────┼──────────────────┘    │
│               │                       │                        │
│  ┌────────────▼────────────┐  ┌───────▼─────────────────┐    │
│  │   Static File Server    │  │   External Services     │    │
│  │   (React Build)          │  │                         │    │
│  │   /static/*              │  │                         │    │
│  └──────────────────────────┘  └─────────────────────────┘    │
│                                                                 │
└─────────────────┬───────────────────────────────┬──────────────┘
                  │                               │
          ┌───────▼────────┐             ┌────────▼────────┐
          │   PostgreSQL   │             │     Ollama      │
          │   Database     │             │  (Local LLM)    │
          │   :5432        │             │   :11434        │
          │                │             │                 │
          │  - projects    │             │  - mistral      │
          │  - chapters    │             │  - llama2       │
          └────────────────┘             └─────────────────┘
```

## Component Breakdown

### 1. Frontend Layer (React)

**Location**: `frontend/src/`

```
React Application
├── App.jsx                    # Main application orchestrator
│   ├── State Management       # Projects, chapters, active selection
│   └── Route Handling         # (future: React Router)
│
├── Components
│   ├── Sidebar.jsx            # Project navigation
│   ├── Editor.jsx             # TipTap + AI integration
│   ├── ProjectModal.jsx       # Project CRUD form
│   └── ChapterModal.jsx       # Chapter CRUD form
│
└── Services
    └── api.js                 # Axios HTTP client
```

**Responsibilities**:
- User interface rendering
- User interaction handling
- API communication
- Local state management
- Debounced auto-save
- Debounced AI suggestions

**Key Technologies**:
- React 18.2 (UI framework)
- TipTap 2.1 (Rich text editor)
- Axios (HTTP client)
- Vite (Build tool)

### 2. Backend Layer (FastAPI)

**Location**: `backend/app/`

```
FastAPI Application
├── main.py                    # Application entry point
│   ├── CORS Middleware        # Cross-origin support
│   ├── API Routers            # Route registration
│   └── Static File Serving    # Serve React build
│
├── api/                       # API endpoints
│   ├── projects.py            # Project & chapter CRUD
│   └── ai.py                  # AI text generation
│
├── models/                    # Database models
│   └── project.py             # SQLAlchemy models
│
├── schemas/                   # Request/response schemas
│   └── project.py             # Pydantic models
│
├── services/                  # Business logic
│   └── llm_service.py         # LLM integration
│
├── database.py                # Database connection
└── config.py                  # Settings management
```

**Responsibilities**:
- HTTP request handling
- Business logic execution
- Database operations
- LLM communication
- Static file serving
- API documentation (Swagger)

**Key Technologies**:
- FastAPI 0.104 (Web framework)
- SQLAlchemy 2.0 (ORM)
- Pydantic 2.5 (Validation)
- Uvicorn (ASGI server)

### 3. Data Layer

#### PostgreSQL Database

**Schema**:
```sql
projects
├── id (PK)
├── title
├── description
├── created_at
└── updated_at

chapters
├── id (PK)
├── project_id (FK → projects.id)
├── title
├── content (TEXT)
├── order
├── created_at
└── updated_at
```

**Relationships**:
- One-to-many: Project → Chapters
- Cascade delete: Deleting project removes all chapters

### 4. AI Layer (Ollama)

**Architecture**:
```
LLM Service (llm_service.py)
├── Ollama Client
│   ├── HTTP Communication (:11434)
│   └── Model Management
│
├── Prompt Engineering
│   ├── Context Extraction (last 500 chars)
│   ├── Style Instructions
│   └── Continuation Request
│
└── Response Processing
    ├── Token Generation (max 150)
    ├── Stop Sequences
    └── Error Handling
```

**Supported Models**:
- Mistral (recommended, balanced)
- Llama2 (faster, smaller)
- CodeLlama (technical writing)
- Custom models (user configurable)

## Data Flow

### 1. Text Continuation Flow

```
User Types in Editor
    │
    ├─ (Auto-save after 1s)
    │   └─→ PUT /api/projects/{id}/chapters/{chapter_id}
    │       └─→ SQLAlchemy → PostgreSQL
    │
    └─ (AI suggestion after 2s)
        └─→ POST /api/ai/continue
            ├─→ Extract last 500 chars
            ├─→ Build prompt
            └─→ Ollama API
                ├─→ Generate text (max 150 tokens)
                └─→ Return suggestion
                    └─→ Display in sidebar
                        ├─→ Accept → Insert into editor
                        ├─→ Regenerate → New request
                        └─→ Dismiss → Clear suggestion
```

### 2. Project Management Flow

```
User Creates Project
    │
    └─→ POST /api/projects
        ├─→ Validate with Pydantic
        ├─→ Create Project model
        └─→ SQLAlchemy → PostgreSQL
            └─→ Auto-create first chapter
                └─→ POST /api/projects/{id}/chapters
                    └─→ Return project with chapters
                        └─→ Update UI
```

## Request/Response Cycles

### Example: AI Continuation

**Request**:
```http
POST /api/ai/continue HTTP/1.1
Content-Type: application/json

{
  "context": "The old wizard looked into the crystal ball...",
  "max_tokens": 150,
  "temperature": 0.7
}
```

**Processing**:
1. FastAPI receives request
2. Validates with Pydantic schema
3. Calls `llm_service.generate_continuation()`
4. LLM service builds prompt
5. Sends to Ollama API
6. Receives generated text
7. Returns to client

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "continuation": "and saw visions of ancient times...",
  "model": "mistral"
}
```

## Deployment Architecture

### Development Mode

```
Terminal 1: Backend          Terminal 2: Frontend
uvicorn --reload             vite dev server
    ↓                             ↓
http://localhost:8000      http://localhost:3000
                                  │
                                  └─→ Proxies /api/* to :8000
```

### Production Mode

```
Single Process: uvicorn
    ↓
http://localhost:8000
    ├─→ /api/*          → FastAPI routes
    ├─→ /static/*       → React build files
    └─→ /*              → index.html (SPA fallback)
```

## Security Architecture (Current)

```
┌─────────────────────────────────────┐
│  No Authentication Layer (Phase 1)  │
│  - Local-only deployment             │
│  - No user management                │
│  - No API keys                       │
└─────────────────────────────────────┘
```

**Future (Production)**:
```
┌─────────────────────────────────────┐
│     JWT Authentication Layer         │
│  - User registration/login           │
│  - Token-based API access            │
│  - Role-based permissions            │
└─────────────────────────────────────┘
```

## Scaling Considerations

### Current (Phase 1)
- **Users**: Single user
- **Concurrency**: Not required
- **Storage**: Local PostgreSQL
- **Compute**: Local CPU/GPU

### Future (Multi-user)
```
Load Balancer
    ├─→ App Server 1
    ├─→ App Server 2
    └─→ App Server N
            │
    ┌───────┴───────┐
    │               │
PostgreSQL      Redis Cache
(Master-Replica)    │
                    └─→ Session storage
                        └─→ Suggestion cache

LLM Services
    ├─→ Ollama (local) for development
    └─→ OpenAI/Claude API for production
```

## Technology Decisions

### Why FastAPI?
- Fast (async support)
- Modern Python (type hints)
- Auto-generated docs (Swagger/OpenAPI)
- Easy static file serving
- Great for monolithic apps

### Why React + TipTap?
- TipTap: Modern, extensible editor
- React: Large ecosystem, mature
- Vite: Fast build times
- Component-based architecture

### Why Ollama?
- Local-first (privacy)
- Free (no API costs)
- Fast inference (local GPU)
- Easy model switching
- Production-ready

### Why PostgreSQL?
- Robust, mature
- ACID compliance
- Future: pgvector for embeddings
- Good local development story

## File Structure Rationale

```
Separation of Concerns:

backend/
  app/
    api/        → HTTP layer (thin)
    services/   → Business logic (thick)
    models/     → Data layer
    schemas/    → Validation layer

frontend/
  components/   → UI components
  services/     → API clients

scripts/        → Deployment automation
```

## Performance Optimizations

### Current Optimizations
1. **Debouncing**: Prevents excessive API calls
2. **Auto-save**: Reduces explicit save operations
3. **Local LLM**: No network latency
4. **Static serving**: Fast file delivery

### Future Optimizations
1. **Caching**: Redis for suggestion cache
2. **Compression**: Gzip for API responses
3. **Lazy loading**: Code splitting
4. **CDN**: Static asset delivery
5. **Connection pooling**: Database optimization

## Error Handling Strategy

```
Frontend Error Handling
├── Network Errors       → Display user-friendly message
├── Validation Errors    → Highlight form fields
├── AI Service Errors    → Show fallback UI
└── Unexpected Errors    → Log and graceful degradation

Backend Error Handling
├── Validation Errors    → 422 with details
├── Not Found            → 404 with context
├── Database Errors      → 500 with generic message
├── LLM Errors           → 503 with retry suggestion
└── Unexpected Errors    → 500 with error ID
```

## Monitoring & Observability (Future)

```
Metrics to Track:
├── API Response Times
├── AI Generation Times
├── Database Query Times
├── Error Rates
├── User Activity
└── Resource Usage

Tools:
├── Prometheus (metrics)
├── Grafana (visualization)
├── Sentry (error tracking)
└── ELK Stack (logging)
```

## Testing Strategy (Future)

```
Backend Tests
├── Unit Tests
│   ├── Services (LLM, business logic)
│   └── Utilities
├── Integration Tests
│   ├── API endpoints
│   └── Database operations
└── E2E Tests
    └── Complete user flows

Frontend Tests
├── Unit Tests
│   └── Components
├── Integration Tests
│   └── API client
└── E2E Tests
    └── Cypress/Playwright
```

---

**Architecture Status**: Phase 1 Complete
**Last Updated**: 2025-01-30
