import { BarChart3, RotateCcw } from "lucide-react";

import ImpactPanel from "@/components/ui/ImpactPanel";
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
  const queries = metrics?.total_queries ?? 0;
  const fillRate = metrics?.fill_rate ?? 0;
  const hasData = queries > 0;

  return (
    <ImpactPanel
      step={3}
      title="Publisher measurement"
      subtitle="Session fill and impression logging for sell-side reporting"
      variant="impact"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground-muted">
          <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider">
            Fill rate
          </span>
        </div>
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

      <div className="mt-3 text-center">
        <p
          className={`impact-stat ${hasData ? "text-accent" : "text-foreground-muted"}`}
        >
          {hasData ? `${fillRate.toFixed(1)}%` : "—"}
        </p>
        <p className="mt-1 text-xs text-foreground-muted">
          {hasData
            ? `${metrics?.ads_served ?? 0} ads on ${queries} queries`
            : "Metrics appear after your first query"}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md bg-background-muted/60 py-2 ring-1 ring-panel-border/40">
          <dt className="text-foreground-muted">Queries</dt>
          <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums text-foreground">
            {queries}
          </dd>
        </div>
        <div className="rounded-md bg-success/10 py-2 ring-1 ring-success/25">
          <dt className="text-success/90">Served</dt>
          <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums text-success">
            {metrics?.ads_served ?? 0}
          </dd>
        </div>
        <div className="rounded-md bg-background-muted/60 py-2 ring-1 ring-panel-border/40">
          <dt className="text-foreground-muted">Blocked</dt>
          <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums text-foreground">
            {metrics?.blocked ?? 0}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-panel-border/60 pt-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Last impression
        </h3>
        {last != null && impressionDisplay != null ? (
          <dl className="mt-2 grid gap-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-foreground-muted">State</dt>
              <dd className={`font-semibold ${impressionDisplay.className}`}>
                {impressionDisplay.label}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-foreground-muted">Tier</dt>
              <dd className="font-medium">
                {formatTier(last.tier)}{" "}
                <span className="font-mono text-xs text-foreground-muted">
                  {last.score.toFixed(2)}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-foreground-muted">Bid</dt>
              <dd className="font-semibold">
                {last.bid_won ? (
                  <span className="text-success">Won</span>
                ) : (
                  <span className="text-foreground-muted">Lost</span>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-xs text-foreground-muted">
            Waiting for first impression event.
          </p>
        )}
      </div>
    </ImpactPanel>
  );
}
