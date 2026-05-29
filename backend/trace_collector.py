"""Per-request trace summary for the UI; pairs with Overmind OTEL spans when enabled."""

from __future__ import annotations

import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any, Iterator, Mapping


@dataclass
class TraceSpan:
    name: str
    latency_ms: float


def _apply_span_attributes(attributes: Mapping[str, Any]) -> None:
    if not attributes:
        return
    try:
        from opentelemetry import trace

        span = trace.get_current_span()
        if span is None or not span.is_recording():
            return
        for key, value in attributes.items():
            span.set_attribute(key, value)
    except Exception:
        return


@dataclass
class TraceCollector:
    spans: list[TraceSpan] = field(default_factory=list)

    @contextmanager
    def record(
        self,
        name: str,
        attributes: dict[str, Any] | None = None,
    ) -> Iterator[None]:
        """Time a pipeline step and mirror it as an Overmind span when available."""
        start = time.perf_counter()
        otel_cm = _otel_span(name)
        with otel_cm:
            try:
                yield
            finally:
                latency_ms = (time.perf_counter() - start) * 1000.0
                self.spans.append(TraceSpan(name=name, latency_ms=latency_ms))
                if attributes is not None:
                    _apply_span_attributes(attributes)

    def to_dict(self) -> dict[str, Any]:
        total_ms = sum(s.latency_ms for s in self.spans)
        return {
            "span_count": len(self.spans),
            "total_latency_ms": round(total_ms, 1),
            "calls": [
                {"name": s.name, "latency_ms": round(s.latency_ms, 1)}
                for s in self.spans
            ],
        }


def _otel_span(name: str):
    try:
        from overmind import get_tracer

        tracer = get_tracer()
        return tracer.start_as_current_span(name)
    except Exception:
        from contextlib import nullcontext

        return nullcontext()


@contextmanager
def request_trace_root() -> Iterator[None]:
    """Parent span for the full /chat pipeline (Overmind dashboard only)."""
    with _otel_span("adblend.chat"):
        yield
