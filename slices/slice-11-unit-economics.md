# Slice 11 — Unit economics (end-to-end COGS)

**Branch:** `feat/slice-11-unit-economics`  
**Status:** done  
**Outcome:** Each `/chat` response estimates per-service COGS; the UI shows per-step and aggregate token costs with in/out USD and model id.

## Pricing assumptions (configurable via env)

| Service | Unit | Default | Notes |
|---------|------|---------|-------|
| Anthropic (Claude Sonnet 4) | $/MTok in · out | $3 · $15 | `ANTHROPIC_INPUT_USD_PER_MTOK`, `ANTHROPIC_OUTPUT_USD_PER_MTOK`; model from `ANTHROPIC_MODEL` |
| Tavily | $/search | $0.01 | `TAVILY_USD_PER_SEARCH`; cached search = $0 |
| Thrad (mock) | $/bid | $0 | `THRAD_USD_PER_BID` when live bidding ships |

## Pipeline → cost lines

| Trace step | Cost basis |
|------------|------------|
| `tavily.search` | Flat per search if not cache hit |
| `claude.intent` | Input/output tokens + split USD (omitted when dropdown static intent) |
| `claude.respond` | Input/output tokens + split USD |
| `claude.answer_align` | Input/output tokens + split USD |
| `thrad.bid` | Flat per bid attempt when gate passes |

## API (`ChatResponse.costs`)

```json
{
  "lines": [
    {
      "service": "anthropic",
      "step": "claude.respond",
      "label": "Grounded response",
      "amount_usd": 0.009,
      "input_tokens": 1032,
      "output_tokens": 410,
      "input_cost_usd": 0.003096,
      "output_cost_usd": 0.00615,
      "model": "claude-sonnet-4-20250514"
    }
  ],
  "total_usd": 0.042,
  "session_cumulative_usd": 0.128,
  "anthropic_tokens": {
    "model": "claude-sonnet-4-20250514",
    "input_tokens": 1522,
    "output_tokens": 548,
    "input_cost_usd": 0.004566,
    "output_cost_usd": 0.00822,
    "total_cost_usd": 0.012786,
    "input_usd_per_mtok": 3,
    "output_usd_per_mtok": 15
  }
}
```

`SessionMetrics` gains `session_cogs_usd` (accumulates per query; resets with metrics/demo reset).

`tavily_client.search` returns `TavilySearchResult { sources, from_cache }` for zero-cost cache hits.

## Backend modules

| File | Role |
|------|------|
| `backend/service_pricing.py` | Rates, `build_query_costs`, `build_anthropic_token_summary`, per-line split costs |
| `backend/main.py` | Wire costs into `/chat` response |
| `backend/metrics.py` | Session COGS accumulation |
| `backend/tavily_client.py` | Cache-aware search result |

## Frontend

| File | Role |
|------|------|
| `frontend/components/CostPanel.tsx` | Unit economics panel (per pipeline step) |
| `frontend/components/TokenCostDetail.tsx` | Shared formatter: `N in ($X) · M out ($Y) · $Z total` + model |
| `frontend/lib/token-cost-format.ts` | USD formatting, line/summary helpers |
| `frontend/components/SidePanel.tsx` | Cost panel + token usage in Technical details |
| `frontend/components/ChatPanel.tsx` | Assistant footer shows aggregate anthropic token costs |
| `frontend/app/page.tsx` | State for `costs`, pass `anthropicTokenCost` on messages |

## Token display format

Example (default Sonnet 4 rates):

```text
1,032 in ($0.003) · 410 out ($0.006) · $0.009 total
claude-sonnet-4-20250514
```

Shown in: Unit economics (per step), Technical details → Token usage (aggregate), chat assistant footer.

## Exit criteria

- [x] `PYTHONPATH=. uv run pytest` — all tests pass (incl. `test_service_pricing.py`, `test_metrics.py`, `test_tavily_cache.py`)
- [x] Tavily cache exposes `from_cache`; uncached vs cached cost lines correct
- [x] `/chat` returns `costs` with lines aligned to trace steps
- [x] Anthropic lines include `input_cost_usd`, `output_cost_usd`, `model`
- [x] `costs.anthropic_tokens` aggregates all Claude steps for the query
- [x] Side panel: `CostPanel` + enriched token usage
- [x] Chat footer shows in/out USD and total for the model
- [x] `.env.example` documents pricing overrides

## Verification

```bash
cd backend && PYTHONPATH=. uv run pytest -q
# Optional E2E: uvicorn on 8001, npm run dev, freeform query → Unit economics + Token usage
```
