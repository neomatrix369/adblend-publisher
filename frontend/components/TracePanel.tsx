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
    <section className="rounded-lg border border-panel-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Trace
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          {overmindConfigured ? "Overmind" : "Local"}
        </span>
      </div>

      {trace != null && trace.span_count > 0 ? (
        <>
          <p className="mt-2 font-mono text-xs text-foreground">
            {trace.span_count} span{trace.span_count === 1 ? "" : "s"} ·{" "}
            {Math.round(trace.total_latency_ms)}ms total
          </p>
          <ul className="mt-3 space-y-2">
            {trace.calls.map((call) => {
              const widthPct =
                maxLatency > 0
                  ? Math.max(8, (call.latency_ms / maxLatency) * 100)
                  : 8;
              return (
                <li key={call.name}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-foreground">{call.name}</span>
                    <span className="shrink-0 font-mono tabular-nums text-text-muted">
                      {Math.round(call.latency_ms)}ms
                    </span>
                  </div>
                  <div
                    className="mt-1 h-1 rounded-full bg-accent/30"
                    style={{ width: `${widthPct}%` }}
                    role="presentation"
                  />
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-xs text-text-muted">
          Send a message to see pipeline spans
        </p>
      )}
    </section>
  );
}
