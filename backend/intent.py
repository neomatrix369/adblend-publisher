import json
import logging
import os
import re

import anthropic

from claude_client import DEFAULT_MODEL

logger = logging.getLogger(__name__)

INTENT_GATE_THRESHOLD = 0.70

SYSTEM_PROMPT = """You are a commercial intent classifier for an AI publisher chatbot.
Score the user's message from 0.0 to 1.0 based on purchase or production adoption intent.
0.0 = off-topic or purely educational with no product decision
0.7+ = clear commercial intent (vendor selection, pricing, production deployment)

Return ONLY valid JSON with this shape:
{"score": float, "tier": "high|medium|low|off-topic", "category": string, "sub_category": string}

Tier guidelines:
- high: score 0.70–1.00
- medium: score 0.40–0.69
- low: score 0.10–0.39
- off-topic: score 0.00–0.09

category/sub_category: short labels for ad context (e.g. "AI tooling" / "model selection")."""


def tier_from_score(score: float) -> str:
    if score >= 0.70:
        return "high"
    if score >= 0.40:
        return "medium"
    if score >= 0.10:
        return "low"
    return "off-topic"


def ad_eligible_from_score(score: float) -> bool:
    return score >= INTENT_GATE_THRESHOLD


def _parse_intent_json(text: str) -> dict[str, object]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    data = json.loads(cleaned)
    score = float(data["score"])
    score = max(0.0, min(1.0, score))
    tier = str(data.get("tier") or tier_from_score(score))
    return {
        "score": score,
        "tier": tier,
        "ad_eligible": ad_eligible_from_score(score),
        "category": str(data.get("category") or "AI tooling"),
        "sub_category": str(data.get("sub_category") or "general"),
    }


def _fallback_intent() -> dict[str, object]:
    return {
        "score": 0.0,
        "tier": "off-topic",
        "ad_eligible": False,
        "category": "AI tooling",
        "sub_category": "general",
    }


def score_intent(message: str) -> dict[str, object]:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY missing — intent scoring unavailable")
        return _fallback_intent()

    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL),
            max_tokens=128,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}],
        )
        text = ""
        for block in response.content:
            if block.type == "text":
                text = block.text
                break
        if not text:
            return _fallback_intent()
        parsed = _parse_intent_json(text)
        parsed["tier"] = tier_from_score(float(parsed["score"]))
        parsed["ad_eligible"] = ad_eligible_from_score(float(parsed["score"]))
        return parsed
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        logger.warning("Intent parse failed: %s", exc)
        return _fallback_intent()
    except Exception as exc:
        logger.exception("Intent scoring failed")
        return _fallback_intent()
