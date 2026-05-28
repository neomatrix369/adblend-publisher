import type { AdPayload, FocusPayload, IntentPayload } from "@/lib/api";

type SidePanelProps = {
  intent: IntentPayload | null;
  focus: FocusPayload | null;
  ad: AdPayload | null;
};

const TIER_STYLES: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-300",
  medium: "bg-amber-500/20 text-amber-300",
  low: "bg-slate-500/20 text-slate-300",
  "off-topic": "bg-slate-500/20 text-slate-400",
};

function tierBadgeClass(tier: string): string {
  return TIER_STYLES[tier] ?? "bg-slate-500/20 text-slate-300";
}

export default function SidePanel({ intent, focus, ad }: SidePanelProps) {
  const focusLabel =
    focus?.category && focus?.sub_category
      ? `${focus.category} · ${focus.sub_category}`
      : focus?.category || "—";

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 border-l border-panel-border p-4">
      <section className="rounded-lg border border-panel-border p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Intent
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Score</dt>
            <dd className="font-mono tabular-nums">
              {intent != null ? intent.score.toFixed(2) : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-text-muted">Tier</dt>
            <dd>
              {intent != null ? (
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium uppercase ${tierBadgeClass(intent.tier)}`}
                >
                  {intent.tier}
                </span>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Focus</dt>
            <dd className="text-right text-xs">{focusLabel}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-panel-border p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Ad
        </h2>
        {ad ? (
          <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">
              Sponsored
              {ad.mock ? (
                <span className="ml-1 normal-case text-text-muted">(mock)</span>
              ) : null}
            </span>
            <p className="mt-2 text-sm text-foreground">{ad.headline}</p>
            <p className="mt-1 text-xs text-text-muted">{ad.body}</p>
            <a
              href={ad.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-xs text-accent hover:underline"
            >
              {ad.cta_label} →
            </a>
          </div>
        ) : (
          <p className="mt-3 text-xs text-text-muted">
            No placement — intent below threshold (0.70)
          </p>
        )}
      </section>

      <section className="rounded-lg border border-panel-border p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Metrics
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Queries</dt>
            <dd>0</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Ads served</dt>
            <dd>0</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Fill rate</dt>
            <dd>—</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
