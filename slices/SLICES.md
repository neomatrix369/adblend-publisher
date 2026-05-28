# AdBlend — Slice Plan

**Progress:** see [`PROGRESS.md`](PROGRESS.md) for done / in-progress / queued status.

**Hackathon:** Cursor × Thrad · London · 28 May 2026  
**Track:** 2 — Sell-Side & Measurement (Publisher side)  
**Stack:** Next.js/React (TypeScript) · FastAPI (Python) · Thrad · Tavily · Claude

---

## Core Flow

```
User types / selects from dropdown
        ↓
[Slice 2] Tavily → grounded context (cached in Slice 9 for repeat demos)
        ↓
[Slice 5] Claude → intent score (0.0–1.0)  ← live for freeform
          golden master score              ← static for dropdown
        ↓
score ≥ 0.7 + ads on → [Slice 3] Thrad bid → ad in side panel
        ↓
[Slice 6] Metrics panel updates · [Slice 7] Trace spans
        ↓
[Slice 10] Classify answer → alignment score (persona + focus)
        ↓
[Slice 11] Per-service COGS + session cumulative spend
        ↓
[Slice 9/9b] Publisher UI — layout, impact panels, scroll, demo controls
```

---

## Slice Summary

| # | Slice | Priority | Est. | Status | Branch |
|---|--------|----------|------|--------|--------|
| 1 | Scaffold + Mock | Must | 30 min | done | — |
| 2 | Tavily Grounding | Must | 25 min | done | — |
| 3 | Thrad Intent Gate + Blend | Must | 40 min | done | `feat/slice-03-thrad-blend` |
| 4 | Golden Master Dropdown | Should | 25 min | done | `feat/slice-04-golden-master-dropdown` |
| 5 | Live Intent + Attributes UI | Should | 25 min | done | `feat/slice-05-intent-ui` |
| 6 | AdTech Metrics Panel | Should | 20 min | done | `feat/slice-06-metrics-panel` |
| 7 | Overmind Trace | Could | 20 min | done | `feat/slice-07-overmind-trace` |
| 8 | Polish + Demo Prep (remainder) | Could | 10 min | queued | — |
| 9 | Frontend UI/UX + Demo Polish | Should | ~60 min | **done** | `feat/slice-09-frontend-ux` |
| 9b | Publisher impact hierarchy | Should | ~20 min | **done** | `feat/slice-09-impact-hierarchy` |
| 10 | Persona & Answer Alignment | Should | ~75 min | **done** | `main` |
| 11 | Unit economics (COGS) | Should | ~30 min | **done** | `feat/slice-11-unit-economics` |

**Must Have total: ~95 min**  
**Should Have total: ~200 min** (includes slices 9–11, 9b)  
**Could Have total: ~30 min** (slice 7 done; slice 8 remainder only)

### Slice 8 vs 9 (plan change)

Originally slice 8 covered demo polish (cache, reset, toggles, loading) and slice 9 covered visual design. **Shipped together on slice 9** so one frontend PR covers:

- Design system (Fira, tokens, Lucide, panels)
- Viewport + chat scroll behaviour
- Tavily cache, `POST /demo/reset`, ads toggle, reset demo, loading affordances

**Slice 8** now only tracks what is still open: error-state hardening and final pre-demo checklist — see [`slice-08-polish.md`](slice-08-polish.md).

**Slice 9** spec: [`slice-09-frontend-ux.md`](slice-09-frontend-ux.md)

**Slice 9b** — impact hierarchy: `ImpactPanel`, `AdPlacementPanel`; hero styling for intent/ad/metrics (merged with slice 9 branch work).

**Slice 10** spec: [`slice-10-persona-alignment.md`](slice-10-persona-alignment.md) — restore personas, classify assistant replies, cosine alignment scores in UI.

**Slice 11** spec: [`slice-11-unit-economics.md`](slice-11-unit-economics.md) — per-service COGS, token in/out USD, session cumulative spend.

---

## Intent Tiers

| Tier | Score | `ad_eligible` | What it looks like |
|---|---|---|---|
| `high` | 0.70–1.00 | true | Explicit vendor/product selection for production |
| `medium` | 0.40–0.69 | true | Comparison without explicit buying signal |
| `low` | 0.10–0.39 | false | Educational, conceptual, no product decision |
| `off-topic` | 0.00–0.09 | false | Outside chatbot domain entirely |

---

## Static vs Live Intent

- **Dropdown (static):** use `intent.score` and `ad_eligible` directly from golden master — instant, no Claude call
- **Freeform (live):** call Claude to classify intent at runtime — shows real system behaviour

---

## Golden Master Schema (per entry)

```json
{
  "user_input": "...",
  "persona_id": "current-student",
  "persona_role": "Current Student",
  "references": [],
  "synthesizer_name": "...",
  "focus": {
    "category": "AI tooling",
    "sub_category": "model selection"
  },
  "intent": {
    "tier": "high",
    "score": 0.88,
    "ad_eligible": true,
    "rationale": "Explicit production vendor selection"
  }
}
```

Top-level `personas[]` (id, role, description) returns with `GET /dataset` from **Slice 10**.

---

## Bonus Prizes In Scope

| Prize | Slice | Status |
|---|---|---|
| Best use of Tavily | 2 (+ cache in 9) | Shipped |
| Best use of Overmind | 7 | Shipped |
| Best use of Alpic | — | Out of scope |
| Best use of Cursor | All | Use Composer throughout |
