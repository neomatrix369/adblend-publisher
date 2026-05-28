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
[Slice 2] Tavily → grounded context
        ↓
[Slice 5] Claude → intent score (0.0–1.0)  ← live for freeform
          golden master score              ← static for dropdown
        ↓
score ≥ 0.7 → [Slice 3] Thrad bid → ad blended into response
score < 0.7 → organic response only
        ↓
[Slice 6] Metrics panel updates
```

---

## Slice Summary

| # | Slice | Priority | Est. |
|---|---|---|---|
| 1 | Scaffold + Mock | Must | 30 min |
| 2 | Tavily Grounding | Must | 25 min |
| 3 | Thrad Intent Gate + Blend | Must | 40 min |
| 4 | Golden Master Dropdown | Should | 25 min |
| 5 | Live Intent + Attributes UI | Should | 25 min |
| 6 | AdTech Metrics Panel | Should | 20 min |
| 7 | Overmind Trace | Could | 20 min |
| 8 | Polish + Demo Prep | Could | 15 min |
| 9 | Frontend UI/UX Polish | Should | 45 min |

**Must Have total: ~95 min**  
**Should Have total: ~70 min**  
**Could Have total: ~35 min**  
**Slice 9 (UI/UX): ~45 min** — see [`slice-09-frontend-ux.md`](slice-09-frontend-ux.md)

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
  "references": [...],
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

---

## Bonus Prizes In Scope

| Prize | Slice | Status |
|---|---|---|
| Best use of Tavily | 2 | Must ship |
| Best use of Overmind | 7 | Only if 1–6 done |
| Best use of Alpic | — | Out of scope |
| Best use of Cursor | All | Use Composer throughout |
