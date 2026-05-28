# Slice 9 — Frontend UI/UX Polish
**Priority:** Should Have | **Est:** 45 min  
**Depends on:** Slices 1–7 (panels and chat flow in place)

---

## Goal

Apply a cohesive dark dashboard design system to the publisher demo UI: professional typography, semantic tokens, accessible interactions, SVG status icons (no emoji), loading/empty states, and a responsive layout that works on tablet and desktop.

Design direction sourced from **UI/UX Pro Max** (`--design-system` for SaaS ad-tech analytics dashboard).

---

## Scope

### Design tokens (`frontend/app/globals.css`)
- Slate OLED background (`#0f172a`), elevated panels, semantic success/warning/danger
- Shared utilities: `.panel-card`, `.btn-primary`, `.input-field`, focus rings
- `prefers-reduced-motion` respected

### Typography (`frontend/app/layout.tsx`)
- **Fira Sans** (UI) + **Fira Code** (metrics/trace) via `next/font/google`

### Components
| File | Changes |
|------|---------|
| `page.tsx` | Header with logo mark, API Live/Offline pill; single primary CTA in chat; responsive stack |
| `ChatPanel.tsx` | Empty state, message bubbles, typing indicator + spinner |
| `Dropdown.tsx` | Text tier labels (no emoji); chevron affordance; load error alert |
| `IntentPanel.tsx` | Lucide gate icons, score progressbar a11y |
| `SidePanel.tsx` | Panel cards, ad placement block, mobile section intro |
| `MetricsPanel.tsx` | Reset with spinner, clearer metric rows |
| `TracePanel.tsx` | Overmind/local badge, gradient latency bars |
| `lib/tier-styles.ts` | Shared tier labels and badge colours |
| `components/ui/Spinner.tsx` | Reusable loading indicator |

### Dependency
- `lucide-react` for SVG icons

---

## Exit criteria

- [x] No emojis used as UI icons (dropdown tiers, intent gate)
- [x] Visible focus states and 44px+ touch targets on primary controls
- [x] Loading feedback in chat (spinner + “Thinking…”)
- [x] Helpful empty states in chat and side panels
- [x] Side panel scrolls independently on `lg+`; stacks below chat on small screens
- [x] `npm run build` and `npm run lint` pass

---

## Verification

```bash
cd frontend && npm run lint && npm run build
npm run dev   # manual: check header API pill, chat empty state, one full query
```

---

## Branch

`feat/slice-09-frontend-ux`
