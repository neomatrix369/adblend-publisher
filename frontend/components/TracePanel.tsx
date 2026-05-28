import { Activity } from "lucide-react";

import type { TracePayload } from "@/lib/api";

type TracePanelProps = {
  trace: TracePayload | null;
  overmindConfigured?: boolean;
};

export default function TracePanel({
  trace,
  overmindConfigured = false,
}: TracePanelProps) {
  const maxLatency =
    trace?.calls.reduce((max, call) => Math.max(max, call.latency_ms), 0) ?? 0;

  return (
    <section className="panel-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="panel-section-title flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" aria-hidden />
          Trace
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            overmindConfigured
              ? "bg-success/15 text-success ring-1 ring-success/30"
              : "bg-background-muted text-foreground-muted ring-1 ring-panel-border"
          }`}
        >
          {overmindConfigured ? "Overmind" : "Local"}
        </span>
      </div>

      {trace != null && trace.span_count > 0 ? (
        <>
          <p className="mt-3 font-mono text-xs tabular-nums text-foreground">
            {trace.span_count} span{trace.span_count === 1 ? "" : "s"} ·{" "}
            {Math.round(trace.total_latency_ms)}ms total
          </p>
          <ul className="mt-4 space-y-3" role="list">
            {trace.calls.map((call) => {
              const widthPct =
                maxLatency > 0
                  ? Math.max(12, (call.latency_ms / maxLatency) * 100)
                  : 12;
              return (
                <li key={call.name}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-foreground">{call.name}</span>
                    <span className="shrink-0 font-mono tabular-nums text-foreground-muted">
                      {Math.round(call.latency_ms)}ms
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background-muted"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent/50 to-accent transition-[width] duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-sm text-foreground-muted">
          Pipeline spans appear here after you send a message.
        </p>
      )}
    </section>
  );
}
