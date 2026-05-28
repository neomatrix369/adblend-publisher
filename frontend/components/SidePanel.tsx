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
  isLoading?: boolean;
  adsEnabled: boolean;
  onAdsEnabledChange: (enabled: boolean) => void;
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
  isLoading = false,
  adsEnabled,
  onAdsEnabledChange,
  onResetMetrics,
  isResettingMetrics,
}: SidePanelProps) {
  const awaitingPlacement =
    isLoading && adsEnabled && (intent == null || intent.ad_eligible);

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col gap-4 overflow-y-auto overscroll-y-contain border-t border-panel-border bg-background-muted/30 p-4 max-lg:max-h-[42vh] lg:h-full lg:max-h-full lg:w-[22rem] lg:border-t-0 lg:border-l lg:p-5 xl:w-80">
      <header className="shrink-0 lg:hidden">
        <h2 className="text-sm font-semibold text-foreground">
          Pipeline & metrics
        </h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Intent scoring, ad slot, session stats, and trace spans.
        </p>
      </header>

      <label className="panel-card flex shrink-0 cursor-pointer items-center justify-between gap-3 p-3">
        <span className="text-sm text-foreground">Ads enabled</span>
        <input
          type="checkbox"
          checked={adsEnabled}
          onChange={(e) => onAdsEnabledChange(e.target.checked)}
          disabled={isLoading}
          className="h-5 w-5 cursor-pointer rounded border-panel-border accent-accent disabled:cursor-not-allowed"
        />
      </label>

      <IntentPanel intent={intent} focus={focus} isLoading={isLoading} />

      <section className="panel-card shrink-0 p-4">
        <h2 className="panel-section-title flex items-center gap-1.5">
          <Megaphone className="h-3.5 w-3.5" aria-hidden />
          Ad placement
        </h2>
        {awaitingPlacement ? (
          <p className="mt-3 text-sm text-foreground-muted" aria-live="polite">
            Requesting placement…
          </p>
        ) : ad ? (
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
        ) : !adsEnabled ? (
          <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
            Ads disabled — placements are skipped for this session.
          </p>
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

      <section className="panel-card shrink-0 p-4">
        <h2 className="panel-section-title">Token usage</h2>
        {tokens != null && (tokens.input > 0 || tokens.output > 0) ? (
          <p className="mt-3 font-mono text-sm tabular-nums text-foreground">
            <span className="text-foreground-muted">In</span> {tokens.input}
            <span className="mx-2 text-panel-border">·</span>
            <span className="text-foreground-muted">Out</span> {tokens.output}
          </p>
        ) : isLoading ? (
          <div className="mt-3 h-4 w-32 animate-pulse rounded bg-background-muted" />
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
