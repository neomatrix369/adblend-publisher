import { Ban, CheckCircle2, Tag } from "lucide-react";

import ImpactPanel from "@/components/ui/ImpactPanel";
import type { FocusPayload, IntentPayload } from "@/lib/api";
import { tierBadgeClass } from "@/lib/tier-styles";

const GATE_THRESHOLD = 0.7;

type IntentPanelProps = {
  intent: IntentPayload | null;
  focus: FocusPayload | null;
  isLoading?: boolean;
};

function IntentSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="mx-auto h-14 w-24 animate-pulse rounded-lg bg-background-muted" />
      <div className="h-3 w-full animate-pulse rounded-full bg-background-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-background-muted" />
    </div>
  );
}

export default function IntentPanel({
  intent,
  focus,
  isLoading = false,
}: IntentPanelProps) {
  const scorePercent =
    intent != null ? Math.round(intent.score * 100) : null;

  const showFocusChip =
    Boolean(focus?.category) && Boolean(focus?.sub_category);

  const heroAccent =
    intent?.ad_eligible ? "success" : intent != null ? "warning" : "default";

  return (
    <ImpactPanel
      step={1}
      title="Commercial intent"
      subtitle="Scores purchase intent before any ad is requested"
      variant="hero"
      accent={intent != null ? heroAccent : "default"}
    >
      {isLoading && intent == null ? (
        <IntentSkeleton />
      ) : intent == null ? (
        <p className="text-center text-sm text-foreground-muted">
          Send a message to score intent and unlock the placement gate.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Intent score
            </p>
            <p
              className={`impact-stat mt-1 ${
                intent.ad_eligible ? "text-success" : "text-accent"
              }`}
            >
              {intent.score.toFixed(2)}
            </p>
            {scorePercent != null ? (
              <p className="mt-1 text-sm text-foreground-muted">
                {scorePercent}% · gate at {(GATE_THRESHOLD * 100).toFixed(0)}%
              </p>
            ) : null}
          </div>

          <div className="relative pb-5">
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-background-muted/80 ring-1 ring-panel-border/50"
              role="progressbar"
              aria-valuenow={scorePercent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Intent score"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                  intent.ad_eligible
                    ? "bg-gradient-to-r from-success/80 to-success"
                    : "bg-gradient-to-r from-accent/70 to-accent"
                }`}
                style={{ width: `${intent.score * 100}%` }}
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
              style={{ left: `${GATE_THRESHOLD * 100}%` }}
              title="Ad gate threshold 0.70"
              aria-hidden
            />
            <p
              className="absolute -bottom-5 text-[10px] font-medium text-foreground-muted"
              style={{ left: `calc(${GATE_THRESHOLD * 100}% - 0.75rem)` }}
            >
              0.70
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-4">
            <span className="text-xs text-foreground-muted">Tier</span>
            <span
              className={`rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-wide ${tierBadgeClass(intent.tier)}`}
            >
              {intent.tier}
            </span>
          </div>

          <div
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
              intent.ad_eligible
                ? "bg-success/15 ring-1 ring-success/35"
                : "bg-background-muted/80 ring-1 ring-panel-border/60"
            }`}
          >
            <span className="text-xs font-medium text-foreground-muted">
              Placement gate
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              {intent.ad_eligible ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                  <span className="text-success">Open — bid allowed</span>
                </>
              ) : intent.tier === "off-topic" ? (
                <>
                  <Ban className="h-4 w-4 text-foreground-muted" aria-hidden />
                  <span className="text-foreground-muted">Closed — off-topic</span>
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 text-foreground-muted" aria-hidden />
                  <span className="text-foreground-muted">Closed — below gate</span>
                </>
              )}
            </span>
          </div>

          {showFocusChip ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-foreground-muted">Focus</span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/35 bg-violet-500/15 px-2.5 py-1 font-medium text-violet-200">
                <Tag className="h-3 w-3 shrink-0" aria-hidden />
                {focus!.category} › {focus!.sub_category}
              </span>
            </div>
          ) : null}

          {intent.rationale ? (
            <blockquote className="border-l-2 border-accent/50 bg-accent-muted/30 py-1 pl-3 text-xs leading-relaxed text-foreground-muted italic">
              {intent.rationale}
            </blockquote>
          ) : null}
        </div>
      )}
    </ImpactPanel>
  );
}
