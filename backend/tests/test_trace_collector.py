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


def test_given_attribute_dict_when_record_completes_then_does_not_break_without_otel() -> None:
    # given
    collector = TraceCollector()
    attrs: dict[str, object] = {"tavily.from_cache": True, "tavily.source_count": 3}

    # when
    with collector.record("tavily.search", attrs):
        attrs["tavily.source_count"] = 5
    actual = collector.to_dict()

    # then
    assert actual["span_count"] == 1
    assert actual["calls"][0]["name"] == "tavily.search"
