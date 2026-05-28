# AdBlend — Slice Progress

Last updated: 2026-05-28

| # | Slice | Status | Notes |
|---|--------|--------|-------|
| 1 | Scaffold + Mock | **done** | Next.js + FastAPI mock `/chat`, panels, dropdown shell |
| 2 | Tavily Grounding | **done** | Tavily → Claude `/chat`, sources + UI attribution |
| 3 | Thrad Intent Gate + Blend | **done** | Live intent scoring; mock Thrad ad at score ≥ 0.70 |
| 4 | Golden Master Dropdown | **done** | Static intent from golden master; tier-grouped dropdown |
| 5 | Live Intent + Attributes UI | **done** | Intent panel, rationale, tokens, focus chip |
| 6 | AdTech Metrics Panel | **done** | `metrics.py`, panel + reset; `/chat` returns metrics |
| 7 | Overmind Trace | **done** | Overmind init, trace panel, pipeline spans; branch `feat/slice-07-overmind-trace` |
| 8 | Polish + Demo Prep (remainder) | **queued** | Error states + final checklist only — see `slice-08-polish.md` |
| 9 | Frontend UI/UX + Demo Polish | **done** | UI, scroll, cache, reset; branch `feat/slice-09-frontend-ux` |
| 9b | Publisher impact hierarchy | **done** | Hero panels for intent/ad/metrics; `feat/slice-09-impact-hierarchy` |
| 10 | Persona & Answer Alignment | **done** | Personas, alignment panel, metrics clarity; merged to `main` |
| 11 | Unit economics (COGS) | **done** | Per-service COGS, token in/out USD, model; `feat/slice-11-unit-economics` |

## Active slice

**Slice 8 (remainder)** — optional error-state hardening ([`slice-08-polish.md`](slice-08-polish.md)).

Plan: [`SLICES.md`](SLICES.md)

## Slice 11 completed

- `backend/service_pricing.py` — env rates, per-step costs, `anthropic_tokens` summary
- `backend/main.py` — `costs` on `ChatResponse`; `session_cogs_usd` on metrics
- `backend/tavily_client.py` — `TavilySearchResult.from_cache` for $0 cached searches
- `frontend/components/CostPanel.tsx`, `TokenCostDetail.tsx`, `lib/token-cost-format.ts`
- Token UI: `N in ($X) · M out ($Y) · $Z total` + model id (unit economics, technical details, chat footer)
- Branch: `feat/slice-11-unit-economics`

## Slice 9 completed

- `globals.css` — semantic tokens, panel/button/input utilities, reduced motion
- `layout.tsx` — Fira Sans + Fira Code
- Chat, dropdown, intent/metrics/trace/side panels — UI/UX Pro Max polish
- `lucide-react`; `lib/tier-styles.ts`; `components/ui/Spinner.tsx`
- Viewport scroll lock; chat scroll shows top of long assistant replies
- Tavily cache, `POST /demo/reset`, ads toggle, reset demo button, loading skeletons
- Branch: `feat/slice-09-frontend-ux` (+ impact UI on `feat/slice-09-impact-hierarchy`)

## Slice 7 completed

- `overmind_setup.py` — optional `OVERMIND_API_KEY` init (Anthropic auto-instrument)
- `trace_collector.py` — per-request spans + OTEL when Overmind is on
- `POST /chat` returns `trace`; `/health` exposes `overmind_configured`
- `TracePanel` — span list with latency bars (Overmind vs local label)
- Pipeline order: `tavily.search` → `claude.intent` (freeform) → `claude.respond` → `thrad.bid`
- Branch: `feat/slice-07-overmind-trace`

## Slice 6 completed

- `backend/metrics.py` — session singleton, fill rate, last impression
- `POST /chat` records and returns metrics; `POST /metrics/reset` for demo
- `MetricsPanel` — queries, ads served, no fill, blocked, last impression, reset
- Branch: `feat/slice-06-metrics-panel`

## Slice 5 completed

- `IntentPanel` — score bar, tier badge, gate, focus chip, rationale
- Token usage in Attributes section
- Branch merged to `main` (`feat/slice-05-intent-ui`)

## Slice 4 completed

- `data/golden_dataset.json` — 89 entries with `intent` + `focus`; 12 new AdTech/AI questions
- `GET /dataset`; dropdown grouped by tier (high / medium / low / off-topic)
- Dropdown passes static `intent` + `focus` to `/chat` (skips live Claude scoring)
- Branch: `feat/slice-04-golden-master-dropdown`

## Slice 3 completed

- `backend/intent.py` — Claude scores freeform messages (score, tier, focus)
- `backend/thrad_client.py` — mock sponsored card (no Thrad signup)
- `/chat` returns `intent`, `focus`, `ad`; gate at **0.70**
- Side panel: intent score/tier badge, focus, sponsored card or “No placement”
- `/health` → `thrad_mode: "mock"`
- Branch: `feat/slice-03-thrad-blend` (ready to merge / commit)

## Slice 2 completed

- Tavily search + Claude grounded responses on `POST /chat`
- `sources` in API; “Powered by Tavily” in chat UI
- Repo-root `.env` loading; `/health` key flags
- Backend on port **8001**
