# Slice 3 — Thrad Intent Gate + Blend
**Priority:** Must Have | **Est:** 40 min  
**Depends on:** Slice 2

---

## Goal

Score intent on every message. If score ≥ 0.70, call Thrad staging API for an ad. Blend the ad into the response panel. If no fill or score too low, serve organic only — no errors.

---

## Flow

```
message + focus
    ↓
score = intent_score(message)   ← simple Claude call (fast)
    ↓
score ≥ 0.70 → call Thrad → ad payload | no_fill
score < 0.70 → skip Thrad
    ↓
return response + ad (or null)
```

---

## Intent Scoring (fast Claude call)

**File:** `backend/intent.py`

```python
import anthropic, json

client = anthropic.Anthropic()

SYSTEM = """You are a commercial intent classifier for an AI publisher.
Score the user's message from 0.0 to 1.0 based on purchase/adoption intent.
0.0 = off-topic or purely educational
0.7+ = clear commercial intent (vendor selection, pricing, production deployment)
Return ONLY valid JSON: {"score": float, "tier": "high|medium|low|off-topic"}"""

def score(message: str) -> dict:
    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=64,
        system=SYSTEM,
        messages=[{"role": "user", "content": message}]
    )
    return json.loads(resp.content[0].text)
```

---

## Thrad Integration

**File:** `backend/thrad_client.py`

```python
import httpx, os

THRAD_ENDPOINT = "https://ssp.thrads.ai/api/v1/ad/bid"
PUBLISHER_KEY  = os.getenv("THRAD_STAGING_KEY")

def request_ad(focus: dict, intent_score: float) -> dict | None:
    payload = {
        "publisher_id": "my-hackathon-bot",
        "context": {
            "category": focus.get("category", ""),
            "sub_category": focus.get("sub_category", "")
        },
        "intent_score": intent_score,
        "format": "sponsored_message"
    }
    headers = {"Authorization": f"Bearer {PUBLISHER_KEY}"}
    resp = httpx.post(THRAD_ENDPOINT, json=payload, headers=headers, timeout=3.0)
    if resp.status_code == 200:
        return resp.json()   # ad payload
    return None              # no fill — silent fallback
```

---

## Backend `/chat` Update

```python
from intent import score as intent_score
from thrad_client import request_ad

@app.post("/chat")
async def chat(req: ChatRequest):
    # Tavily + Claude response (from Slice 2)
    sources = tavily_search(req.message)
    context = build_context(sources)
    response_text = claude_respond(req.message, context)

    # Intent gate
    if req.source == "freeform":
        intent = intent_score(req.message)   # live Claude call
    else:
        intent = req.intent                  # static from golden master

    # Thrad — only call if eligible
    ad = None
    if intent["score"] >= 0.70:
        ad = request_ad(req.focus or {}, intent["score"])

    return {
        "response": response_text,
        "sources": sources,
        "intent": intent,
        "ad": ad,
        "metrics": None
    }
```

---

## Frontend Ad Panel

When `ad` is not null, render in the AD section of the side panel:

```tsx
// Sponsored placement card
<div className="border border-orange-500/30 rounded-lg p-3 bg-orange-500/5">
  <span className="text-xs text-orange-400 uppercase tracking-wider">Sponsored</span>
  <p className="text-sm text-gray-200 mt-1">{ad.headline}</p>
  <p className="text-xs text-gray-400 mt-1">{ad.body}</p>
  <a href={ad.cta_url} className="text-xs text-orange-400 mt-2 block">
    {ad.cta_label} →
  </a>
</div>
```

When `ad` is null:

```tsx
<p className="text-xs text-gray-600">No placement — intent below threshold</p>
```

---

## Environment

```
THRAD_STAGING_KEY=...   # staging key always returns an ad, no cost
```

---

## Steps

1. Create `intent.py` with fast Claude scoring call
2. Create `thrad_client.py` with staging endpoint
3. Update `/chat` with gate logic
4. Update `ChatRequest` model: add `source`, `intent` (optional), `focus` (optional)
5. Wire ad panel in frontend
6. Test: high-intent query → ad appears; low-intent → no ad

---

## Done When

- [ ] High-intent query → ad card appears in side panel
- [ ] Low-intent query → "No placement" message shown
- [ ] Thrad no-fill → graceful fallback, no UI error
- [ ] Intent score visible in intent panel (score + tier badge)
- [ ] Staging key used (never production key)
