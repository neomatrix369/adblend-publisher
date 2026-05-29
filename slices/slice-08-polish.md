# Slice 8 — Polish + Demo Prep (remainder)
**Priority:** Could Have | **Est:** 10 min  
**Depends on:** Slices 1–11 (most polish shipped in slices 9–11)

---

## Goal

Close remaining demo rough edges **not** already delivered in slices 9–11: resilient error paths and a quick pre-demo checklist.

---

## Shipped in Slice 9 (do not re-implement here)

- [x] Viewport locked to `h-dvh`; chat and side panel scroll independently
- [x] Long assistant replies scroll to **start** of bubble (not clipped mid-answer)
- [x] Tavily in-memory cache + `clear_cache()` on demo reset
- [x] `POST /demo/reset` (metrics + cache)
- [x] **Reset demo** header button (full UI + backend reset)
- [x] **Ads enabled** toggle + `ads_enabled` on `POST /chat`
- [x] Loading: intent skeleton, placement message, chat status text
- [x] Resizable chat/side split (`ResizableSplitPane`, `localStorage`)
- [x] Collapse/expand for long assistant answers (`ChatPanel`)

---

## Remaining checklist

### Error States
- [ ] Thrad timeout (3s) → silent no-fill, no UI error
- [ ] Tavily empty results → Claude answers from training knowledge only (verify behaviour)
- [ ] Claude failure → show "Response unavailable" gracefully

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

**Scenario D — Ads off (slice 9):**
1. Uncheck **Ads enabled** in the side panel
2. Run a high-intent query — response without sponsored placement

**Scenario E — Answer alignment (slice 10):**
1. Select a student-aid dropdown question with a persona
2. After reply, point to **Answer fit** panel: focus match %, persona match
3. "Publisher can measure whether the assistant stayed on-topic for that user segment"

**Scenario F — Unit economics (slice 11):**
1. Run any query; open **Unit economics** in the side panel
2. Point to per-step COGS (Tavily, Claude intent/respond/align, Thrad)
3. Expand **Technical details** for aggregate token USD; note session COGS in metrics

**Scenario G — Overmind depth (slice 12, when shipped):**
1. Set `OVERMIND_API_KEY`; confirm trace badge **Overmind**
2. Run Scenario A; open Overmind console → `adblend-publisher` / `adblend.chat`
3. Show tags (`chat.source`, `ads_enabled`) and nested Anthropic spans
4. Repeat query — `tavily.from_cache` on span (slice 12 attribute)

---

## Branch

Use `feat/slice-08-polish-demo` or fold into a small follow-up PR when hardening error paths.
