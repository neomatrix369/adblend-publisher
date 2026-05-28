# Slice 10 — Personas, Focus & Answer Alignment
**Priority:** Should Have | **Est:** ~75 min  
**Depends on:** Slices 4 (golden master), 5 (focus UI), 9 (panels / layout)  
**Status:** **done** · Branch: `feat/slice-10-persona-alignment` (merged to `main`)

---

## Goal

Restore the **original golden-dataset model** (personas → questions with per-question `focus`) and add **measurement**: classify each assistant reply, then show how well the **answer** aligns with the **question** on persona and focus traits.

This closes the gap left when Slice 4 flattened `personas[]` into `entries[]` and when Slices 3–5 scoped “attributes” to **commercial intent** only (not answer↔question fit).

**Skateboard (shipped):** persona chip + question vs answer focus + composite alignment score in the side panel.  
**Not in scope:** batch runs over all 89 questions, Search Explorer, or changing the intent/ad gate.

---

## Background (what shipped)

| Capability | Original scaffold | After slice 4 | Slice 10 (shipped) |
|------------|-------------------|---------------|---------------------|
| Personas (`id`, `role`, `description`) | 8 personas | Dropped on flatten | Restored on entries + `personas[]` |
| Question → `focus` | Per question | `category` + `sub_category` | Unchanged |
| Question → `intent` | — | Golden + live classifier | Unchanged |
| Answer → traits | — | — | Claude classify reply |
| Answer ↔ question match % | — | — | Cosine similarity scores + UI |
| `references`, `synthesizer_name` | Present | Unused | Still optional (Could) |

---

## Data model

### Hybrid `data/golden_dataset.json`

Keep **`entries[]`** for the dropdown. Top-level **`personas[]`** for labels; each entry enriched with `persona_id` / `persona_role`:

```json
{
  "personas": [
    {
      "id": "current-student",
      "role": "Current Student",
      "description": "Enrolled student navigating aid and loans."
    }
  ],
  "entries": [
    {
      "user_input": "How much can I borrow for my degree program?",
      "persona_id": "current-student",
      "persona_role": "Current Student",
      "focus": {
        "category": "Student financial aid",
        "sub_category": "General"
      },
      "intent": { "tier": "off-topic", "score": 0.04, "ad_eligible": false, "rationale": "..." }
    }
  ]
}
```

**Migration:** `scripts/enrich_golden_personas.py` — student-aid personas from git `d371cf9`; AdTech demo questions map to `software-engineer` or `ad-publisher`. Run `--check` in CI/manual verification.

### API types (response)

```json
{
  "alignment": {
    "question": {
      "persona_id": "current-student",
      "persona_role": "Current Student",
      "focus": { "category": "...", "sub_category": "..." }
    },
    "answer": {
      "focus": { "category": "...", "sub_category": "..." },
      "persona_id": "current-student",
      "rationale": "one line"
    },
    "scores": {
      "focus_match": 0.85,
      "persona_match": 1.0,
      "overall": 0.91
    },
    "labels": {
      "focus": "strong",
      "persona": "match"
    }
  }
}
```

---

## Alignment scoring (shipped)

Implement in `backend/alignment.py` — **no LLM for numeric scores** (classifier only supplies labels). Uses **cosine similarity** on text (`text_similarity.py`, `persona_registry.py`).

### Focus match (0.0–1.0)

| Condition | `focus_match` |
|-----------|----------------|
| Same `category` and same `sub_category` (case-insensitive) | **1.0** |
| Weak/empty focus on either side | **0.35** (`WEAK_FOCUS_SCORE`) |
| Otherwise | `max(full_text_sim, category_sim, sub_category_sim)` via cosine similarity |

### Persona match (0.0–1.0 or null)

| Condition | `persona_match` |
|-----------|-----------------|
| Question has no `persona_id` (freeform) | `null` — overall = focus only |
| Exact `persona_id` match | **1.0** |
| Otherwise | Cosine similarity between persona profile texts; label **match** if ≥ **0.75** |

### Overall (0.0–1.0)

```
if persona_match is null:
  overall = focus_match
else:
  overall = 0.6 * focus_match + 0.4 * persona_match
```

**Human labels:** `strong` ≥ 0.75 · `partial` ≥ 0.45 · `weak` otherwise.

---

## Backend (shipped)

| Module | Role |
|--------|------|
| `answer_focus.py` | Claude classifies assistant reply focus + persona |
| `alignment.py` | Cosine similarity scoring |
| `text_similarity.py` | Embedding-free cosine on token vectors |
| `persona_registry.py` | Persona id → profile text for similarity |

### Pipeline order (`main.py`)

```
tavily.search → claude.intent (if freeform) → claude.respond → claude.answer_align → thrad.bid
```

- Trace span: `claude.answer_align`
- Dropdown: question traits from request + entry; answer traits from classifier
- `ChatRequest`: optional `persona_id`, `persona_role` from dropdown selection

### Tests

| File | Covers |
|------|--------|
| `tests/test_alignment.py` | Focus/persona/overall tables |
| `tests/test_alignment_semantic.py` | Cosine similarity edge cases |
| `tests/test_answer_focus.py` | Classifier parse / fallback |
| `tests/test_text_similarity.py` | Similarity helper |
| `tests/test_persona_registry.py` | Persona profile lookup |

---

## Frontend (shipped)

**`AlignmentPanel.tsx`** — side panel block showing question vs answer persona/focus and overall match bar. Uses `ImpactPanel` styling. Loading skeleton while chat request in flight.

**`frontend/lib/api.ts`** — `AlignmentPayload`, extended `ChatResponse` and `DatasetEntry`.

---

## Exit criteria

- [x] `golden_dataset.json` includes `personas[]` and `persona_id` on student-aid entries
- [x] `POST /chat` returns `alignment` with `scores.overall` for every successful reply
- [x] Side panel shows question vs answer focus and overall match %
- [x] Dropdown selection passes persona into request; alignment uses golden question traits
- [x] Freeform: question focus from intent classifier; answer focus from reply classifier
- [x] Intent gate and ad placement behaviour unchanged
- [x] `pytest` alignment tests pass; `npm run build` passes

---

## Verification

```bash
uv run python scripts/enrich_golden_personas.py --check
cd backend && PYTHONPATH=. uv run pytest tests/test_alignment.py tests/test_alignment_semantic.py tests/test_answer_focus.py -q
cd frontend && npm run lint && npm run build
```

---

## MoSCoW

| | Item |
|---|------|
| **Must** | Persona metadata on entries; answer focus classifier; alignment scores in API + UI |
| **Should** | Migration script; trace span; unit tests for scoring |
| **Could** | Dropdown grouped by persona; show `synthesizer_name` in panel |
| **Won't** | Batch evaluation dashboard; changing intent thresholds |

---

## Commits (on main)

1. `feat(slice-10): persona alignment, demo personas, and clearer metrics`
2. `docs(slices): mark slice 10 done after merge to main`
3. `feat(alignment): score focus and persona with cosine similarity`

---

## Relationship to other slices

- **Slice 5:** Intent panel = **commercial intent**; alignment = separate **quality / measurement** story.
- **Slice 7:** `claude.answer_align` appears in trace panel.
- **Slice 11:** Alignment Claude call included in unit economics COGS lines.
