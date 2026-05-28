import {
  formatUsd,
  shortModelId,
  type TokenCostDisplay,
} from "@/lib/token-cost-format";

type TokenCostDetailProps = {
  usage: TokenCostDisplay;
  compact?: boolean;
  className?: string;
};

export default function TokenCostDetail({
  usage,
  compact = false,
  className = "",
}: TokenCostDetailProps) {
  const showIn = usage.inputTokens > 0 || usage.inputCostUsd > 0;
  const showOut = usage.outputTokens > 0 || usage.outputCostUsd > 0;

  return (
    <div className={className}>
      <p className="font-mono text-xs tabular-nums text-foreground-muted">
        {showIn ? (
          <span>
            {usage.inputTokens.toLocaleString()} in (
            {formatUsd(usage.inputCostUsd)})
          </span>
        ) : null}
        {showIn && showOut ? (
          <span className="text-foreground-muted/50"> · </span>
        ) : null}
        {showOut ? (
          <span>
            {usage.outputTokens.toLocaleString()} out (
            {formatUsd(usage.outputCostUsd)})
          </span>
        ) : null}
        {(showIn || showOut) && usage.totalCostUsd > 0 ? (
          <span className="text-foreground-muted/50"> · </span>
        ) : null}
        {usage.totalCostUsd > 0 ? (
          <span className="font-medium text-foreground">
            {formatUsd(usage.totalCostUsd)} total
          </span>
        ) : null}
      </p>
      {usage.model && !compact ? (
        <p className="mt-0.5 font-mono text-[10px] text-foreground-muted/70">
          {shortModelId(usage.model)}
        </p>
      ) : null}
    </div>
  );
}
