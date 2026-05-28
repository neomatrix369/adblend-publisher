# AdBlend Publisher — Frontend

Next.js (App Router) UI for the AdBlend publisher demo. Talks to the FastAPI backend via the Next.js proxy.

## Setup

```bash
cp ../.env.example .env.local   # NEXT_PUBLIC_API_URL=/api (default)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start the backend on port **8001** first (see root [README](../README.md)).

## Architecture

- **`app/page.tsx`** — orchestrates chat, dropdown, side panel, demo reset
- **`lib/api.ts`** — typed client for `/chat`, `/dataset`, `/health`, reset endpoints
- **`components/`** — `ChatPanel`, `SidePanel`, `ResizableSplitPane`, impact/metrics/trace/cost panels
- **`next.config.ts`** — rewrites `/api/*` → `http://127.0.0.1:8001/*`

## Typography

**Fira Sans** (UI) and **Fira Code** (metrics, trace, costs) via `next/font/google` in `app/layout.tsx`.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run lint     # ESLint
```

## Key UI features

- Resizable chat / side split (`ResizableSplitPane`, persisted in `localStorage`)
- Collapsible long assistant replies (`ChatPanel`)
- Side panel: intent, ad placement, alignment, metrics, unit economics, trace (expand **Technical details** for tokens)
- Header: API live/offline pill, **Reset demo**

See [`../slices/PROGRESS.md`](../slices/PROGRESS.md) for slice history.
