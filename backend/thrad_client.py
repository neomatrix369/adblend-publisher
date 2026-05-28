"""Mock Thrad bid — no API key or signup required for the hackathon demo."""

from typing import Any

INTENT_GATE_THRESHOLD = 0.70


def request_ad(
    message: str,
    focus: dict[str, str],
    intent_score: float,
) -> dict[str, Any] | None:
    if intent_score < INTENT_GATE_THRESHOLD:
        return None

    category = focus.get("category") or "AI tooling"
    sub_category = focus.get("sub_category") or "general"
    snippet = message.strip()[:80] or "your query"

    return {
        "headline": f"Sponsored · {category}",
        "body": (
            f"Mock placement for “{snippet}” ({sub_category}). "
            "Swap `request_ad` for the live Thrad bid endpoint when you have a publisher key."
        ),
        "cta_url": "https://www.thrad.ai/",
        "cta_label": "Explore Thrad",
        "advertiser": "Demo Partner",
        "mock": True,
    }
