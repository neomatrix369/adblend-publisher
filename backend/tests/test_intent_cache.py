"""Intent scoring cache for demo repeat queries."""

from unittest.mock import MagicMock, patch

import demo_step_cache
import intent


def test_score_intent_uses_cache_on_repeat_query() -> None:
    demo_step_cache.clear_all()

    mock_response = MagicMock()
    mock_response.usage.input_tokens = 50
    mock_response.usage.output_tokens = 20
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = (
        '{"score": 0.85, "tier": "high", "rationale": "buying signal", '
        '"focus": {"category": "AI tooling", "sub_category": "vector db"}}'
    )
    mock_response.content = [text_block]

    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}):
        with patch("intent.anthropic.Anthropic") as mock_client:
            mock_client.return_value.messages.create.return_value = mock_response
            first = intent.score_intent("vector database for production")
            second = intent.score_intent("vector database for production")

    assert first.from_cache is False
    assert second.from_cache is True
    assert first.scored["score"] == second.scored["score"]
    assert second.tokens == {"input": 0, "output": 0}
    mock_client.return_value.messages.create.assert_called_once()
