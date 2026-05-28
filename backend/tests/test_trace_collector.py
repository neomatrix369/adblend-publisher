"""Trace collector unit tests — no API keys required."""

from trace_collector import TraceCollector


def test_given_recorded_spans_when_to_dict_then_returns_summary() -> None:
    # given
    collector = TraceCollector()

    # when
    with collector.record("tavily.search"):
        pass
    with collector.record("claude.intent"):
        pass
    actual = collector.to_dict()

    # then
    assert actual["span_count"] == 2
    assert actual["total_latency_ms"] >= 0
    assert [c["name"] for c in actual["calls"]] == [
        "tavily.search",
        "claude.intent",
    ]
    assert all(c["latency_ms"] >= 0 for c in actual["calls"])
