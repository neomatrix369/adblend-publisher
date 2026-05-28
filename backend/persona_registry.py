"""Load persona descriptions for semantic persona alignment."""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "golden_dataset.json"


@lru_cache(maxsize=1)
def persona_descriptions() -> dict[str, str]:
    try:
        raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not load persona descriptions: %s", exc)
        return {}

    descriptions: dict[str, str] = {}
    for persona in raw.get("personas", []):
        persona_id = str(persona.get("id") or "").strip()
        if not persona_id:
            continue
        role = str(persona.get("role") or "").strip()
        description = str(persona.get("description") or "").strip()
        parts = [part for part in (role, description) if part]
        descriptions[persona_id] = ". ".join(parts)
    return descriptions


def persona_profile_text(
    persona_id: str | None,
    persona_role: str | None = None,
) -> str:
    parts: list[str] = []
    if persona_role:
        parts.append(persona_role.strip())
    if persona_id:
        slug_words = persona_id.replace("-", " ").strip()
        if slug_words:
            parts.append(slug_words)
        description = persona_descriptions().get(persona_id, "")
        if description and description not in parts:
            parts.append(description)
    return ". ".join(parts)
