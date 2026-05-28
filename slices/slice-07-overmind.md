# Slice 7 — Overmind Trace Panel
**Priority:** Could Have | **Est:** 20 min  
**Depends on:** Slices 1–6 complete  
**Condition:** Only attempt if time allows

---

## Goal

Add Overmind tracing to auto-instrument all Claude and Tavily calls. Show a live trace summary in the UI. Targets the Overmind bonus prize — judges want to see Overmind doing real work, not a throwaway badge.

---

## What Gets Traced

With Overmind auto-instrumentation, every call in the pipeline is captured:
- Tavily search call (Slice 2)
- Claude intent scoring call (Slice 3/5)
- Claude organic response call (Slice 2)

That gives a real trace tree per query — not mocked.

---

## Backend Setup

**Install:** `pip install overmind-sdk`

**File:** `backend/main.py` — add at top, before anything else:

```python
import overmind

overmind.init(
    api_key=os.getenv("OVERMIND_API_KEY"),
    service_name="adblend-publisher"
)
# Auto-instruments anthropic + tavily calls — nothing else needed
```

---

## Trace Summary In Response

Overmind SDK provides span data after each traced call. Extract a lightweight summary:

```python
# After all calls complete, pull last trace summary
trace_summary = overmind.get_last_trace_summary()  # check actual SDK method

return {
    ...
    "trace": {
        "span_count": trace_summary.span_count,
        "total_latency_ms": trace_summary.total_ms,
        "calls": [
            {"name": s.name, "latency_ms": s.duration_ms}
            for s in trace_summary.spans
        ]
    }
}
```

---

## Trace Panel UI (side panel, below metrics)

```
┌─────────────────────────────┐
│  TRACE  (Overmind)          │
│                             │
│  3 spans · 847ms total      │
│                             │
│  tavily.search      312ms   │
│  claude.intent       89ms   │
│  claude.respond     446ms   │
└─────────────────────────────┘
```

---

## Environment

```
OVERMIND_API_KEY=...
```

---

## Steps

1. `pip install overmind-sdk`
2. Add `overmind.init()` at top of `main.py`
3. Check SDK docs for `get_last_trace_summary()` or equivalent
4. Add `trace` field to response payload
5. Build trace panel component (simple list, latency bars)
6. Verify traces appear in Overmind dashboard at `console.overmindlab.ai`

---

## Done When

- [ ] Traces visible in Overmind dashboard for every query
- [ ] Trace panel in UI shows span names + latencies
- [ ] Claude intent call and Claude respond call appear as separate spans
- [ ] Tavily call appears as a traced span
- [ ] No performance regression (tracing is async/non-blocking)
