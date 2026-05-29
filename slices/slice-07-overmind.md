# Slice 7 — Overmind Trace Panel
**Priority:** Could Have | **Est:** 20 min  
**Depends on:** Slices 1–6 complete  
**Status:** **done** · Branch: `feat/slice-07-overmind-trace`

---

## Goal

Add Overmind tracing to instrument Claude calls. Show a live trace summary in the UI. Targets the Overmind bonus prize — show Overmind doing real work on the pipeline, not a throwaway badge.

---

## What Gets Traced

Each `/chat` request records timed spans via `TraceCollector` (always) and mirrors them as OTEL spans when Overmind is configured:

| Span | When |
|------|------|
| `tavily.search` | Every query |
| `claude.intent` | Freeform only (dropdown uses static intent) |
| `claude.respond` | Every query |
| `claude.answer_align` | Every query (slice 10) |
| `thrad.bid` | When ads enabled and score ≥ 0.70 |

Parent span `adblend.chat` wraps the pipeline for the Overmind dashboard.

---

## Shipped implementation

**Install:** `overmind-sdk` (in `requirements.txt`)

**File:** `backend/overmind_setup.py` — called once at startup from `main.py`:

```python
init(
    overmind_api_key=api_key,
    service_name=os.getenv("OVERMIND_SERVICE_NAME", "adblend-publisher"),
    environment=os.getenv("OVERMIND_ENVIRONMENT", "development"),
    providers=["anthropic"],  # auto-instruments Anthropic SDK calls
)
```

**File:** `backend/trace_collector.py` — `TraceCollector.record(name)` times each step and calls `get_tracer().start_as_current_span(name)` when Overmind is available. Works locally without an API key.

**Response:** `trace` field on `ChatResponse` from `TraceCollector.to_dict()` — not `get_last_trace_summary()`.

---

## Trace Panel UI (side panel, Technical details)

```
┌─────────────────────────────┐
│  TRACE  (Overmind | Local)  │
│                             │
│  5 spans · 1247ms total     │
│                             │
│  tavily.search      312ms   │
│  claude.intent       89ms   │
│  claude.respond     446ms   │
│  claude.answer_align  95ms  │
│  thrad.bid           12ms   │
└─────────────────────────────┘
```

Badge shows **Overmind** when `OVERMIND_API_KEY` is set and init succeeded; **Local** otherwise.

---

## Environment

```
OVERMIND_API_KEY=...
OVERMIND_SERVICE_NAME=adblend-publisher
OVERMIND_ENVIRONMENT=development
```

---

## Done When

- [x] Traces visible in Overmind dashboard when API key configured
- [x] Trace panel in UI shows span names + latencies
- [x] Claude intent and respond appear as separate spans
- [x] Tavily call appears as a traced span
- [x] `thrad.bid` and `claude.answer_align` traced (post-slice-7 additions)
- [x] No performance regression (tracing is lightweight / non-blocking)

---

## Follow-up

**Slice 12** — dashboard metadata and error capture: [`slice-12-overmind-observability.md`](slice-12-overmind-observability.md) (`set_tag`, span attributes, `capture_exception`). Implement after this slice is stable in production demos.
