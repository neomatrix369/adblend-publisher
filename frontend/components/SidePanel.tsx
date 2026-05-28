import { ChevronDown, SlidersHorizontal } from "lucide-react";

import AdPlacementPanel from "@/components/AdPlacementPanel";
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
  return (
    <div
      role="complementary"
      aria-label="Publisher impact metrics"
      className="flex h-full min-h-0 w-full flex-col overflow-y-auto overscroll-y-contain border-t border-panel-border bg-[linear-gradient(180deg,rgb(20_28_46/0.95)_0%,rgb(15_23_42/1)_12rem)] p-4 max-lg:max-h-[42vh] lg:border-t-0 lg:p-5"
    >
      <header className="shrink-0 border-b border-panel-border/50 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          Publisher impact
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          Intent → placement → revenue
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
          Score traffic, gate ads, and measure fill — the publisher value chain.
        </p>
      </header>

      <div
        className="mt-4 flex shrink-0 flex-col gap-3"
        role="region"
        aria-label="Publisher value flow"
      >
        <IntentPanel intent={intent} focus={focus} isLoading={isLoading} />
        <AdPlacementPanel
          ad={ad}
          intent={intent}
          adsEnabled={adsEnabled}
          isLoading={isLoading}
        />
        <MetricsPanel
          metrics={metrics}
          onReset={onResetMetrics}
          isResetting={isResettingMetrics}
        />
      </div>

      <div className="panel-muted mt-4 flex shrink-0 items-center justify-between gap-3 px-3 py-2.5">
        <span className="flex items-center gap-2 text-xs text-foreground-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          Demo controls
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-xs text-foreground-muted">Ads on</span>
          <input
            type="checkbox"
            checked={adsEnabled}
            onChange={(e) => onAdsEnabledChange(e.target.checked)}
            disabled={isLoading}
            className="h-5 w-5 cursor-pointer rounded border-panel-border accent-accent disabled:cursor-not-allowed"
          />
        </label>
      </div>

      <details className="panel-muted group mt-3 shrink-0 open:pb-1">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium text-foreground-muted marker:content-none [&::-webkit-details-marker]:hidden">
          <span>Technical details</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="space-y-2 px-2 pb-2">
          <section className="rounded-md border border-panel-border/40 bg-background/40 px-3 py-2.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Token usage
            </h3>
            {tokens != null && (tokens.input > 0 || tokens.output > 0) ? (
              <p className="mt-1.5 font-mono text-xs tabular-nums text-foreground-muted">
                {tokens.input} in · {tokens.output} out
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-foreground-muted/80">—</p>
            )}
          </section>
          <TracePanel
            trace={trace}
            overmindConfigured={overmindConfigured}
            compact
          />
        </div>
      </details>
    </div>
  );
}
