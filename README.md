# ShopEasy AI Live Chat Support Agent

A full-stack AI-powered customer support chat widget for ShopEasy, a fictional e-commerce store. Users can ask questions about shipping, returns, payments, and more — the AI agent responds using Groq with contextual conversation history.

## Tech Stack

- **Backend:** Node.js, TypeScript, Express.js
- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis (session history caching)
- **LLM:** Groq API (`llama-3.3-70b-versatile`)

## Prerequisites

- Node.js 18+
- PostgreSQL (running locally or via a cloud provider)
- Redis (running locally or via a cloud provider)
- Groq API key ([console.groq.com](https://console.groq.com))

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd spur
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```
DATABASE_URL=postgresql://user:password@localhost:5432/spur_chat
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your_groq_api_key_here
PORT=4000
FRONTEND_URL=http://localhost:3000
```

Create the PostgreSQL database:

```bash
createdb spur_chat
```

Run migrations and seed data:

```bash
npm run prisma:generate
npm run db:setup
```

Start the backend dev server:

```bash
npm run dev
```

The API will be available at `http://localhost:4000`.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

The default API URL should work for local development:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Start the frontend dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Architecture Overview

### Backend Layers

```
Request → Routes → Services → DB / Redis / LLM
                ↓
           Middleware (validation, error handling, logging)
```

| Layer | Responsibility |
|-------|---------------|
| **Routes** (`src/routes/`) | HTTP endpoint definitions, request/response mapping |
| **Services** (`src/services/`) | Business logic — chat orchestration, LLM calls |
| **DB** (`src/db/`) | Prisma client, Redis connection, migrations, seed |
| **Middleware** (`src/middleware/`) | Input validation, global error handler |

- `chat.routes.ts` — `POST /api/chat/message` and `GET /api/chat/history/:sessionId`
- `chat.service.ts` — Creates conversations, persists messages, manages Redis cache
- `llm.service.ts` — Encapsulates all Groq API interaction

### Frontend Component Tree

```
page.tsx
└── ChatWidget
    ├── MessageList
    │   ├── MessageBubble (per message)
    │   └── TypingIndicator (while loading)
    └── InputBar
```

- `ChatWidget` — Session management, API orchestration, localStorage persistence
- `MessageList` — Scrollable container with auto-scroll to latest message
- `MessageBubble` — Styled user/AI message bubbles with timestamps
- `InputBar` — Text input with Enter-to-send, character count, disabled state

### Session Management

1. On first message, the backend creates a new `conversations` row and returns its UUID as `sessionId`.
2. The frontend stores `sessionId` in `localStorage` under `shopeasy_session_id`.
3. On page reload, the frontend reads `sessionId` from localStorage and calls `GET /api/chat/history/:sessionId` to restore the conversation.
4. If the session is invalid or not found, localStorage is cleared and a fresh session starts on the next message.

### Redis Caching

- Conversation history is cached in Redis with key `session:{sessionId}:history`.
- TTL: **1 hour** (3600 seconds).
- On `POST /api/chat/message`, history is read from Redis first; on cache miss, it falls back to PostgreSQL and populates the cache.
- After each new message pair (user + AI), the cache is invalidated and rewritten with the updated history.
- If Redis is unavailable, the app degrades gracefully and reads directly from PostgreSQL.

## LLM Notes

### Provider

Groq (`llama-3.3-70b-versatile`) via `groq-sdk`.

### Prompting Strategy

- A **system prompt** embeds the full ShopEasy knowledge base (shipping, returns, support hours, payments, tracking, cancellations).
- The **last 10 messages** of conversation history are included as context for multi-turn coherence.
- The latest user message is appended and sent to the model.

### Error Handling

| Condition | User-facing message |
|-----------|-------------------|
| API timeout (30s) | "Our agent is temporarily unavailable. Please try again shortly." |
| Invalid API key (401/403) | "Service configuration error. Please contact support." |
| Rate limit (429) | "We're experiencing high traffic. Please wait a moment and retry." |
| Any other error | "Something went wrong. Please try again." |

Errors are returned as normal AI message text — the chat flow is never interrupted by raw error objects.

### Token / Cost Controls

- `max_tokens`: 500 per response
- History context capped at last 10 messages
- User messages truncated at 2000 characters (with a warning returned to the client)

## API Reference

### `POST /api/chat/message`

**Request:**
```json
{
  "message": "What is your return policy?",
  "sessionId": "optional-uuid"
}
```

**Response:**
```json
{
  "reply": "Items can be returned within 30 days...",
  "sessionId": "uuid",
  "warning": "optional truncation warning"
}
```

### `GET /api/chat/history/:sessionId`

**Response:**
```json
{
  "sessionId": "uuid",
  "messages": [
    {
      "id": "uuid",
      "sender": "user",
      "text": "Hello",
      "timestamp": "2026-06-09T10:00:00.000Z"
    }
  ]
}
```

## Trade-offs & If I Had More Time

**Current trade-offs:**
- Polling-based request/response (no WebSocket streaming) — simpler to implement and deploy, but AI replies appear all at once rather than token-by-token.
- No authentication — sessions are identified only by UUID in localStorage, which is fine for a demo but not production-ready.
- Knowledge base is hardcoded in the system prompt — works well for a small FAQ set but doesn't scale to large product catalogs.
- Redis cache is a simple key-value store — no cache warming, no distributed invalidation strategy.

**If I had more time, I would:**
- Add **WebSocket / SSE streaming** for real-time token-by-token AI responses, improving perceived latency.
- Add **multi-tenant authentication** so conversations are tied to real user accounts.
- Implement **RAG with a vector database** (e.g. Pinecone, pgvector) for larger, dynamic knowledge bases that can be updated without redeploying.
- Add an **analytics dashboard** for conversation insights — common questions, resolution rates, sentiment analysis.
- Add **rate limiting** per session/IP to prevent abuse.
- Write **integration and E2E tests** for the full chat flow.
- Add **Docker Compose** for one-command local setup of PostgreSQL + Redis + app.
