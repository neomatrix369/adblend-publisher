import logging
import os
from typing import Any

from tavily import TavilyClient

logger = logging.getLogger(__name__)

_client: TavilyClient | None = None
_cache: dict[str, list[dict[str, Any]]] = {}


def _get_client() -> TavilyClient:
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise ValueError("TAVILY_API_KEY is not set")
    _client = TavilyClient(api_key=api_key)
    return _client


def clear_cache() -> None:
    """Clear in-memory Tavily cache (demo reset)."""
    _cache.clear()


def search(query: str, max_results: int = 3) -> list[dict[str, Any]]:
    """Return Tavily results as [{title, url, content}, ...]. Empty list on no hits."""
    cache_key = f"{query.strip().lower()}:{max_results}"
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        raw = _get_client().search(query, max_results=max_results)
        hits = raw.get("results") if isinstance(raw, dict) else None
        if not hits:
            _cache[cache_key] = []
            return []
        results = [
            {
                "title": str(item.get("title", "")),
                "url": str(item.get("url", "")),
                "content": str(item.get("content", "")),
            }
            for item in hits
            if isinstance(item, dict)
        ]
        _cache[cache_key] = results
        return results
    except ValueError:
        raise
    except Exception as exc:
        logger.warning("Tavily search failed for query=%r: %s", query, exc)
        return []
