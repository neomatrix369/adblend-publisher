# Slice 12 — Overmind observability (metadata + errors)

**Priority:** Could Have | **Est:** 15–20 min  
**Depends on:** Slice 7 (base tracing shipped) · Slices 1–11 (pipeline stable)  
**Status:** **done** · Branch: `feat/slice-12-overmind-observability`

---

## Goal

Deepen Overmind integration beyond Slice 7’s init + pipeline spans so judges can **filter and debug** real `/chat` traffic in the dashboard—not only see span names in our UI. Slice 7 proved the pipeline is traced; this slice adds **request context tags**, **span attributes** on non-LLM steps, and **error capture** on failures.

**Narrative for bonus prize:** “Publisher pipeline supervision”—search → intent → respond → align → optional ad—with filterable metadata (`source`, tier, ads) and ERROR spans when the pipeline breaks.

---

## Background (Slice 7 — do not re-implement)

Already shipped:

| Piece | Location |
|-------|----------|
| `init()` + `providers=["anthropic"]` | `backend/overmind_setup.py` |
| `TraceCollector` + OTEL mirror | `backend/trace_collector.py` |
| Parent span `adblend.chat` | `request_trace_root()` in `main.py` |
| Manual spans | `tavily.search`, `claude.intent`, `claude.respond`, `claude.answer_align`, `thrad.bid` |
| UI trace panel | `frontend/components/TracePanel.tsx` |
| Env | `OVERMIND_API_KEY`, `OVERMIND_SERVICE_NAME`, `OVERMIND_ENVIRONMENT` |

See [`slice-07-overmind.md`](slice-07-overmind.md) for baseline spec.

---

## Scope (Must for this slice)

### 1. Request-level tags (`set_tag`)

At the start of `POST /chat` (inside `request_trace_root()`), when Overmind is active, set tags (string values per SDK):

| Tag key | Value source | Why |
|---------|--------------|-----|
| `chat.source` | `req.source` (`dropdown` \| `freeform`) | Compare golden vs live paths |
| `chat.ads_enabled` | `str(req.ads_enabled)` | Ads-off demos |
| `intent.scored_live` | `str(use_live_intent)` | Skip vs Claude intent |
| `intent.tier` | `intent.tier` after resolve | Filter high/off-topic (set after intent known—see implementation note) |

**Implementation note:** `intent.tier` is only known after intent resolution. Either:

- **Option A (preferred):** Call `set_tag("intent.tier", …)` immediately after `_resolve_intent` / static intent merge, still under `adblend.chat` parent; or  
- **Option B:** Omit `intent.tier` from initial tag batch and add only the three pre-intent tags.

Do **not** call `set_user()` unless we add a real user id later—publisher demo has no auth.

### 2. Span attributes on manual spans

Extend `TraceCollector.record()` (or a thin helper) to accept optional attributes when OTEL is available:

| Span | Attributes (examples) |
|------|------------------------|
| `tavily.search` | `tavily.from_cache` (bool), `tavily.source_count` (int) |
| `claude.intent` | `claude.intent.from_cache` (bool) — freeform only; slice 8 |
| `claude.respond` | `claude.respond.from_cache` (bool) — slice 8 |
| `claude.answer_align` | `claude.answer_align.from_cache` (bool) — slice 8 |
| `thrad.bid` | `thrad.ad_served` (bool), `intent.score` (float) |

Use `span.set_attribute` on the current OTEL span inside `record()`’s `finally` block (attributes known after step completes).

Anthropic auto-instrumented spans need no changes.

### 3. Error capture (`capture_exception`)

In `/chat` exception handlers (`ValueError` → 503, generic → 502):

- When `is_overmind_configured()`, call `capture_exception(exc)` before raising `HTTPException`.
- Ensures failed pipelines show **ERROR** status in Overmind dashboard.

No change to HTTP responses or frontend error copy (Slice 8 owns UX messaging).

### 4. Safe no-op when Overmind off

All new calls go through helpers in `overmind_setup.py` (e.g. `tag_request()`, `capture_pipeline_error()`) that no-op if tracing inactive—same pattern as `_otel_span` nullcontext.

---

## Scope (Should — if time)

- [x] `README.md` — short “Overmind dashboard” subsection: env vars, filter by `chat.source`, demo script pointer
- [x] Slice 7 doc — one-line link to this slice as follow-up

## Out of scope (Won’t)

- Frontend Overmind JS SDK / Next.js tracing
- `PromptString` / agent optimizer runs (no multi-agent layer)
- Tavily provider auto-instrumentation (unsupported)
- Changing trace panel UI (unless adding a single “tags” hint in Technical details—optional, not required)
- `set_user()` without real identity

---

## Files to touch

| File | Change |
|------|--------|
| `backend/overmind_setup.py` | `tag_if_active(key, value)`, `capture_error_if_active(exc)` |
| `backend/trace_collector.py` | Optional attrs on `record()`; apply to current span |
| `backend/main.py` | Tags after intent; attrs on tavily/thrad; `capture_exception` in except |
| `backend/tests/test_trace_collector.py` | Attrs on `to_dict` unchanged; test record with attrs no crash when OTEL off |
| `backend/tests/test_overmind_tags.py` | **New** — mock `is_overmind_configured`, assert helpers called / no-op |
| `.env.example` | One-line comment: tags appear in dashboard when key set |

---

## API / contract

No breaking changes:

- `ChatResponse.trace` shape unchanged
- `GET /health` unchanged (`overmind_configured` still boolean)

---

## Verification

```bash
cd backend && PYTHONPATH=. uv run pytest -q
```

Manual (with `OVERMIND_API_KEY` set):

1. `GET /health` → `overmind_configured: true`
2. Freeform high-intent query → dashboard trace for `adblend-publisher`
3. Confirm tags: `chat.source=freeform`, `chat.ads_enabled=true`, etc.
4. Dropdown query → `chat.source=dropdown`, `intent.scored_live=false`
5. Temporarily break pipeline (e.g. unset `ANTHROPIC_API_KEY`) → ERROR span with exception in dashboard
6. Without API key → pytest green; app works; badge **Local**

---

## Demo script add-on (Scenario G — Overmind depth)

After Scenario F (unit economics) in [`slice-08-polish.md`](slice-08-polish.md):

1. Ensure `OVERMIND_API_KEY` in backend env; restart uvicorn
2. Run Scenario A (high intent dropdown) — point to trace panel
3. Open Overmind console → filter service `adblend-publisher`, latest `adblend.chat`
4. Repeat the same query — all cache attrs true (`tavily.from_cache`, `claude.respond.from_cache`, `claude.answer_align.from_cache`; plus `claude.intent.from_cache` on freeform)
5. Mention tags: “We can slice traffic by dropdown vs live and ads on/off”

Claude step cache attrs added in slice 8 — see [`slice-08-polish.md`](slice-08-polish.md).

---

## Done when

- [x] `set_tag` applied for `chat.source`, `chat.ads_enabled`, `intent.scored_live` (+ `intent.tier` per chosen option)
- [x] `tavily.search` and `thrad.bid` spans carry documented attributes when OTEL on
- [x] Pipeline failures call `capture_exception` when Overmind configured
- [x] Helpers no-op without API key; existing Slice 7 behaviour unchanged
- [x] Tests added/updated; `pytest -q` green
- [x] No measurable latency regression on `/chat` (tags are O(1) string sets)

## Shipped implementation

| File | Change |
|------|--------|
| `overmind_setup.py` | `tag_if_active`, `capture_pipeline_error` |
| `trace_collector.py` | `record(..., attributes=)` + OTEL `set_attribute` |
| `main.py` | Tags under `adblend.chat`; `thrad.bid` moved inside parent span |
| `tests/test_overmind_tags.py` | Helper unit tests |
| `tests/test_trace_collector.py` | Attributes dict smoke test |
| `README.md` | Overmind dashboard subsection |
| `.gitignore` | Ignore `.overmind/` (local `overmind init` config; use repo `.env` for API key) |

**Commits:** `e8a4f59` · `8b19a39` on `feat/slice-12-overmind-observability`

---

## References

- [Overmind — How to use tracing](https://docs.overmindlab.ai/guides/how-to-use-tracing)
- [Overmind — Python SDK (`set_tag`, `capture_exception`, `get_tracer`)](https://docs.overmindlab.ai/guides/sdk-python)
- Prior research: conversation notes on Slice 7 gaps (tags, errors, Tavily attrs)
