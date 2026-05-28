import { Activity } from "lucide-react";

import type { TracePayload } from "@/lib/api";

type TracePanelProps = {
  trace: TracePayload | null;
  overmindConfigured?: boolean;
  compact?: boolean;
};

export default function TracePanel({
  trace,
  overmindConfigured = false,
  compact = false,
}: TracePanelProps) {
  const maxLatency =
    trace?.calls.reduce((max, call) => Math.max(max, call.latency_ms), 0) ?? 0;

  const wrapperClass = compact
    ? "rounded-md border border-panel-border/40 bg-background/40 px-3 py-2.5"
    : "panel-card p-4";

  return (
    <section className={wrapperClass}>
      <div className="flex items-center justify-between gap-2">
        <h2
          className={
            compact
              ? "text-[10px] font-semibold uppercase tracking-wider text-foreground-muted"
              : "panel-section-title flex items-center gap-1.5"
          }
        >
          {!compact ? <Activity className="h-3.5 w-3.5" aria-hidden /> : null}
          Pipeline trace
        </h2>
        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground-muted ring-1 ring-panel-border">
          {overmindConfigured ? "Overmind" : "Local"}
        </span>
      </div>

      {trace != null && trace.span_count > 0 ? (
        <>
          <p className="mt-2 font-mono text-[11px] tabular-nums text-foreground-muted">
            {trace.span_count} span{trace.span_count === 1 ? "" : "s"} ·{" "}
            {Math.round(trace.total_latency_ms)}ms
          </p>
          <ul className="mt-2 space-y-2" role="list">
            {trace.calls.map((call) => {
              const widthPct =
                maxLatency > 0
                  ? Math.max(12, (call.latency_ms / maxLatency) * 100)
                  : 12;
              return (
                <li key={call.name}>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-foreground-muted">
                      {call.name}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-foreground-muted/80">
                      {Math.round(call.latency_ms)}ms
                    </span>
                  </div>
                  <div
                    className="mt-1 h-1 overflow-hidden rounded-full bg-background-muted/80"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-foreground-muted/40"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-foreground-muted/80">
          Spans after each query.
        </p>
      )}
    </section>
  );
}
