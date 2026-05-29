# AdBlend Publisher

Hackathon demo for **Cursor × Thrad · London · 28 May 2026** (Track 2 — Sell-Side & Measurement).

Publisher-side console: grounded chat, commercial intent gating, mock Thrad placements, session metrics, optional Overmind tracing (dashboard tags + span attributes), answer alignment, and per-query unit economics (COGS).

Licensed under [MIT](LICENSE).

## What ships today

| Capability | Slice | Notes |
|------------|-------|-------|
| Next.js + FastAPI scaffold | 1 | Chat, side panels, dropdown shell |
| Tavily → Claude grounded `/chat` | 2 | Sources in API + UI attribution |
| Intent gate + mock Thrad ad | 3 | Score ≥ **0.70** → sponsored card |
| Golden master dropdown (89 Qs) | 4 | Static intent for dropdown; live for freeform |
| Intent / focus / token UI | 5 | Rationale, tier badge, gate decision |
| Session metrics + fill rate | 6 | Backend singleton; reset endpoints |
| Overmind trace panel | 7 + 12 | Optional `OVERMIND_API_KEY`; dashboard tags + span attrs |
| Demo polish (cache, reset, toggles) | 9 + 8 | Tavily + per-step Claude cache; ads toggle, design system |
| Impact hierarchy panels | 9b | `ImpactPanel` hero blocks for intent/ad/metrics |
| Personas + answer alignment | 10 | Cosine similarity scoring + `AlignmentPanel` |
| Unit economics (COGS) | 11 | Per-step USD, token in/out, session COGS |

**Active optional work:** slice 8 remainder (error-state hardening) — see [`slices/slice-08-polish.md`](slices/slice-08-polish.md).

Full status: [`slices/PROGRESS.md`](slices/PROGRESS.md) · Roadmap: [`slices/SLICES.md`](slices/SLICES.md)

## Prerequisites

- Node.js 18+
- Python 3.12+ (see `.python-version`)

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

## Environment

Copy [`.env.example`](.env.example) to repo-root `.env` and/or `backend/.env`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `TAVILY_API_KEY` | Yes (for live search) | Tavily grounding |
| `ANTHROPIC_API_KEY` | Yes (for live chat) | Intent, response, answer classifier |
| `OVERMIND_API_KEY` | No | Overmind dashboard tracing ([console.overmindlab.ai](https://console.overmindlab.ai)) |
| `OVERMIND_SERVICE_NAME` | No | Dashboard service name (default `adblend-publisher`) |
| `OVERMIND_ENVIRONMENT` | No | Trace environment label (default `development`) |
| `ANTHROPIC_*_USD_PER_MTOK` | No | Unit economics overrides (slice 11) |
| `TAVILY_USD_PER_SEARCH` | No | Tavily COGS default $0.01/search |

Mock Thrad ads — no Thrad signup required (`thrad_mode: mock` on `/health`).

### Overmind dashboard (optional)

Same pattern as the [Overmind Python quick start](https://docs.overmindlab.ai/guides/sdk-python): call `init()` once at startup with `providers=["anthropic"]`, then use the existing `anthropic.Anthropic()` clients unchanged—calls are auto-traced. We add pipeline spans and tags on top.

1. Sign up at [console.overmindlab.ai](https://console.overmindlab.ai); copy the `ovr_...` key into repo-root `.env` (not `.overmind/`, which is gitignored local CLI config).
2. Restart the backend; `/health` should report `overmind_configured: true` and the UI trace badge **Overmind**.
3. Run a chat query; open the console → service **`adblend-publisher`** → parent span **`adblend.chat`** (includes search, Claude steps, and optional `thrad.bid`).
4. **Tags:** `chat.source`, `chat.ads_enabled`, `intent.scored_live`, `intent.tier`.
5. **Span attributes:** `tavily.from_cache`, `tavily.source_count`, `claude.*.from_cache`, `intent.score`, `thrad.ad_served` (repeat queries show cache hits and near-zero COGS).

Without a key, the in-app trace panel still works in **Local** mode (`TraceCollector` only).

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/chat` | Full pipeline: search, intent, response, alignment, ad, metrics, trace, costs |
| `GET` | `/dataset` | Golden master `{ personas, entries }` |
| `GET` | `/health` | Key flags, intent threshold, Overmind status |
| `POST` | `/metrics/reset` | Clear session metrics |
| `POST` | `/demo/reset` | Metrics + Tavily + Claude step caches (demo restart) |

## Project layout

```
frontend/          Next.js (App Router) + Tailwind — publisher UI
backend/           FastAPI — chat pipeline, metrics, pricing, tracing
  main.py          POST /chat orchestration
  overmind_setup.py   optional Overmind init, tags, error capture
  trace_collector.py  UI trace + OTEL spans
  intent.py, claude_client.py, answer_focus.py, alignment.py
  tavily_client.py, demo_step_cache.py, thrad_client.py, metrics.py, service_pricing.py
data/              golden_dataset.json (89 entries + personas)
scripts/           enrich_golden_personas.py
slices/            Slice plan and per-slice specs
```

## Verification

```bash
cd backend && PYTHONPATH=. uv run pytest -q
cd frontend && npm run lint && npm run build
```
