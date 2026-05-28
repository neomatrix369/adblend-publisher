import { Coins } from "lucide-react";

import TokenCostDetail from "@/components/TokenCostDetail";
import type { QueryCostPayload } from "@/lib/api";
import { formatUsd, tokenCostFromLine } from "@/lib/token-cost-format";

type CostPanelProps = {
  costs: QueryCostPayload | null;
  isLoading?: boolean;
};

export default function CostPanel({ costs, isLoading = false }: CostPanelProps) {
  const hasData = costs != null && costs.lines.length > 0;

  return (
    <section className="panel-card p-4" aria-labelledby="cost-panel-heading">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="cost-panel-heading"
          className="panel-section-title flex items-center gap-1.5"
        >
          <Coins className="h-3.5 w-3.5" aria-hidden />
          Unit economics
        </h2>
        {hasData ? (
          <span className="font-mono text-xs font-semibold tabular-nums text-accent">
            {formatUsd(costs.total_usd)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
        Estimated COGS per pipeline step (list pricing; env overrides on backend).
      </p>

      {isLoading ? (
        <p className="mt-3 text-xs text-foreground-muted/80">Calculating…</p>
      ) : hasData ? (
        <>
          <ul className="mt-3 space-y-3" role="list">
            {costs.lines.map((line) => {
              const tokenUsage = tokenCostFromLine(line);
              return (
                <li
                  key={line.step}
                  className="flex items-start justify-between gap-2 text-[11px]"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-foreground">
                      {line.label}
                    </span>
                    {tokenUsage ? (
                      <TokenCostDetail
                        usage={tokenUsage}
                        compact
                        className="mt-1"
                      />
                    ) : null}
                  </div>
                  {!tokenUsage ? (
                    <span className="shrink-0 font-mono tabular-nums text-foreground-muted">
                      {formatUsd(line.amount_usd)}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-panel-border/50 pt-3 text-[11px]">
            <div>
              <dt className="text-foreground-muted">This query</dt>
              <dd className="mt-0.5 font-mono font-semibold tabular-nums text-foreground">
                {formatUsd(costs.total_usd)}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Session COGS</dt>
              <dd className="mt-0.5 font-mono font-semibold tabular-nums text-accent">
                {formatUsd(costs.session_cumulative_usd)}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-3 text-xs text-foreground-muted/80">
          Run a query to see per-service costs.
        </p>
      )}
    </section>
  );
}
