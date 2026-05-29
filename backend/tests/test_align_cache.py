"""Answer alignment cache for demo repeat queries."""

from unittest.mock import MagicMock, patch

import answer_focus
import demo_step_cache


def test_classify_answer_uses_cache_on_repeat_query() -> None:
    demo_step_cache.clear_all()

    mock_response = MagicMock()
    mock_response.usage.input_tokens = 30
    mock_response.usage.output_tokens = 15
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = (
        '{"focus": {"category": "AI tooling", "sub_category": "vector db"}, '
        '"persona_id": "software-engineer", "rationale": "technical reply"}'
    )
    mock_response.content = [text_block]

    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}):
        with patch("answer_focus.anthropic.Anthropic") as mock_client:
            mock_client.return_value.messages.create.return_value = mock_response
            first = answer_focus.classify_answer("vector db?", "Try Pinecone.")
            second = answer_focus.classify_answer("vector db?", "Try Pinecone.")

    assert first.from_cache is False
    assert second.from_cache is True
    assert first.data == second.data
    assert second.tokens == {"input": 0, "output": 0}
    mock_client.return_value.messages.create.assert_called_once()
