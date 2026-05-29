import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Any

import anthropic

import demo_step_cache
from claude_client import DEFAULT_MODEL

logger = logging.getLogger(__name__)

INTENT_GATE_THRESHOLD = 0.70

SYSTEM_PROMPT = """You are a commercial intent classifier for an AI publisher.
Score the user's message from 0.0 to 1.0 based on purchase/adoption intent.
Also classify the focus category and sub-category.

Return ONLY valid JSON:
{
  "score": float,
  "tier": "high|medium|low|off-topic",
  "rationale": "one line explanation",
  "focus": {
    "category": "advertising|AI tooling|DevOps|general",
    "sub_category": "specific sub-topic"
  }
}

Tier guidelines (align tier with score):
- high: score 0.70–1.00
- medium: score 0.40–0.69
- low: score 0.10–0.39
- off-topic: score 0.00–0.09"""


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


def _parse_intent_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    data = json.loads(cleaned)
    score = float(data["score"])
    score = max(0.0, min(1.0, score))

    focus_raw = data.get("focus")
    if isinstance(focus_raw, dict):
        category = str(focus_raw.get("category") or "AI tooling")
        sub_category = str(focus_raw.get("sub_category") or "general")
    else:
        category = str(data.get("category") or "AI tooling")
        sub_category = str(data.get("sub_category") or "general")

    tier = str(data.get("tier") or tier_from_score(score))
    rationale = str(data.get("rationale") or "").strip()

    return {
        "score": score,
        "tier": tier,
        "ad_eligible": ad_eligible_from_score(score),
        "rationale": rationale,
        "category": category,
        "sub_category": sub_category,
    }


def _fallback_intent() -> dict[str, Any]:
    return {
        "score": 0.0,
        "tier": "off-topic",
        "ad_eligible": False,
        "rationale": "Intent scoring unavailable",
        "category": "AI tooling",
        "sub_category": "general",
    }


def _empty_tokens() -> dict[str, int]:
    return {"input": 0, "output": 0}


@dataclass(frozen=True)
class IntentScoreResult:
    scored: dict[str, Any]
    tokens: dict[str, int]
    from_cache: bool


def score_intent(message: str) -> IntentScoreResult:
    cache_key = demo_step_cache.intent_key(message)
    cached = demo_step_cache.get("intent", cache_key)
    if cached is not None:
        scored, _stored_tokens = cached
        return IntentScoreResult(
            scored=scored,
            tokens=_empty_tokens(),
            from_cache=True,
        )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY missing — intent scoring unavailable")
        return IntentScoreResult(
            scored=_fallback_intent(),
            tokens=_empty_tokens(),
            from_cache=False,
        )

    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL),
            max_tokens=128,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}],
        )
        tokens = {
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens,
        }
        text = ""
        for block in response.content:
            if block.type == "text":
                text = block.text
                break
        if not text:
            return IntentScoreResult(
                scored=_fallback_intent(),
                tokens=tokens,
                from_cache=False,
            )
        parsed = _parse_intent_json(text)
        parsed["tier"] = tier_from_score(float(parsed["score"]))
        parsed["ad_eligible"] = ad_eligible_from_score(float(parsed["score"]))
        if not parsed["rationale"]:
            parsed["rationale"] = f"Classified as {parsed['tier']} intent"
        demo_step_cache.set("intent", cache_key, (parsed, tokens))
        return IntentScoreResult(scored=parsed, tokens=tokens, from_cache=False)
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        logger.warning("Intent parse failed: %s", exc)
        return IntentScoreResult(
            scored=_fallback_intent(),
            tokens=_empty_tokens(),
            from_cache=False,
        )
    except Exception:
        logger.exception("Intent scoring failed")
        return IntentScoreResult(
            scored=_fallback_intent(),
            tokens=_empty_tokens(),
            from_cache=False,
        )
