"""In-memory per-step cache for demo repeat queries."""

from __future__ import annotations

import hashlib
from typing import Any, Literal

StepNamespace = Literal["intent", "respond", "align"]

_stores: dict[StepNamespace, dict[str, Any]] = {
    "intent": {},
    "respond": {},
    "align": {},
}


def get(namespace: StepNamespace, key: str) -> Any | None:
    return _stores[namespace].get(key)


def set(namespace: StepNamespace, key: str, value: Any) -> None:
    _stores[namespace][key] = value


def clear_all() -> None:
    for store in _stores.values():
        store.clear()


def intent_key(message: str) -> str:
    return message.strip().lower()


def content_hash(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode()).hexdigest()


def respond_key(message: str, context: str) -> str:
    return content_hash(message.strip(), context)


def align_key(message: str, assistant_text: str) -> str:
    return content_hash(message.strip(), assistant_text)
