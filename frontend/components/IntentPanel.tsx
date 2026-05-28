import { Ban, CheckCircle2, Tag } from "lucide-react";

import type { FocusPayload, IntentPayload } from "@/lib/api";
import { tierBadgeClass } from "@/lib/tier-styles";

type IntentPanelProps = {
  intent: IntentPayload | null;
  focus: FocusPayload | null;
};

export default function IntentPanel({ intent, focus }: IntentPanelProps) {
  const scorePercent =
    intent != null ? Math.round(intent.score * 100) : null;

  const showFocusChip =
    Boolean(focus?.category) && Boolean(focus?.sub_category);

  return (
    <section className="panel-card p-4">
      <h2 className="panel-section-title">Intent</h2>

      {intent == null ? (
        <p className="mt-3 text-sm text-foreground-muted">
          Send a message to score commercial intent and eligibility.
        </p>
      ) : (
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-foreground-muted">Score</span>
              <span className="font-mono text-base font-medium tabular-nums text-foreground">
                {intent.score.toFixed(2)}
                {scorePercent != null ? (
                  <span className="ml-1.5 text-xs font-normal text-foreground-muted">
                    {scorePercent}%
                  </span>
                ) : null}
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background-muted"
              role="progressbar"
              aria-valuenow={scorePercent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Intent score"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent transition-[width] duration-300 ease-out"
                style={{ width: `${intent.score * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground-muted">Tier</span>
            <span
              className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${tierBadgeClass(intent.tier)}`}
            >
              {intent.tier}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-md border border-panel-border/60 bg-background-muted/50 px-3 py-2">
            <span className="shrink-0 text-foreground-muted">Gate</span>
            <span className="flex items-center gap-1.5 text-right text-xs font-medium">
              {intent.ad_eligible ? (
                <>
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0 text-success"
                    aria-hidden
                  />
                  <span className="text-success">Ad eligible</span>
                </>
              ) : intent.tier === "off-topic" ? (
                <>
                  <Ban
                    className="h-3.5 w-3.5 shrink-0 text-foreground-muted"
                    aria-hidden
                  />
                  <span className="text-foreground-muted">
                    Blocked — off-topic
                  </span>
                </>
              ) : (
                <>
                  <Ban
                    className="h-3.5 w-3.5 shrink-0 text-foreground-muted"
                    aria-hidden
                  />
                  <span className="text-foreground-muted">
                    Blocked — below 0.70
                  </span>
                </>
              )}
            </span>
          </div>

          {showFocusChip ? (
            <div>
              <span className="text-foreground-muted">Focus</span>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200">
                  <Tag className="h-3 w-3 shrink-0" aria-hidden />
                  {focus!.category} › {focus!.sub_category}
                </span>
              </div>
            </div>
          ) : null}

          {intent.rationale ? (
            <blockquote className="border-l-2 border-accent/40 pl-3 text-xs leading-relaxed text-foreground-muted italic">
              {intent.rationale}
            </blockquote>
          ) : null}
        </div>
      )}
    </section>
  );
}
