import type { SessionMetrics } from "@/lib/api";

type MetricsPanelProps = {
  metrics: SessionMetrics | null;
  onReset: () => void;
  isResetting: boolean;
};

const IMPRESSION_STATE_LABEL: Record<
  NonNullable<SessionMetrics["last_impression"]>["state"],
  { label: string; className: string }
> = {
  logged: { label: "Logged", className: "text-green-400" },
  no_fill: { label: "No fill", className: "text-yellow-400" },
  none: { label: "Blocked", className: "text-text-muted" },
};

function formatTier(tier: string): string {
  if (!tier) return "—";
  return tier.charAt(0).toUpperCase() + tier.slice(1).replace(/-/g, " ");
}

export default function MetricsPanel({
  metrics,
  onReset,
  isResetting,
}: MetricsPanelProps) {
  const last = metrics?.last_impression ?? null;
  const impressionDisplay =
    last != null ? IMPRESSION_STATE_LABEL[last.state] : null;

  return (
    <section className="rounded-lg border border-panel-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Session metrics
        </h2>
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="rounded border border-panel-border px-2 py-0.5 text-xs text-text-muted hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">Queries</dt>
          <dd className="font-mono tabular-nums">{metrics?.total_queries ?? 0}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">Ads served</dt>
          <dd className="font-mono tabular-nums">
            {metrics?.ads_served ?? 0}
            {(metrics?.total_queries ?? 0) > 0 ? (
              <span className="ml-2 text-xs text-text-muted">
                {metrics?.fill_rate.toFixed(1)}% fill
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">No fill</dt>
          <dd className="font-mono tabular-nums">{metrics?.no_fill ?? 0}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">Blocked</dt>
          <dd className="font-mono tabular-nums">{metrics?.blocked ?? 0}</dd>
        </div>
      </dl>

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Last impression
      </h3>
      {last != null && impressionDisplay != null ? (
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">State</dt>
            <dd className={impressionDisplay.className}>{impressionDisplay.label}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Tier</dt>
            <dd>
              {formatTier(last.tier)}{" "}
              <span className="font-mono text-xs text-text-muted">
                {last.score.toFixed(2)}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Bid</dt>
            <dd>{last.bid_won ? "Won" : "Lost"}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-xs text-text-muted">
          Send a message to record an impression
        </p>
      )}
    </section>
  );
}
