import type { AnthropicTokenCost, CostLine } from "@/lib/api";

export function formatUsd(amount: number): string {
  if (amount >= 0.01) {
    return `$${amount.toFixed(3)}`;
  }
  if (amount > 0) {
    return `$${amount.toFixed(4)}`;
  }
  return "$0.000";
}

export function shortModelId(model: string): string {
  const slash = model.lastIndexOf("/");
  return slash >= 0 ? model.slice(slash + 1) : model;
}

export type TokenCostDisplay = {
  inputTokens: number;
  outputTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  model?: string;
};

export function tokenCostFromLine(
  line: CostLine,
): TokenCostDisplay | null {
  const inputTokens = line.input_tokens ?? 0;
  const outputTokens = line.output_tokens ?? 0;
  if (inputTokens <= 0 && outputTokens <= 0) {
    return null;
  }
  const inputCostUsd = line.input_cost_usd ?? 0;
  const outputCostUsd = line.output_cost_usd ?? 0;
  return {
    inputTokens,
    outputTokens,
    inputCostUsd,
    outputCostUsd,
    totalCostUsd: line.amount_usd,
    model: line.model ?? undefined,
  };
}

export function tokenCostFromAnthropicSummary(
  summary: AnthropicTokenCost,
): TokenCostDisplay {
  return {
    inputTokens: summary.input_tokens,
    outputTokens: summary.output_tokens,
    inputCostUsd: summary.input_cost_usd,
    outputCostUsd: summary.output_cost_usd,
    totalCostUsd: summary.total_cost_usd,
    model: summary.model,
  };
}
