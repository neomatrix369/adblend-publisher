"""Cosine similarity for short text labels (focus, persona profiles)."""

from __future__ import annotations

import logging
import math
import re
from collections import Counter
from typing import Callable

logger = logging.getLogger(__name__)

_text_similarity_override: Callable[[str, str], float] | None = None
_embedder = None


def set_text_similarity_for_tests(fn: Callable[[str, str], float] | None) -> None:
    """Replace similarity backend (pass None to restore default)."""
    global _text_similarity_override
    _text_similarity_override = fn


def reset_text_similarity_for_tests() -> None:
    set_text_similarity_for_tests(None)


def _tokenize(text: str) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9]+", text.casefold()) if token]


def _token_cosine(left: str, right: str) -> float:
    left_tokens = _tokenize(left)
    right_tokens = _tokenize(right)
    if not left_tokens or not right_tokens:
        return 0.0

    left_counts = Counter(left_tokens)
    right_counts = Counter(right_tokens)
    dot = sum(
        left_counts[token] * right_counts[token]
        for token in left_counts
        if token in right_counts
    )
    left_norm = math.sqrt(sum(value * value for value in left_counts.values()))
    right_norm = math.sqrt(sum(value * value for value in right_counts.values()))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return float(dot / (left_norm * right_norm))


def _cosine_vectors(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0
    dot = sum(a * b for a, b in zip(left, right, strict=True))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return float(dot / (left_norm * right_norm))


def _get_embedder():
    global _embedder
    if _embedder is not None:
        return _embedder
    try:
        from fastembed import TextEmbedding

        _embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        logger.info("Loaded fastembed model for alignment similarity")
    except Exception as exc:
        logger.warning("Semantic embedder unavailable, using token cosine: %s", exc)
        _embedder = False
    return _embedder


def _semantic_cosine(left: str, right: str) -> float:
    embedder = _get_embedder()
    if embedder is False:
        return _token_cosine(left, right)

    vectors = list(embedder.embed([left, right]))
    return _cosine_vectors(list(vectors[0]), list(vectors[1]))


def text_similarity(left: str, right: str) -> float:
    """Cosine similarity in [0, 1] between two short phrases."""
    if _text_similarity_override is not None:
        return max(0.0, min(1.0, _text_similarity_override(left, right)))

    left_clean = (left or "").strip()
    right_clean = (right or "").strip()
    if not left_clean or not right_clean:
        return 0.0
    if left_clean.casefold() == right_clean.casefold():
        return 1.0

    score = float(_semantic_cosine(left_clean, right_clean))
    return max(0.0, min(1.0, score))
