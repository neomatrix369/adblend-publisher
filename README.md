# AdBlend Publisher

Hackathon demo for **Cursor × Thrad · London · 28 May 2026** (Track 2 — Sell-Side & Measurement).

Slice 1 scaffolded the UI; **Slice 2** wires `/chat` to Tavily search + Claude for grounded answers. API keys required (see `.env.example`).

## Prerequisites

- Node.js 18+
- Python 3.11+

## Quick start

### Backend (port 8001)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Keys: copy repo-root .env from ../.env.example, or backend/.env
uvicorn main:app --reload --port 8001
```

Health check: [http://localhost:8001/health](http://localhost:8001/health)

### Frontend (port 3000)

```bash
cd frontend
cp ../.env.example .env.local   # or ensure NEXT_PUBLIC_API_URL is set
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (use `localhost`, not `127.0.0.1`, if calling the API directly).

By default the frontend calls `/api/*`, which Next.js proxies to the backend on port **8001** (see `frontend/next.config.ts`). This avoids browser CORS issues.

## Slice progress

Track status in [`slices/PROGRESS.md`](slices/PROGRESS.md).

## Slice 2 exit criteria (current)

- [ ] `TAVILY_API_KEY` and `ANTHROPIC_API_KEY` set in `backend/.env`
- [ ] Type a question → grounded Claude response (not mock)
- [ ] Source links appear under the assistant message (“Powered by Tavily”)
- [ ] `/health` reports both keys configured

## Project layout

```
frontend/          Next.js (App Router) + Tailwind
backend/           FastAPI
slices/            Slice plan and per-slice specs
```

See [`slices/SLICES.md`](slices/SLICES.md) for the full build roadmap.
