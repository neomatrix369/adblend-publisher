"""Grounded response cache for demo repeat queries."""

from unittest.mock import MagicMock, patch

import claude_client
import demo_step_cache


def test_generate_response_uses_cache_on_repeat_query() -> None:
    demo_step_cache.clear_all()

    mock_message = MagicMock()
    mock_message.usage.input_tokens = 200
    mock_message.usage.output_tokens = 100
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = "Use Pinecone for production vector search."
    mock_message.content = [text_block]

    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}):
        with patch("claude_client.anthropic.Anthropic") as mock_client:
            mock_client.return_value.messages.create.return_value = mock_message
            context = "Pinecone docs: managed vector DB"
            first = claude_client.generate_response("vector db?", context)
            second = claude_client.generate_response("vector db?", context)

    assert first.from_cache is False
    assert second.from_cache is True
    assert first.text == second.text
    assert second.tokens == {"input": 0, "output": 0}
    mock_client.return_value.messages.create.assert_called_once()
