# Slice 9 — Frontend UI/UX + Demo Polish
**Priority:** Should Have | **Est:** ~60 min  
**Depends on:** Slices 1–7 (panels and chat flow in place)  
**Status:** **done** · Branch: `feat/slice-09-frontend-ux`

---

## Goal

Ship a demo-ready publisher console: cohesive dark dashboard UI **and** demo controls (reset, ads toggle, scroll, cache) in one vertical slice.

Design direction: **UI/UX Pro Max** (`--design-system` for SaaS ad-tech analytics dashboard).

---

## Scope

### Design tokens (`frontend/app/globals.css`)
- Slate OLED background (`#0f172a`), elevated panels, semantic success/warning/danger
- Shared utilities: `.panel-card`, `.btn-primary`, `.input-field`, focus rings
- `prefers-reduced-motion` respected

### Typography (`frontend/app/layout.tsx`)
- **Fira Sans** (UI) + **Fira Code** (metrics/trace) via `next/font/google`

### Components (visual)
| File | Changes |
|------|---------|
| `page.tsx` | Header with logo mark, API Live/Offline pill, reset demo; `ResizableSplitPane` layout |
| `ChatPanel.tsx` | Empty state, bubbles, spinner, scroll behaviour, collapse/expand long replies |
| `Dropdown.tsx` | Text tier labels (no emoji); chevron; load error alert |
| `IntentPanel.tsx` | Lucide gate icons, score bar, loading skeleton; `ImpactPanel` wrapper (9b) |
| `SidePanel.tsx` | Panel cards, ads toggle, alignment/cost/trace in technical details |
| `AdPlacementPanel.tsx` | Sponsored placement block (9b) |
| `MetricsPanel.tsx` | Reset with spinner, clearer rows; `ImpactPanel` wrapper (9b) |
| `TracePanel.tsx` | Overmind/local badge, per-span latency bars (backend tags/attrs in slice 12) |
| `ResizableSplitPane.tsx` | Drag/keyboard resize; width persisted in `localStorage` |
| `components/ui/ImpactPanel.tsx` | Shared hero panel chrome (9b) |
| `lib/tier-styles.ts` | Shared tier labels and badge colours |
| `components/ui/Spinner.tsx` | Reusable loading indicator |

### Backend (demo polish — absorbed from slice 8 plan)
| File | Changes |
|------|---------|
| `tavily_client.py` | In-memory query cache + `clear_cache()` |
| `main.py` | `POST /demo/reset`; `ads_enabled` on `ChatRequest` |
| `tests/test_tavily_cache.py` | Cache hit behaviour |

### Dependency
- `lucide-react` for SVG icons

### Scroll behaviour
- Root `h-dvh overflow-hidden`; chat and side panel scroll independently
- Long replies: `useLayoutEffect` + `scrollIntoView({ block: "start" })` on latest assistant message
- User messages / loading: scroll pane to bottom

### Demo controls
- **Reset demo** (header) → clears UI + `POST /demo/reset`
- **Ads enabled** toggle → `ads_enabled` on `/chat`
- Metrics **Reset** (session only) unchanged

---

## Exit criteria

- [x] No emojis used as UI icons (dropdown tiers, intent gate)
- [x] Visible focus states and 44px+ touch targets on primary controls
- [x] Loading feedback in chat and intent panel
- [x] Helpful empty states in chat and side panels
- [x] Side panel scrolls independently on `lg+`; capped height when stacked on mobile
- [x] Long chat replies do not push side panel off-screen; reply starts at top of scroll area
- [x] Tavily cache, demo reset, ads toggle
- [x] Resizable desktop split; long replies collapsible
- [x] `npm run build` and `npm run lint` pass

---

## Verification

```bash
cd frontend && npm run lint && npm run build
cd ../backend && python3 -m pytest tests/test_tavily_cache.py  # when pytest available
npm run dev   # manual: reset demo, ads toggle, long dropdown answer, side panel stays visible
```

---

## Commits (slice 9 branch)

1. `feat(slice-09): polish publisher UI with design system and a11y`
2. `docs(slice-09): record frontend UX slice as done in PROGRESS`
3. `feat(slice-09): fix viewport scroll and demo polish`
4. `fix(slice-09): scroll to top of long assistant replies`
5. `docs(slice-09): align slice docs after moving polish commits`
6. `feat(slice-09): highlight publisher impact flow in side panel` (9b)
7. `feat(frontend): resizable chat/side split and neutral demo copy`
8. `feat(frontend): collapse long assistant answers in chat`

---

## Branch

`feat/slice-09-frontend-ux` — merge to `main` as single PR for all frontend + related backend demo endpoints.
