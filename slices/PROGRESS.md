# AdBlend — Slice Progress

Last updated: 2026-05-29

| # | Slice | Status | Notes |
|---|--------|--------|-------|
| 1 | Scaffold + Mock | **done** | Next.js + FastAPI mock `/chat`, panels, dropdown shell |
| 2 | Tavily Grounding | **done** | Tavily → Claude `/chat`, sources + UI attribution |
| 3 | Thrad Intent Gate + Blend | **done** | Live intent scoring; mock Thrad ad at score ≥ 0.70 |
| 4 | Golden Master Dropdown | **done** | Static intent from golden master; tier-grouped dropdown |
| 5 | Live Intent + Attributes UI | **done** | Intent panel, rationale, tokens, focus chip |
| 6 | AdTech Metrics Panel | **done** | `metrics.py`, panel + reset; `/chat` returns metrics |
| 7 | Overmind Trace | **done** | Init, trace panel, pipeline spans — extended in slice 12 |
| 8 | Polish + Demo Prep (remainder) | **in progress** | Per-step Claude cache shipped; error states still open — [`slice-08-polish.md`](slice-08-polish.md) |
| 9 | Frontend UI/UX + Demo Polish | **done** | UI, scroll, cache, reset, resizable split |
| 9b | Publisher impact hierarchy | **done** | `ImpactPanel` hero blocks for intent/ad/metrics |
| 10 | Persona & Answer Alignment | **done** | Personas, cosine alignment, `AlignmentPanel` |
| 11 | Unit economics (COGS) | **done** | Per-service COGS, token in/out USD, model |
| 12 | Overmind observability | **done** | Tags, span attrs, `capture_exception`; thrad under parent span |

## Active slice

**Slice 8 (remainder)** — error-state hardening ([`slice-08-polish.md`](slice-08-polish.md)). Per-step Claude cache (`intent`, `respond`, `answer_align`) shipped 2026-05-29.

## Slice 8 — per-step cache (partial)

- Commit: `45c04d9` on `feat/slice-08-pipeline-cache`
- `backend/demo_step_cache.py` — namespaced in-memory stores + key helpers
- `backend/intent.py`, `claude_client.py`, `answer_focus.py` — `from_cache` on results
- `backend/main.py` — span attrs; `POST /demo/reset` clears all pipeline caches
- `backend/service_pricing.py` — cached Anthropic steps = $0
- Tests: `test_demo_step_cache.py`, `test_intent_cache.py`, `test_respond_cache.py`, `test_align_cache.py` (50 backend tests total)

## Slice 12 completed

- Commits: `e8a4f59` (feat), `8b19a39` (`.overmind/` gitignore)
- `overmind_setup.py` — `tag_if_active`, `capture_pipeline_error`
- `trace_collector.py` — optional span attributes on `record()`
- `main.py` — request tags; tavily/thrad attrs; errors captured; `thrad.bid` under `adblend.chat`
- `tests/test_overmind_tags.py`, updated `test_trace_collector.py`
- `README.md`, slice docs — Overmind dashboard + Scenario G

## Slice 11 completed

- `backend/service_pricing.py` — env rates, per-step costs, `anthropic_tokens` summary
- `backend/main.py` — `costs` on `ChatResponse`; `session_cogs_usd` on metrics
- `backend/tavily_client.py` — `TavilySearchResult.from_cache` for $0 cached searches
- `frontend/components/CostPanel.tsx`, `TokenCostDetail.tsx`, `lib/token-cost-format.ts`
- Token UI: `N in ($X) · M out ($Y) · $Z total` + model id (unit economics, technical details, chat footer)

## Slice 10 completed

- `data/golden_dataset.json` — top-level `personas[]`; `persona_id` / `persona_role` on entries
- `scripts/enrich_golden_personas.py` — migration + `--check`
- `backend/answer_focus.py` — Claude classifies assistant reply focus + persona
- `backend/alignment.py` — cosine similarity scoring (`text_similarity.py`, `persona_registry.py`)
- `backend/tests/test_alignment.py`, `test_alignment_semantic.py`, `test_answer_focus.py`
- `frontend/components/AlignmentPanel.tsx` — question vs answer fit in side panel
- Pipeline span: `claude.answer_align` (between respond and thrad.bid)

## Slice 9 completed

- `globals.css` — semantic tokens, panel/button/input utilities, reduced motion
- `layout.tsx` — Fira Sans + Fira Code
- Chat, dropdown, intent/metrics/trace/side panels — UI/UX Pro Max polish
- `lucide-react`; `lib/tier-styles.ts`; `components/ui/Spinner.tsx`
- Viewport scroll lock; chat scroll shows top of long assistant replies
- Tavily cache, `POST /demo/reset`, ads toggle, reset demo button, loading skeletons
- `ResizableSplitPane.tsx` — drag/keyboard resize, width in `localStorage`
- `ImpactPanel.tsx`, `AdPlacementPanel.tsx` — impact hierarchy (9b)
- `ChatPanel.tsx` — collapse/expand for long assistant answers

## Slice 7 completed

- `overmind_setup.py` — optional `OVERMIND_API_KEY` init (`providers=["anthropic"]`; auto-traces `anthropic.Anthropic` calls)
- `trace_collector.py` — per-request spans + OTEL when Overmind is on
- `POST /chat` returns `trace`; `/health` exposes `overmind_configured`
- `TracePanel` — span list with latency bars (Overmind vs local label)
- Pipeline under `adblend.chat`: `tavily.search` → `claude.intent` (freeform) → `claude.respond` → `claude.answer_align` → `thrad.bid` (when gated)
- Slice 12 adds dashboard tags, Tavily/Thrad span attributes, and `capture_exception` on failures

## Slice 6 completed

- `backend/metrics.py` — session singleton, fill rate, last impression, `session_cogs_usd` (slice 11)
- `POST /chat` records and returns metrics; `POST /metrics/reset` for demo
- `MetricsPanel` — queries, ads served, no fill, blocked, last impression, reset

## Slice 5 completed

- `IntentPanel` — score bar, tier badge, gate, focus chip, rationale
- Token usage in Technical details section

## Slice 4 completed

- `data/golden_dataset.json` — 89 entries with `intent` + `focus`; 12 new AdTech/AI questions
- `GET /dataset`; dropdown grouped by tier (high / medium / low / off-topic)
- Dropdown passes static `intent` + `focus` to `/chat` (skips live Claude scoring)

## Slice 3 completed

- `backend/intent.py` — Claude scores freeform messages (score, tier, focus)
- `backend/thrad_client.py` — mock sponsored card (no Thrad signup)
- `/chat` returns `intent`, `focus`, `ad`; gate at **0.70**
- Side panel: intent score/tier badge, focus, sponsored card or “No placement”
- `/health` → `thrad_mode: "mock"`

## Slice 2 completed

- Tavily search + Claude grounded responses on `POST /chat`
- `sources` in API; “Powered by Tavily” in chat UI
- Repo-root `.env` loading; `/health` key flags
- Backend on port **8001**

## Slice 1 completed

- Next.js + FastAPI end-to-end skeleton; mock `/chat`; side panel placeholders
