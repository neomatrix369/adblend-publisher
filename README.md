# AdBlend Publisher

Hackathon demo for **Cursor × Thrad · London · 28 May 2026** (Track 2 — Sell-Side & Measurement).

Slice 1 scaffolded the UI; **Slice 2** wires `/chat` to Tavily search + Claude. **Slice 3** adds intent scoring and a **mock** sponsored ad when score ≥ 0.70 (no Thrad signup required). API keys: Tavily + Anthropic (see `.env.example`).

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

## Slice 3 (done on `feat/slice-03-thrad-blend`)

- [x] High-intent question → mock sponsored card in Ad panel
- [x] Low-intent question → “No placement” in Ad panel
- [x] Intent score + tier badge in side panel
- [x] `/health` reports `thrad_mode: mock`

**Next:** Slice 4 — golden master dropdown ([`slices/slice-04-dropdown.md`](slices/slice-04-dropdown.md))

## Project layout

```
frontend/          Next.js (App Router) + Tailwind
backend/           FastAPI
slices/            Slice plan and per-slice specs
```

See [`slices/SLICES.md`](slices/SLICES.md) for the full build roadmap.
