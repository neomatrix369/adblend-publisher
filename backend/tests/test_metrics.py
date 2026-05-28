"""Session metrics unit tests — no API keys required."""

import pytest

from metrics import SessionMetrics


def test_given_served_and_blocked_when_query_ad_rate_then_uses_all_queries() -> None:
    # given
    session = SessionMetrics()
    session.record(
        intent_tier="high",
        intent_score=0.92,
        ad_served=True,
        thrad_called=True,
    )
    session.record(
        intent_tier="off-topic",
        intent_score=0.04,
        ad_served=False,
        thrad_called=False,
    )

    # when
    actual_query_ad_rate = session.query_ad_rate
    actual_fill_rate = session.fill_rate

    # then
    assert actual_query_ad_rate == 50.0
    assert actual_fill_rate == 100.0
    assert session.bids_attempted == 1


def test_given_no_fill_when_fill_rate_then_excludes_blocked() -> None:
    # given
    session = SessionMetrics()
    session.record(
        intent_tier="high",
        intent_score=0.88,
        ad_served=True,
        thrad_called=True,
    )
    session.record(
        intent_tier="high",
        intent_score=0.85,
        ad_served=False,
        thrad_called=True,
    )
    session.record(
        intent_tier="low",
        intent_score=0.15,
        ad_served=False,
        thrad_called=False,
    )

    # when
    actual_fill_rate = session.fill_rate
    actual_query_ad_rate = session.query_ad_rate

    # then
    assert session.ads_served == 1
    assert session.no_fill == 1
    assert session.blocked == 1
    assert actual_fill_rate == 50.0
    assert actual_query_ad_rate == pytest.approx(33.3, abs=0.1)


def test_given_query_costs_when_record_then_accumulates_session_cogs() -> None:
    # given
    session = SessionMetrics()

    # when
    session.record(
        intent_tier="high",
        intent_score=0.9,
        ad_served=True,
        thrad_called=True,
        query_cogs_usd=0.042,
    )
    session.record(
        intent_tier="low",
        intent_score=0.2,
        ad_served=False,
        thrad_called=False,
        query_cogs_usd=0.018,
    )

    # then
    assert session.session_cogs_usd == pytest.approx(0.06)
    assert session.to_dict()["session_cogs_usd"] == pytest.approx(0.06)
