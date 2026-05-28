import type { FocusPayload, IntentPayload } from "@/lib/api";

type IntentPanelProps = {
  intent: IntentPayload | null;
  focus: FocusPayload | null;
};

export const TIER_STYLES: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  "off-topic": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function tierBadgeClass(tier: string): string {
  return TIER_STYLES[tier] ?? TIER_STYLES["off-topic"];
}

export default function IntentPanel({ intent, focus }: IntentPanelProps) {
  const scorePercent =
    intent != null ? Math.round(intent.score * 100) : null;

  const showFocusChip =
    Boolean(focus?.category) && Boolean(focus?.sub_category);

  return (
    <section className="rounded-lg border border-panel-border p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        Intent
      </h2>

      {intent == null ? (
        <p className="mt-3 text-xs text-text-muted">
          Send a message to score intent.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-text-muted">Score</span>
              <span className="font-mono tabular-nums text-foreground">
                {intent.score.toFixed(2)}
                {scorePercent != null ? (
                  <span className="ml-1 text-xs text-text-muted">
                    {scorePercent}%
                  </span>
                ) : null}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-800">
              <div
                className="h-1.5 rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${intent.score * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted">Tier</span>
            <span
              className={`rounded border px-2 py-0.5 text-xs font-medium uppercase ${tierBadgeClass(intent.tier)}`}
            >
              {intent.tier}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="shrink-0 text-text-muted">Gate</span>
            <span className="text-right text-xs">
              {intent.ad_eligible ? (
                <span className="text-emerald-400">✅ Ad eligible</span>
              ) : intent.tier === "off-topic" ? (
                <span className="text-text-muted">
                  ⛔ Blocked — off-topic
                </span>
              ) : (
                <span className="text-text-muted">
                  ⛔ Blocked — score below 0.70
                </span>
              )}
            </span>
          </div>

          {showFocusChip ? (
            <div>
              <span className="text-text-muted">Focus</span>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 rounded border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                  {focus!.category} › {focus!.sub_category}
                </span>
              </div>
            </div>
          ) : null}

          {intent.rationale ? (
            <p className="border-t border-panel-border pt-2 text-xs italic text-text-muted">
              &ldquo;{intent.rationale}&rdquo;
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
