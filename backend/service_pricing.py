"""Configurable unit costs for the publisher demo pipeline."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    return float(raw)


@dataclass(frozen=True)
class PricingRates:
    anthropic_input_usd_per_mtok: float
    anthropic_output_usd_per_mtok: float
    tavily_usd_per_search: float
    thrad_usd_per_bid: float


def get_pricing_rates() -> PricingRates:
    return PricingRates(
        anthropic_input_usd_per_mtok=_float_env(
            "ANTHROPIC_INPUT_USD_PER_MTOK", 3.0
        ),
        anthropic_output_usd_per_mtok=_float_env(
            "ANTHROPIC_OUTPUT_USD_PER_MTOK", 15.0
        ),
        tavily_usd_per_search=_float_env("TAVILY_USD_PER_SEARCH", 0.01),
        thrad_usd_per_bid=_float_env("THRAD_USD_PER_BID", 0.0),
    )


def anthropic_input_cost_usd(
    input_tokens: int,
    *,
    rates: PricingRates | None = None,
) -> float:
    pricing = rates or get_pricing_rates()
    return input_tokens * pricing.anthropic_input_usd_per_mtok / 1_000_000.0


def anthropic_output_cost_usd(
    output_tokens: int,
    *,
    rates: PricingRates | None = None,
) -> float:
    pricing = rates or get_pricing_rates()
    return output_tokens * pricing.anthropic_output_usd_per_mtok / 1_000_000.0


def anthropic_cost_usd(
    input_tokens: int,
    output_tokens: int,
    *,
    rates: PricingRates | None = None,
) -> float:
    return anthropic_input_cost_usd(input_tokens, rates=rates) + anthropic_output_cost_usd(
        output_tokens, rates=rates
    )


def tavily_cost_usd(*, from_cache: bool, rates: PricingRates | None = None) -> float:
    if from_cache:
        return 0.0
    pricing = rates or get_pricing_rates()
    return pricing.tavily_usd_per_search


def thrad_cost_usd(*, bid_attempted: bool, rates: PricingRates | None = None) -> float:
    if not bid_attempted:
        return 0.0
    pricing = rates or get_pricing_rates()
    return pricing.thrad_usd_per_bid


@dataclass(frozen=True)
class CostLine:
    service: str
    step: str
    label: str
    amount_usd: float
    input_tokens: int | None = None
    output_tokens: int | None = None
    input_cost_usd: float | None = None
    output_cost_usd: float | None = None
    model: str | None = None
    from_cache: bool | None = None

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "service": self.service,
            "step": self.step,
            "label": self.label,
            "amount_usd": round(self.amount_usd, 6),
        }
        if self.input_tokens is not None:
            payload["input_tokens"] = self.input_tokens
        if self.output_tokens is not None:
            payload["output_tokens"] = self.output_tokens
        if self.input_cost_usd is not None:
            payload["input_cost_usd"] = round(self.input_cost_usd, 6)
        if self.output_cost_usd is not None:
            payload["output_cost_usd"] = round(self.output_cost_usd, 6)
        if self.model is not None:
            payload["model"] = self.model
        if self.from_cache is not None:
            payload["from_cache"] = self.from_cache
        return payload


@dataclass(frozen=True)
class AnthropicTokenCostSummary:
    model: str
    input_tokens: int
    output_tokens: int
    input_cost_usd: float
    output_cost_usd: float
    total_cost_usd: float
    input_usd_per_mtok: float
    output_usd_per_mtok: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "model": self.model,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "input_cost_usd": round(self.input_cost_usd, 6),
            "output_cost_usd": round(self.output_cost_usd, 6),
            "total_cost_usd": round(self.total_cost_usd, 6),
            "input_usd_per_mtok": self.input_usd_per_mtok,
            "output_usd_per_mtok": self.output_usd_per_mtok,
        }


def _anthropic_model_id() -> str:
    from claude_client import DEFAULT_MODEL

    return os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL)


def _anthropic_line(
    *,
    step: str,
    label: str,
    input_tokens: int,
    output_tokens: int,
    rates: PricingRates,
    from_cache: bool = False,
) -> CostLine:
    if from_cache:
        return CostLine(
            service="anthropic",
            step=step,
            label=label + " (cached)",
            amount_usd=0.0,
            input_tokens=0,
            output_tokens=0,
            input_cost_usd=0.0,
            output_cost_usd=0.0,
            model=_anthropic_model_id(),
            from_cache=True,
        )
    input_cost = anthropic_input_cost_usd(input_tokens, rates=rates)
    output_cost = anthropic_output_cost_usd(output_tokens, rates=rates)
    return CostLine(
        service="anthropic",
        step=step,
        label=label,
        amount_usd=round(input_cost + output_cost, 6),
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        input_cost_usd=round(input_cost, 6),
        output_cost_usd=round(output_cost, 6),
        model=_anthropic_model_id(),
    )


def build_anthropic_token_summary(
    *,
    intent_tokens: dict[str, int],
    respond_tokens: dict[str, int],
    align_tokens: dict[str, int],
    intent_scored_live: bool,
    rates: PricingRates | None = None,
) -> AnthropicTokenCostSummary:
    pricing = rates or get_pricing_rates()
    input_tokens = (
        int(respond_tokens.get("input", 0))
        + int(align_tokens.get("input", 0))
        + (int(intent_tokens.get("input", 0)) if intent_scored_live else 0)
    )
    output_tokens = (
        int(respond_tokens.get("output", 0))
        + int(align_tokens.get("output", 0))
        + (int(intent_tokens.get("output", 0)) if intent_scored_live else 0)
    )
    input_cost = anthropic_input_cost_usd(input_tokens, rates=pricing)
    output_cost = anthropic_output_cost_usd(output_tokens, rates=pricing)
    return AnthropicTokenCostSummary(
        model=_anthropic_model_id(),
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        input_cost_usd=round(input_cost, 6),
        output_cost_usd=round(output_cost, 6),
        total_cost_usd=round(input_cost + output_cost, 6),
        input_usd_per_mtok=pricing.anthropic_input_usd_per_mtok,
        output_usd_per_mtok=pricing.anthropic_output_usd_per_mtok,
    )


def build_query_costs(
    *,
    tavily_from_cache: bool,
    intent_tokens: dict[str, int],
    respond_tokens: dict[str, int],
    align_tokens: dict[str, int],
    thrad_bid_attempted: bool,
    intent_scored_live: bool,
    intent_from_cache: bool = False,
    respond_from_cache: bool = False,
    align_from_cache: bool = False,
    rates: PricingRates | None = None,
) -> tuple[list[CostLine], float, AnthropicTokenCostSummary]:
    pricing = rates or get_pricing_rates()
    lines: list[CostLine] = []

    tavily_amount = tavily_cost_usd(from_cache=tavily_from_cache, rates=pricing)
    lines.append(
        CostLine(
            service="tavily",
            step="tavily.search",
            label="Tavily search" + (" (cached)" if tavily_from_cache else ""),
            amount_usd=tavily_amount,
            from_cache=tavily_from_cache,
        )
    )

    if intent_scored_live:
        intent_in = int(intent_tokens.get("input", 0))
        intent_out = int(intent_tokens.get("output", 0))
        lines.append(
            _anthropic_line(
                step="claude.intent",
                label="Intent scoring",
                input_tokens=intent_in,
                output_tokens=intent_out,
                rates=pricing,
                from_cache=intent_from_cache,
            )
        )

    respond_in = int(respond_tokens.get("input", 0))
    respond_out = int(respond_tokens.get("output", 0))
    lines.append(
        _anthropic_line(
            step="claude.respond",
            label="Grounded response",
            input_tokens=respond_in,
            output_tokens=respond_out,
            rates=pricing,
            from_cache=respond_from_cache,
        )
    )

    align_in = int(align_tokens.get("input", 0))
    align_out = int(align_tokens.get("output", 0))
    lines.append(
        _anthropic_line(
            step="claude.answer_align",
            label="Answer alignment",
            input_tokens=align_in,
            output_tokens=align_out,
            rates=pricing,
            from_cache=align_from_cache,
        )
    )

    if thrad_bid_attempted:
        lines.append(
            CostLine(
                service="thrad",
                step="thrad.bid",
                label="Thrad bid",
                amount_usd=thrad_cost_usd(bid_attempted=True, rates=pricing),
            )
        )

    total = sum(line.amount_usd for line in lines)
    anthropic_summary = build_anthropic_token_summary(
        intent_tokens=intent_tokens,
        respond_tokens=respond_tokens,
        align_tokens=align_tokens,
        intent_scored_live=intent_scored_live,
        rates=pricing,
    )
    return lines, round(total, 6), anthropic_summary
