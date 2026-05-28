import { ExternalLink, Megaphone, ShieldOff } from "lucide-react";

import ImpactPanel from "@/components/ui/ImpactPanel";
import Spinner from "@/components/ui/Spinner";
import type { AdPayload, IntentPayload } from "@/lib/api";

type AdPlacementPanelProps = {
  ad: AdPayload | null;
  intent: IntentPayload | null;
  adsEnabled: boolean;
  isLoading: boolean;
};

export default function AdPlacementPanel({
  ad,
  intent,
  adsEnabled,
  isLoading,
}: AdPlacementPanelProps) {
  const awaitingPlacement =
    isLoading && adsEnabled && (intent == null || intent.ad_eligible);

  const accent = ad ? "success" : !adsEnabled ? "warning" : "default";

  return (
    <ImpactPanel
      step={2}
      title="Ad placement"
      subtitle="Monetisation outcome — only when intent clears the gate"
      variant="hero"
      accent={accent}
    >
      {awaitingPlacement ? (
        <div
          className="flex items-center justify-center gap-3 py-6 text-sm text-foreground-muted"
          aria-live="polite"
        >
          <Spinner label="Requesting placement" />
          Requesting placement…
        </div>
      ) : ad ? (
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-success ring-1 ring-success/40">
            <Megaphone className="h-3.5 w-3.5" aria-hidden />
            Sponsored
            {ad.mock ? (
              <span className="font-normal normal-case text-foreground-muted">
                · mock
              </span>
            ) : null}
          </span>
          <p className="text-lg font-semibold leading-snug text-foreground">
            {ad.headline}
          </p>
          <p className="text-sm leading-relaxed text-foreground-muted">
            {ad.body}
          </p>
          <a
            href={ad.cta_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mx-auto mt-2 inline-flex text-sm"
          >
            {ad.cta_label}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      ) : !adsEnabled ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <ShieldOff className="h-8 w-8 text-warning" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            Ads disabled for demo
          </p>
          <p className="text-xs text-foreground-muted">
            Re-enable above to compare with sponsored placement.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <ShieldOff className="h-8 w-8 text-foreground-muted" aria-hidden />
          <p className="text-sm font-medium text-foreground">No placement</p>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {intent?.tier === "off-topic"
              ? "Traffic is outside the publisher domain — nothing to sell."
              : intent != null
                ? `Score ${intent.score.toFixed(2)} did not clear the 0.70 gate.`
                : "Run a query to see why an impression was or was not logged."}
          </p>
        </div>
      )}
    </ImpactPanel>
  );
}
