"""Answer focus classifier tests — mock Anthropic, no API keys."""

from unittest.mock import MagicMock, patch

from answer_focus import _parse_answer_json, classify_answer

import demo_step_cache


def test_given_valid_json_when_parsed_then_returns_focus_and_persona() -> None:
    # given
    raw = """```json
{
  "focus": { "category": "Student financial aid", "sub_category": "FAFSA" },
  "persona_id": "parent-family",
  "rationale": "Parent-oriented aid guidance"
}
```"""

    # when
    actual = _parse_answer_json(raw)

    # then
    assert actual["focus"]["category"] == "Student financial aid"
    assert actual["focus"]["sub_category"] == "FAFSA"
    assert actual["persona_id"] == "parent-family"
    assert actual["rationale"] == "Parent-oriented aid guidance"


def test_given_malformed_json_when_classified_then_returns_fallback() -> None:
    # given
    demo_step_cache.clear_all()
    mock_response = MagicMock()
    mock_response.usage.input_tokens = 10
    mock_response.usage.output_tokens = 5
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = "not json"
    mock_response.content = [text_block]

    # when
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}):
        with patch("answer_focus.anthropic.Anthropic") as mock_client:
            mock_client.return_value.messages.create.return_value = mock_response
            result = classify_answer("question", "answer text")
            actual = result.data
            tokens = result.tokens

    # then
    assert actual["focus"]["category"] == ""
    assert actual["persona_id"] is None
    assert actual["rationale"] == "Answer classification unavailable"
    assert tokens["input"] == 10


def test_given_no_api_key_when_classified_then_returns_fallback_without_call() -> None:
    # given, when
    with patch.dict("os.environ", {}, clear=True):
        with patch("answer_focus.anthropic.Anthropic") as mock_client:
            result = classify_answer("question", "answer text")
            actual = result.data
            tokens = result.tokens

    # then
    mock_client.assert_not_called()
    assert actual["rationale"] == "Answer classification unavailable"
    assert tokens == {"input": 0, "output": 0}
