import { ExternalLink, Megaphone } from "lucide-react";

import IntentPanel from "@/components/IntentPanel";
import MetricsPanel from "@/components/MetricsPanel";
import TracePanel from "@/components/TracePanel";
import type {
  AdPayload,
  FocusPayload,
  IntentPayload,
  SessionMetrics,
  TokenUsage,
  TracePayload,
} from "@/lib/api";

type SidePanelProps = {
  intent: IntentPayload | null;
  focus: FocusPayload | null;
  ad: AdPayload | null;
  tokens: TokenUsage | null;
  metrics: SessionMetrics | null;
  trace: TracePayload | null;
  overmindConfigured?: boolean;
  onResetMetrics: () => void;
  isResettingMetrics: boolean;
};

export default function SidePanel({
  intent,
  focus,
  ad,
  tokens,
  metrics,
  trace,
  overmindConfigured = false,
  onResetMetrics,
  isResettingMetrics,
}: SidePanelProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-panel-border bg-background-muted/30 p-4 lg:w-[22rem] lg:border-l lg:p-5 xl:w-80">
      <header className="lg:hidden">
        <h2 className="text-sm font-semibold text-foreground">
          Pipeline & metrics
        </h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Intent scoring, ad slot, session stats, and trace spans.
        </p>
      </header>

      <IntentPanel intent={intent} focus={focus} />

      <section className="panel-card p-4">
        <h2 className="panel-section-title flex items-center gap-1.5">
          <Megaphone className="h-3.5 w-3.5" aria-hidden />
          Ad placement
        </h2>
        {ad ? (
          <div className="mt-4 rounded-lg border border-accent/35 bg-accent-muted p-3.5 ring-1 ring-accent/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Sponsored
              {ad.mock ? (
                <span className="ml-1.5 font-normal normal-case text-foreground-muted">
                  (mock)
                </span>
              ) : null}
            </span>
            <p className="mt-2 text-sm font-medium leading-snug text-foreground">
              {ad.headline}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground-muted">
              {ad.body}
            </p>
            <a
              href={ad.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover hover:underline"
            >
              {ad.cta_label}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
            {intent?.tier === "off-topic"
              ? "No placement — query is outside the chatbot domain."
              : intent != null
                ? `No placement — score ${intent.score.toFixed(2)} is below the 0.70 gate.`
                : "No placement yet — send a message to score intent."}
          </p>
        )}
      </section>

      <section className="panel-card p-4">
        <h2 className="panel-section-title">Token usage</h2>
        {tokens != null && (tokens.input > 0 || tokens.output > 0) ? (
          <p className="mt-3 font-mono text-sm tabular-nums text-foreground">
            <span className="text-foreground-muted">In</span> {tokens.input}
            <span className="mx-2 text-panel-border">·</span>
            <span className="text-foreground-muted">Out</span> {tokens.output}
          </p>
        ) : (
          <p className="mt-3 text-sm text-foreground-muted">—</p>
        )}
      </section>

      <MetricsPanel
        metrics={metrics}
        onReset={onResetMetrics}
        isResetting={isResettingMetrics}
      />

      <TracePanel trace={trace} overmindConfigured={overmindConfigured} />
    </aside>
  );
}
