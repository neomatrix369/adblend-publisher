export const TIER_ORDER = ["high", "medium", "low", "off-topic"] as const;

export type IntentTier = (typeof TIER_ORDER)[number];

export const TIER_LABELS: Record<IntentTier, string> = {
  high: "High intent",
  medium: "Medium intent",
  low: "Low intent",
  "off-topic": "Off-topic",
};

export const TIER_BADGE_CLASS: Record<string, string> = {
  high: "border-danger/40 bg-danger/15 text-red-300",
  medium: "border-warning/40 bg-warning/15 text-amber-200",
  low: "border-success/40 bg-success/15 text-emerald-300",
  "off-topic": "border-panel-border bg-background-elevated text-foreground-muted",
};

export const TIER_DOT_CLASS: Record<string, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-success",
  "off-topic": "bg-foreground-muted",
};

export function tierBadgeClass(tier: string): string {
  return TIER_BADGE_CLASS[tier] ?? TIER_BADGE_CLASS["off-topic"];
}
