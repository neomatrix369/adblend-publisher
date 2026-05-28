# Slice 8 — Polish + Demo Prep
**Priority:** Could Have | **Est:** 15 min  
**Depends on:** Slices 1–6 complete

---

## Goal

Tighten the demo experience. Fast response via caching. Clean reset. Toggle controls. No rough edges visible to judges.

---

## Checklist

### Tavily Cache
Avoid re-fetching the same query twice during the demo:

```python
# backend/tavily_client.py
_cache: dict[str, list] = {}

def search(query: str) -> list[dict]:
    if query in _cache:
        return _cache[query]
    results = client.search(query, max_results=3)["results"]
    _cache[query] = results
    return results
```

### Demo Reset Button
Full state reset — metrics, chat history, intent panel, ad panel:

```tsx
<button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-300">
  Reset demo
</button>
```

Backend: `POST /reset` → clears `session_metrics` singleton.

### Ad Toggle
Let judges toggle ads on/off to show the contrast:

```tsx
const [adsEnabled, setAdsEnabled] = useState(true)
// Pass adsEnabled in request body
// Backend: if not adsEnabled, skip Thrad call regardless of score
```

### Loading States
Prevent jarring empty → populated transitions:
- Skeleton loaders in intent panel while scoring
- "Searching..." in chat while Tavily runs
- "Requesting placement..." in ad panel while Thrad call is in flight

### Error States
- Thrad timeout (3s) → silent no-fill, no UI error
- Tavily empty results → Claude answers from training knowledge only
- Claude failure → show "Response unavailable" gracefully

### Final Checks
- [ ] No `console.error` in browser during normal flow
- [ ] API keys not exposed in frontend bundle
- [ ] Works on a fresh browser tab (no stale state)
- [ ] Mobile-readable if demoed on a tablet
- [ ] Dropdown scrollable if many questions

---

## Demo Script (30 seconds per scenario)

**Scenario A — High intent fires:**
1. Select "Which vector database for production..." from dropdown
2. Point to: intent score (0.92), tier badge (HIGH), ad appearing
3. "Thrad served a placement because intent was above threshold"

**Scenario B — Off-topic blocked:**
1. Select any EFC/financial aid question from dropdown
2. Point to: score (0.04), tier (OFF-TOPIC), no ad, gate reason
3. "Publisher only monetises relevant intent — junk traffic is gated out"

**Scenario C — Live freeform:**
1. Type: "I need a vector DB for our startup's semantic search"
2. Show live scoring in real time
3. Ad appears — "this is the live path, not a dataset lookup"
