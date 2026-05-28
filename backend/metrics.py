"""In-memory session metrics for the publisher demo (single server process)."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

ImpressionState = Literal["logged", "no_fill", "none"]


@dataclass
class LastImpression:
    state: ImpressionState
    tier: str
    score: float
    bid_won: bool


@dataclass
class SessionMetrics:
    total_queries: int = 0
    ads_served: int = 0
    no_fill: int = 0
    blocked: int = 0
    session_cogs_usd: float = 0.0
    last_impression: LastImpression | None = field(default=None)

    def record(
        self,
        *,
        intent_tier: str,
        intent_score: float,
        ad_served: bool,
        thrad_called: bool,
        query_cogs_usd: float = 0.0,
    ) -> None:
        self.total_queries += 1
        self.session_cogs_usd = round(self.session_cogs_usd + query_cogs_usd, 6)
        if ad_served:
            self.ads_served += 1
            state: ImpressionState = "logged"
        elif thrad_called:
            self.no_fill += 1
            state = "no_fill"
        else:
            self.blocked += 1
            state = "none"

        self.last_impression = LastImpression(
            state=state,
            tier=intent_tier,
            score=intent_score,
            bid_won=ad_served,
        )

    @property
    def fill_rate(self) -> float:
        """Bid fill: served / (served + no_fill). Excludes blocked (no bid)."""
        denom = self.ads_served + self.no_fill
        return round(self.ads_served / denom * 100, 1) if denom > 0 else 0.0

    @property
    def query_ad_rate(self) -> float:
        """Share of all chat queries that showed an ad."""
        if self.total_queries <= 0:
            return 0.0
        return round(self.ads_served / self.total_queries * 100, 1)

    @property
    def bids_attempted(self) -> int:
        return self.ads_served + self.no_fill

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "total_queries": self.total_queries,
            "ads_served": self.ads_served,
            "no_fill": self.no_fill,
            "blocked": self.blocked,
            "bids_attempted": self.bids_attempted,
            "fill_rate": self.fill_rate,
            "query_ad_rate": self.query_ad_rate,
            "session_cogs_usd": round(self.session_cogs_usd, 6),
        }
        if self.last_impression is not None:
            payload["last_impression"] = asdict(self.last_impression)
        else:
            payload["last_impression"] = None
        return payload

    def reset(self) -> None:
        self.total_queries = 0
        self.ads_served = 0
        self.no_fill = 0
        self.blocked = 0
        self.session_cogs_usd = 0.0
        self.last_impression = None


metrics = SessionMetrics()
