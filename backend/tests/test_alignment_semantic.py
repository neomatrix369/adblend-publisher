"""Semantic alignment integration — downloads embedder on first run."""

import pytest

from alignment import score_focus_match

pytestmark = pytest.mark.slow


def test_given_adtech_and_advertising_focus_when_scored_then_similarity_is_high() -> None:
    # given
    question_focus = {"category": "AdTech", "sub_category": "fundamentals"}
    answer_focus = {
        "category": "advertising",
        "sub_category": "programmatic advertising",
    }

    # when
    actual = score_focus_match(question_focus, answer_focus)

    # then
    assert actual >= 0.55, (
        f"Expected semantic focus match >= 0.55 for related topics, got {actual}"
    )
