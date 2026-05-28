"""Tavily in-memory cache for demo repeat queries."""

from unittest.mock import MagicMock, patch

import tavily_client


def test_search_uses_cache_on_repeat_query() -> None:
    tavily_client.clear_cache()
    tavily_client._client = None  # noqa: SLF001

    mock_client = MagicMock()
    mock_client.search.return_value = {
        "results": [{"title": "A", "url": "https://a.test", "content": "body"}]
    }

    with patch.dict("os.environ", {"TAVILY_API_KEY": "test-key"}):
        with patch.object(tavily_client, "_get_client", return_value=mock_client):
            first = tavily_client.search("vector database rag")
            second = tavily_client.search("vector database rag")

    assert first.sources == second.sources
    assert len(first.sources) == 1
    assert first.from_cache is False
    assert second.from_cache is True
    mock_client.search.assert_called_once()
