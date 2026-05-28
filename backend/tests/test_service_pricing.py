"""Service pricing unit tests — no API keys required."""

import pytest

from service_pricing import (
    PricingRates,
    anthropic_cost_usd,
    anthropic_input_cost_usd,
    anthropic_output_cost_usd,
    build_query_costs,
    tavily_cost_usd,
    thrad_cost_usd,
)


def test_given_token_counts_when_anthropic_cost_then_uses_per_mtok_rates() -> None:
    # given
    rates = PricingRates(
        anthropic_input_usd_per_mtok=3.0,
        anthropic_output_usd_per_mtok=15.0,
        tavily_usd_per_search=0.01,
        thrad_usd_per_bid=0.0,
    )

    # when
    actual = anthropic_cost_usd(1_000_000, 100_000, rates=rates)

    # then
    assert actual == pytest.approx(4.5)


def test_given_cached_tavily_when_cost_then_zero() -> None:
    # given, when
    actual = tavily_cost_usd(from_cache=True)

    # then
    assert actual == 0.0


def test_given_live_pipeline_when_build_costs_then_includes_all_steps() -> None:
    # given
    rates = PricingRates(
        anthropic_input_usd_per_mtok=3.0,
        anthropic_output_usd_per_mtok=15.0,
        tavily_usd_per_search=0.01,
        thrad_usd_per_bid=0.002,
    )

    # when
    lines, total, summary = build_query_costs(
        tavily_from_cache=False,
        intent_tokens={"input": 100, "output": 50},
        respond_tokens={"input": 500, "output": 200},
        align_tokens={"input": 80, "output": 40},
        thrad_bid_attempted=True,
        intent_scored_live=True,
        rates=rates,
    )

    # then
    steps = [line.step for line in lines]
    assert steps == [
        "tavily.search",
        "claude.intent",
        "claude.respond",
        "claude.answer_align",
        "thrad.bid",
    ]
    assert total == pytest.approx(sum(line.amount_usd for line in lines))
    assert lines[0].amount_usd == 0.01
    assert lines[-1].amount_usd == 0.002
    assert summary.input_tokens == 680
    assert summary.output_tokens == 290
    intent_line = lines[1]
    assert intent_line.input_cost_usd is not None
    assert intent_line.output_cost_usd is not None
    assert intent_line.model is not None
    assert intent_line.input_cost_usd + intent_line.output_cost_usd == pytest.approx(
        intent_line.amount_usd
    )


def test_given_dropdown_intent_when_build_costs_then_skips_intent_line() -> None:
    # when
    lines, _total, summary = build_query_costs(
        tavily_from_cache=True,
        intent_tokens={"input": 0, "output": 0},
        respond_tokens={"input": 100, "output": 50},
        align_tokens={"input": 20, "output": 10},
        thrad_bid_attempted=False,
        intent_scored_live=False,
    )

    # then
    assert [line.step for line in lines] == [
        "tavily.search",
        "claude.respond",
        "claude.answer_align",
    ]
    assert lines[0].from_cache is True
    assert lines[0].amount_usd == 0.0
    assert summary.input_tokens == 120
    assert summary.total_cost_usd == pytest.approx(anthropic_cost_usd(120, 60))


def test_given_token_split_when_anthropic_input_output_cost_then_uses_rates() -> None:
    # given
    rates = PricingRates(
        anthropic_input_usd_per_mtok=3.0,
        anthropic_output_usd_per_mtok=15.0,
        tavily_usd_per_search=0.01,
        thrad_usd_per_bid=0.0,
    )

    # when
    actual_in = anthropic_input_cost_usd(1_000_000, rates=rates)
    actual_out = anthropic_output_cost_usd(100_000, rates=rates)

    # then
    assert actual_in == pytest.approx(3.0)
    assert actual_out == pytest.approx(1.5)
