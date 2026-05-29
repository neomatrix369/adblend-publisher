"""Classify assistant reply focus and inferred persona."""

from __future__ import annotations

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

SYSTEM_PROMPT = """Classify the ASSISTANT reply (not the user question).
Return ONLY JSON:
{
  "focus": { "category": string, "sub_category": string },
  "persona_id": string | null,
  "rationale": "one line"
}
Use persona ids from the publisher dataset when obvious
(e.g. current-student, software-engineer, ad-publisher).
For AdTech replies use category "AdTech" (not "advertising") when applicable.
Categories should reflect the reply's actual topic."""


def _empty_tokens() -> dict[str, int]:
    return {"input": 0, "output": 0}


def _fallback_answer() -> dict[str, Any]:
    return {
        "focus": {"category": "", "sub_category": ""},
        "persona_id": None,
        "rationale": "Answer classification unavailable",
    }


def _parse_answer_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    data = json.loads(cleaned)

    focus_raw = data.get("focus")
    if isinstance(focus_raw, dict):
        category = str(focus_raw.get("category") or "")
        sub_category = str(focus_raw.get("sub_category") or "")
    else:
        category = ""
        sub_category = ""

    persona_raw = data.get("persona_id")
    persona_id = str(persona_raw) if persona_raw else None
    rationale = str(data.get("rationale") or "").strip()

    return {
        "focus": {"category": category, "sub_category": sub_category},
        "persona_id": persona_id,
        "rationale": rationale,
    }


@dataclass(frozen=True)
class ClassifyAnswerResult:
    data: dict[str, Any]
    tokens: dict[str, int]
    from_cache: bool


def classify_answer(
    user_message: str,
    assistant_text: str,
) -> ClassifyAnswerResult:
    cache_key = demo_step_cache.align_key(user_message, assistant_text)
    cached = demo_step_cache.get("align", cache_key)
    if cached is not None:
        data, _stored_tokens = cached
        return ClassifyAnswerResult(
            data=data,
            tokens=_empty_tokens(),
            from_cache=True,
        )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY missing — answer classification unavailable")
        return ClassifyAnswerResult(
            data=_fallback_answer(),
            tokens=_empty_tokens(),
            from_cache=False,
        )

    client = anthropic.Anthropic(api_key=api_key)
    user_content = (
        f"User question:\n{user_message}\n\nAssistant reply:\n{assistant_text}"
    )
    tokens = _empty_tokens()

    try:
        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL),
            max_tokens=128,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
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
            return ClassifyAnswerResult(
                data=_fallback_answer(),
                tokens=tokens,
                from_cache=False,
            )
        parsed = _parse_answer_json(text)
        demo_step_cache.set("align", cache_key, (parsed, tokens))
        return ClassifyAnswerResult(data=parsed, tokens=tokens, from_cache=False)
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        logger.warning("Answer focus parse failed: %s", exc)
        return ClassifyAnswerResult(
            data=_fallback_answer(),
            tokens=tokens,
            from_cache=False,
        )
    except Exception:
        logger.exception("Answer classification failed")
        return ClassifyAnswerResult(
            data=_fallback_answer(),
            tokens=_empty_tokens(),
            from_cache=False,
        )
