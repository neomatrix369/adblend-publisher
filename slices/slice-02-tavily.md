# Slice 2 — Tavily Grounding
**Priority:** Must Have | **Est:** 25 min  
**Depends on:** Slice 1

---

## Goal

Replace mock response with a real Claude response grounded by Tavily search results. Every message — typed or dropdown — gets Tavily context before Claude answers.

---

## Flow

```
message → Tavily.search(message) → top 3 results
        → Claude(message + results as context) → response
        → return to frontend
```

---

## Backend Changes

**File:** `backend/tavily_client.py`

```python
from tavily import TavilyClient

client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def search(query: str) -> list[dict]:
    results = client.search(query, max_results=3)
    return results["results"]  # [{title, url, content}, ...]
```

**File:** `backend/main.py` — update `/chat`

```python
from tavily_client import search as tavily_search
import anthropic

@app.post("/chat")
async def chat(req: ChatRequest):
    # 1. Tavily grounding
    sources = tavily_search(req.message)
    context = "\n\n".join([f"{s['title']}: {s['content']}" for s in sources])

    # 2. Claude response
    client = anthropic.Anthropic()
    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        system="You are a helpful AI assistant. Use the provided context to answer accurately.",
        messages=[
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {req.message}"}
        ]
    )
    response_text = msg.content[0].text

    return {
        "response": response_text,
        "sources": sources,   # pass back for potential UI display
        "intent": None,
        "ad": None,
        "metrics": None
    }
```

---

## Environment

```
TAVILY_API_KEY=tvly-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Steps

1. `pip install tavily-python anthropic`
2. Create `tavily_client.py`
3. Update `/chat` to call Tavily then Claude
4. Verify responses are grounded (not hallucinated)
5. Frontend: show "Powered by Tavily" subtle label under response (Tavily bonus)

---

## Done When

- [ ] Type any question → real grounded response (not mock)
- [ ] Response references actual current information
- [ ] Sources available in response payload
- [ ] No Tavily API errors on valid queries
- [ ] Falls back gracefully if Tavily returns empty results
