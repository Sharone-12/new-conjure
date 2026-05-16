# Conjure — AI-Powered Notes Workspace

An intelligent notes app with AI summarisation, inline AI text actions, public sharing, and a productivity dashboard. Built as a take-home project for Peblo's internship challenge.

---

## Architecture

```
conjure/
├── backend/          # FastAPI + SQLite
│   ├── main.py       # App entry point, CORS, router registration
│   ├── database.py   # SQLAlchemy engine + session
│   ├── models.py     # User + Note ORM models
│   ├── auth_utils.py # JWT signing/verification, bcrypt hashing
│   └── routes/
│       ├── auth.py       # POST /auth/signup, /auth/login, GET /auth/me
│       ├── notes.py      # CRUD + AI summary + share endpoints
│       └── dashboard.py  # GET /dashboard/stats
│
├── src/              # React 18 + Vite frontend
│   ├── App.jsx       # React Router routes
│   ├── Landing.jsx   # Marketing landing page
│   ├── api/
│   │   └── client.js # Axios instance with JWT interceptor
│   ├── context/
│   │   └── AuthContext.jsx  # Auth state, login/logout helpers
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   └── pages/
│       ├── Login.jsx
│       ├── Signup.jsx
│       ├── Workspace.jsx  # Main 3-panel notes editor
│       ├── Dashboard.jsx  # Analytics + AI stats
│       └── SharedNote.jsx # Public read-only note view
│
├── index.html
├── vite.config.js
└── package.json
```

**Stack:**
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | FastAPI (Python 3.11+) |
| Database | SQLite via SQLAlchemy |
| Auth | JWT (python-jose), bcrypt |
| AI | OpenAI-compatible SDK → Groq (`llama-3.1-8b-instant`) |
| Charts | Recharts |

---

## Local Setup

### 1 — Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # then fill in values (see below)
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**. Interactive docs at **http://localhost:8000/docs**.

### 2 — Frontend

```bash
# from project root
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**.

---

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | SQLite path | `sqlite:///./conjure.db` |
| `JWT_SECRET` | Random secret for signing tokens | any long random string |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `AI_API_KEY` | API key for your AI provider | `gsk_...` (Groq) |
| `AI_BASE_URL` | OpenAI-compatible base URL | `https://api.groq.com/openai/v1` |
| `AI_MODEL` | Model name | `llama-3.1-8b-instant` |

> The backend uses the OpenAI Python SDK with a custom `base_url`, so any OpenAI-compatible provider works (Groq, OpenAI, Together, etc.).

---

## API Reference

All protected endpoints require `Authorization: Bearer <token>` header.

### Auth

#### `POST /auth/signup`
```json
// Request
{ "name": "Jane Smith", "email": "jane@example.com", "password": "secret123" }

// Response 201
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "uuid", "name": "Jane Smith", "email": "jane@example.com" }
}
```

#### `POST /auth/login`
```json
// Request
{ "email": "jane@example.com", "password": "secret123" }

// Response 200 — same shape as signup
```

#### `GET /auth/me` *(protected)*
```json
// Response 200
{ "id": "uuid", "name": "Jane Smith", "email": "jane@example.com", "created_at": "2026-01-01T00:00:00" }
```

---

### Notes

#### `GET /notes` *(protected)*
Query params: `sort=newest|oldest|az`, `search=text`, `archived=false`, `tag=tagname`
```json
// Response 200
[
  {
    "id": "uuid",
    "title": "Meeting notes",
    "content": "Discussed Q2 roadmap...",
    "tags": ["work", "q2"],
    "is_archived": false,
    "is_public": false,
    "share_id": null,
    "ai_summary": null,
    "ai_action_items": [],
    "ai_suggested_title": null,
    "ai_generated_count": 0,
    "created_at": "2026-01-01T10:00:00",
    "updated_at": "2026-01-01T10:05:00"
  }
]
```

#### `POST /notes` *(protected)*
```json
// Request
{ "title": "New note", "content": "", "tags": [] }

// Response 201 — NoteOut object
```

#### `PATCH /notes/:id` *(protected)*
```json
// Request (all fields optional)
{ "title": "Updated title", "content": "New content", "tags": ["updated"], "is_archived": false }

// Response 200 — updated NoteOut
```

#### `DELETE /notes/:id` *(protected)*
```json
// Response 200
{ "ok": true }
```

#### `POST /notes/:id/generate-summary` *(protected)*
Calls the AI provider to summarise the note content.
```json
// Response 200
{
  "summary": "This note covers...",
  "action_items": ["Follow up with team", "Update docs"],
  "suggested_title": "Q2 Roadmap Discussion"
}
```

#### `POST /notes/:id/ai-action` *(protected)*
Inline AI text action on a selected passage.
```json
// Request
{ "action": "rewrite", "selected_text": "The thing is very good." }
// action: "rewrite" | "simplify" | "extract_tasks"

// Response 200
{ "action": "rewrite", "result": "It performs exceptionally well." }
// For extract_tasks, result is an array of strings
```

#### `POST /notes/:id/share` *(protected)*
Makes a note public and returns a shareable link UUID.
```json
// Response 200
{ "share_id": "uuid", "url": "/shared/uuid" }
```

#### `GET /notes/shared/:shareId` *(public — no auth)*
```json
// Response 200
{
  "id": "uuid",
  "title": "Meeting notes",
  "content": "Discussed Q2 roadmap...",
  "tags": ["work"],
  "created_at": "...",
  "updated_at": "..."
}
```

---

### Dashboard

#### `GET /dashboard/stats` *(protected)*
```json
// Response 200
{
  "total_notes": 12,
  "total_words": 3450,
  "ai_summaries_generated": 5,
  "unique_tags": 8,
  "weekly_activity": [
    { "day": "Mon", "notes": 1, "edits": 3 },
    { "day": "Tue", "notes": 0, "edits": 1 },
    ...
  ],
  "top_tags": [
    { "tag": "work", "count": 6 },
    { "tag": "ideas", "count": 4 }
  ],
  "recent_notes": [ ...5 NoteOut objects... ],
  "total_action_items": 14,
  "total_suggested_titles": 5
}
```

---

## Features

- **AI Summarise** — generates summary, action items, and a suggested title for any note
- **Inline AI actions** — select text → Rewrite / Simplify / Extract tasks via a popover
- **Public sharing** — one-click share generates a read-only public URL
- **Dashboard** — weekly activity chart, top tags, AI usage stats, productivity score
- **Auto-save** — 1.5 s debounce, visual save indicator
- **Collapsible sidebar** — hamburger toggle for focused writing mode
- **Tag filtering** — click any tag in the sidebar to filter notes

---

## Screenshots

| Landing | Workspace | Dashboard |
|---|---|---|
| ![Landing](screenshots/landing.png) | ![Workspace](screenshots/workspace.png) | ![Dashboard](screenshots/dashboard.png) |
