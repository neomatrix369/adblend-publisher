# Slice 4 — Golden Master Dropdown
**Priority:** Should Have | **Est:** 25 min  
**Depends on:** Slice 3

---

## Goal

Load the golden master into a dropdown grouped by intent tier. Selecting a question fires the full pipeline using the static intent values from the dataset — no live Claude scoring needed.

---

## Golden Master Schema (per entry)

```json
{
  "user_input": "Which vector database should I use for a production RAG system?",
  "references": [],
  "synthesizer_name": "manual",
  "focus": {
    "category": "AI tooling",
    "sub_category": "model selection"
  },
  "intent": {
    "tier": "high",
    "score": 0.92,
    "ad_eligible": true,
    "rationale": "Explicit production vendor selection"
  }
}
```

---

## Intent Fields To Add To Existing Entries

Existing questions (EFC, Cost of Attendance, eligibility) → all get:
```json
"intent": { "tier": "off-topic", "score": 0.04, "ad_eligible": false,
  "rationale": "Student financial aid — outside chatbot domain" }
```

New questions to add (drafted at this slice):

**HIGH (ad_eligible: true)**
- "Which vector database should I use for a production RAG system with 50M embeddings?" → score: 0.92
- "Pinecone vs Weaviate Cloud for enterprise search — what are real costs at scale?" → score: 0.85
- "Which SSP should we integrate with to maximise fill rate for our AI chatbot?" → score: 0.88
- "Which LLM API is most cost-effective for 10M queries/month in production?" → score: 0.82
- "What attribution platform should we use to track chatbot → paid subscription conversions?" → score: 0.79

**MEDIUM (ad_eligible: true)**
- "How does LangChain compare to LlamaIndex for building RAG pipelines?" → score: 0.55
- "What metrics matter most when measuring ROI of in-chat advertising?" → score: 0.62
- "Difference between text-embedding-3-small and text-embedding-3-large for semantic search?" → score: 0.48
- "How does intent-based targeting work in conversational AI contexts?" → score: 0.58

**LOW (ad_eligible: false)**
- "How does cosine similarity work in vector search?" → score: 0.15
- "Explain how retrieval-augmented generation works" → score: 0.12
- "What is programmatic advertising and how does it work?" → score: 0.22

---

## Backend Endpoint

**File:** `backend/main.py` — add:

```python
@app.get("/dataset")
async def get_dataset():
    with open("golden_dataset.json") as f:
        data = json.load(f)
    return data  # full list, frontend groups by tier
```

---

## Frontend Dropdown

Group options by tier with visual separators:

```
[dropdown ▼]
  ── 🔴 High Intent ──
  Which vector database for production...
  Pinecone vs Weaviate Cloud...
  ── 🟡 Medium Intent ──
  LangChain vs LlamaIndex...
  ── 🟢 Low Intent ──
  How does cosine similarity work...
  ── ⚫ Off-topic ──
  How do I calculate my EFC...
```

**On selection:**
- Populate input box with `user_input`
- Set `source: "dropdown"` in request
- Pass `intent` object from dataset directly (skip live scoring)
- Pass `focus` object from dataset

---

## ChatRequest Update

```python
class ChatRequest(BaseModel):
    message: str
    source: str = "freeform"         # "freeform" | "dropdown"
    intent: dict | None = None       # pre-set from golden master (dropdown only)
    focus: dict | None = None        # from golden master or detected
```

---

## Steps

1. Add `intent` fields to all existing golden master entries
2. Add new questions (high/medium/low tiers) to golden master
3. Create `GET /dataset` endpoint
4. Load dataset on frontend mount, group by tier
5. Wire selection → populate input + pass static intent
6. Verify: selecting high-intent question → Thrad fires without Claude intent call

---

## Done When

- [x] Dropdown loads all questions grouped by tier (colour-coded)
- [x] Selecting high-intent question → ad appears (no extra Claude call for scoring)
- [x] Selecting off-topic question → no ad, gate reason shown
- [x] Freeform typing still uses live intent scoring (unchanged)
- [x] Tier badge in intent panel shows correct value for both paths
