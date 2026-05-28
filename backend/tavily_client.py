import logging
import os
from typing import Any

from tavily import TavilyClient

logger = logging.getLogger(__name__)

_client: TavilyClient | None = None


def _get_client() -> TavilyClient:
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise ValueError("TAVILY_API_KEY is not set")
    _client = TavilyClient(api_key=api_key)
    return _client


def search(query: str, max_results: int = 3) -> list[dict[str, Any]]:
    """Return Tavily results as [{title, url, content}, ...]. Empty list on no hits."""
    try:
        raw = _get_client().search(query, max_results=max_results)
        hits = raw.get("results") if isinstance(raw, dict) else None
        if not hits:
            return []
        return [
            {
                "title": str(item.get("title", "")),
                "url": str(item.get("url", "")),
                "content": str(item.get("content", "")),
            }
            for item in hits
            if isinstance(item, dict)
        ]
    except ValueError:
        raise
    except Exception as exc:
        logger.warning("Tavily search failed for query=%r: %s", query, exc)
        return []
