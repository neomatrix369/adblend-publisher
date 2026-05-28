# Slice 1 — Scaffold + Mock
**Priority:** Must Have | **Est:** 30 min

---

## Goal

End-to-end skeleton running locally. User types a message, gets a mock response. All panels visible but empty/placeholder. No real API calls.

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  AdBlend Publisher  [dropdown ▼ ...............]  [Send] │
├──────────────────────────┬──────────────────────────────┤
│                          │  INTENT                       │
│   CHAT                   │  Score: —    Tier: —          │
│                          │  Focus: —                     │
│   [user message]         ├──────────────────────────────┤
│   [mock response]        │  AD                           │
│                          │  No placement yet             │
│                          ├──────────────────────────────┤
│                          │  METRICS                      │
│                          │  Queries: 0                   │
│                          │  Ads served: 0                │
│                          │  Fill rate: —                 │
│ [input box.............]  │                              │
└──────────────────────────┴──────────────────────────────┘
```

---

## Backend

**File:** `backend/main.py`  
**Endpoint:** `POST /chat`

```python
# Request
{ "message": "string", "source": "freeform" | "dropdown" }

# Response
{
  "response": "string",          # mock text for now
  "intent": null,                # populated in Slice 5
  "ad": null,                    # populated in Slice 3
  "metrics": null                # populated in Slice 6
}
```

---

## Frontend

**Files:**
- `frontend/app/page.tsx` — main layout
- `frontend/components/ChatPanel.tsx` — message list + input
- `frontend/components/SidePanel.tsx` — intent + ad + metrics placeholders
- `frontend/components/Dropdown.tsx` — empty for now, populated in Slice 4

**Design tokens:**
- Background: `#0e0e12`
- Panel border: `#1e1e28`
- Accent: `#f97316` (orange, matches Thrad brand)
- Text primary: `#e5e7eb`
- Text muted: `#6b7280`

---

## Steps

1. Init Next.js project with TypeScript + Tailwind
2. Build three-column layout (chat | side panel)
3. Wire chat input → POST /chat → display response
4. Add placeholder sections in side panel (intent, ad, metrics)
5. Add empty dropdown in header
6. Init FastAPI with `/chat` returning mock response
7. CORS configured for local dev

---

## Done When

- [ ] App loads at `localhost:3000`
- [ ] Type a message → mock response appears in chat
- [ ] All three side panel sections visible (empty)
- [ ] Dropdown renders (empty options)
- [ ] No console errors
- [ ] Backend running at `localhost:8001`
