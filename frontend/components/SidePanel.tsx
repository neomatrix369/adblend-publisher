import type {
  AdPayload,
  FocusPayload,
  IntentPayload,
  SessionMetrics,
  TokenUsage,
} from "@/lib/api";

import IntentPanel from "@/components/IntentPanel";
import MetricsPanel from "@/components/MetricsPanel";

type SidePanelProps = {
  intent: IntentPayload | null;
  focus: FocusPayload | null;
  ad: AdPayload | null;
  tokens: TokenUsage | null;
  metrics: SessionMetrics | null;
  onResetMetrics: () => void;
  isResettingMetrics: boolean;
};

export default function SidePanel({
  intent,
  focus,
  ad,
  tokens,
  metrics,
  onResetMetrics,
  isResettingMetrics,
}: SidePanelProps) {
  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 border-l border-panel-border p-4">
      <IntentPanel intent={intent} focus={focus} />

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
            {intent?.tier === "off-topic"
              ? "No placement — off-topic (outside chatbot domain)"
              : intent != null
                ? `No placement — score ${intent.score.toFixed(2)} below gate (0.70)`
                : "No placement — send a message to score intent"}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-panel-border p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Attributes
        </h2>
        {tokens != null && (tokens.input > 0 || tokens.output > 0) ? (
          <p className="mt-3 font-mono text-xs text-gray-500">
            {tokens.input} in · {tokens.output} out
          </p>
        ) : (
          <p className="mt-3 text-xs text-text-muted">—</p>
        )}
      </section>

      <MetricsPanel
        metrics={metrics}
        onReset={onResetMetrics}
        isResetting={isResettingMetrics}
      />
    </aside>
  );
}
