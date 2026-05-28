"""Text similarity unit tests — token cosine, no model download."""

import pytest

from text_similarity import (
    reset_text_similarity_for_tests,
    set_text_similarity_for_tests,
    text_similarity,
)


@pytest.fixture(autouse=True)
def _clear_similarity_override() -> None:
    reset_text_similarity_for_tests()
    yield
    reset_text_similarity_for_tests()


def test_given_identical_phrases_when_similarity_then_returns_one() -> None:
    # given, when
    actual = text_similarity("AdTech fundamentals", "adtech fundamentals")

    # then
    assert actual == 1.0


def test_given_overlapping_tokens_when_similarity_then_returns_high_score() -> None:
    # given, when
    actual = text_similarity(
        "Student financial aid FAFSA",
        "Student financial aid General",
    )

    # then
    assert actual > 0.5


def test_given_unrelated_phrases_when_similarity_then_returns_low_score() -> None:
    # given
    set_text_similarity_for_tests(
        lambda left, right: 0.12 if "fafsa" in left.casefold() else 0.0,
    )

    # when
    actual = text_similarity(
        "Student financial aid FAFSA",
        "AI tooling vector DB",
    )

    # then
    assert actual == 0.12


def test_given_mock_backend_when_similarity_then_uses_override() -> None:
    # given
    set_text_similarity_for_tests(lambda _left, _right: 0.88)

    # when
    actual = text_similarity("any", "text")

    # then
    assert actual == 0.88
