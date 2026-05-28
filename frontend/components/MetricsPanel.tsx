import { RotateCcw } from "lucide-react";

import Spinner from "@/components/ui/Spinner";
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
  logged: { label: "Logged", className: "text-success" },
  no_fill: { label: "No fill", className: "text-warning" },
  none: { label: "Blocked", className: "text-foreground-muted" },
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
    <section className="panel-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="panel-section-title">Session metrics</h2>
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="inline-flex min-h-[2rem] cursor-pointer items-center gap-1 rounded-md border border-panel-border px-2.5 py-1 text-xs text-foreground-muted transition-colors hover:border-accent/40 hover:bg-accent-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          aria-busy={isResetting}
        >
          {isResetting ? (
            <Spinner className="h-3 w-3" label="Resetting metrics" />
          ) : (
            <RotateCcw className="h-3 w-3" aria-hidden />
          )}
          Reset
        </button>
      </div>

      <dl className="mt-4 grid gap-2.5 text-sm">
        <div className="flex justify-between gap-2 border-b border-panel-border/50 pb-2">
          <dt className="text-foreground-muted">Queries</dt>
          <dd className="font-mono font-medium tabular-nums">
            {metrics?.total_queries ?? 0}
          </dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-panel-border/50 pb-2">
          <dt className="text-foreground-muted">Ads served</dt>
          <dd className="font-mono font-medium tabular-nums">
            {metrics?.ads_served ?? 0}
            {(metrics?.total_queries ?? 0) > 0 ? (
              <span className="ml-2 text-xs font-normal text-foreground-muted">
                {metrics?.fill_rate.toFixed(1)}% fill
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-panel-border/50 pb-2">
          <dt className="text-foreground-muted">No fill</dt>
          <dd className="font-mono font-medium tabular-nums">
            {metrics?.no_fill ?? 0}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-foreground-muted">Blocked</dt>
          <dd className="font-mono font-medium tabular-nums">
            {metrics?.blocked ?? 0}
          </dd>
        </div>
      </dl>

      <h3 className="panel-section-title mt-5">Last impression</h3>
      {last != null && impressionDisplay != null ? (
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-foreground-muted">State</dt>
            <dd className={`font-medium ${impressionDisplay.className}`}>
              {impressionDisplay.label}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-foreground-muted">Tier</dt>
            <dd>
              {formatTier(last.tier)}{" "}
              <span className="font-mono text-xs text-foreground-muted">
                {last.score.toFixed(2)}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-foreground-muted">Bid</dt>
            <dd className="font-medium">
              {last.bid_won ? (
                <span className="text-success">Won</span>
              ) : (
                <span className="text-foreground-muted">Lost</span>
              )}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-foreground-muted">
          Send a message to record an impression.
        </p>
      )}
    </section>
  );
}
