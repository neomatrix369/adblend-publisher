"""Alignment scoring unit tests — mock similarity, no API keys or model download."""

import pytest

from alignment import (
    compute_alignment,
    focus_to_text,
    label_from_overall,
    score_focus_match,
    score_overall,
    score_persona_match,
)
from text_similarity import reset_text_similarity_for_tests, set_text_similarity_for_tests


@pytest.fixture(autouse=True)
def _clear_similarity_override() -> None:
    reset_text_similarity_for_tests()
    yield
    reset_text_similarity_for_tests()


def test_given_exact_focus_when_scored_then_returns_one() -> None:
    # given
    question_focus = {
        "category": "Student financial aid",
        "sub_category": "FAFSA",
    }

    # when
    actual = score_focus_match(question_focus, question_focus)

    # then
    assert actual == 1.0


def test_given_weak_general_focus_when_scored_then_returns_weak_score() -> None:
    # given
    question_focus = {"category": "general", "sub_category": "general"}
    answer_focus = {"category": "AI tooling", "sub_category": "RAG"}

    # when
    actual = score_focus_match(question_focus, answer_focus)

    # then
    assert actual == 0.35


def test_given_mocked_cosine_when_same_category_diff_sub_then_uses_similarity() -> None:
    # given
    set_text_similarity_for_tests(lambda _left, _right: 0.55)
    question_focus = {
        "category": "Student financial aid",
        "sub_category": "FAFSA",
    }
    answer_focus = {
        "category": "Student financial aid",
        "sub_category": "General",
    }

    # when
    actual = score_focus_match(question_focus, answer_focus)

    # then
    assert actual == 0.55


def test_given_mocked_cosine_when_different_labels_then_uses_similarity() -> None:
    # given
    set_text_similarity_for_tests(lambda _left, _right: 0.72)
    question_focus = {"category": "AdTech", "sub_category": "fundamentals"}
    answer_focus = {
        "category": "advertising",
        "sub_category": "programmatic advertising",
    }

    # when
    actual = score_focus_match(question_focus, answer_focus)

    # then
    assert actual == 0.72


def test_given_focus_dict_when_converted_to_text_then_joins_category_and_sub() -> None:
    # given, when
    actual = focus_to_text(
        {"category": "AdTech", "sub_category": "fundamentals"},
    )

    # then
    assert actual == "AdTech fundamentals"


PERSONA_MATCH_CASES = [
    ("current-student", "current-student", 1.0),
    (None, "current-student", None),
    (None, None, None),
]


@pytest.mark.parametrize(
    ("question_id", "answer_id", "expected"),
    PERSONA_MATCH_CASES,
    ids=[
        "matching_persona_id",
        "no_question_persona",
        "both_missing",
    ],
)
def test_given_persona_id_pair_when_exact_match_then_returns_expected(
    question_id: str | None,
    answer_id: str | None,
    expected: float | None,
) -> None:
    # given, when
    actual = score_persona_match(question_id, answer_id)

    # then
    assert actual == expected


def test_given_mocked_cosine_when_different_persona_ids_then_uses_similarity() -> None:
    # given
    set_text_similarity_for_tests(lambda _left, _right: 0.2)
    # when
    actual = score_persona_match("current-student", "recent-graduate")

    # then
    assert actual == 0.2


def test_given_missing_answer_persona_when_rationale_present_then_uses_soft_match() -> None:
    # given
    set_text_similarity_for_tests(lambda _left, _right: 0.61)
    # when
    actual = score_persona_match(
        "ad-publisher",
        None,
        question_persona_role="Ad Publisher",
        answer_rationale="Technical educational explanation of programmatic advertising",
        answer_focus={
            "category": "advertising",
            "sub_category": "programmatic advertising",
        },
    )

    # then
    assert actual == 0.61


def test_given_persona_null_when_overall_then_uses_focus_only() -> None:
    # given
    focus_match = 0.85

    # when
    actual = score_overall(focus_match, None)

    # then
    assert actual == 0.85


def test_given_persona_present_when_overall_then_weighted_blend() -> None:
    # given
    focus_match = 0.85
    persona_match = 1.0

    # when
    actual = score_overall(focus_match, persona_match)

    # then
    assert actual == pytest.approx(0.6 * 0.85 + 0.4 * 1.0)


LABEL_CASES = [
    (0.91, "strong"),
    (0.75, "strong"),
    (0.50, "partial"),
    (0.45, "partial"),
    (0.30, "weak"),
]


@pytest.mark.parametrize(("overall", "expected"), LABEL_CASES)
def test_given_overall_score_when_labeled_then_returns_tier(
    overall: float,
    expected: str,
) -> None:
    # given, when
    actual = label_from_overall(overall)

    # then
    assert actual == expected


def test_given_question_and_answer_traits_when_computed_then_returns_payload() -> None:
    # given
    set_text_similarity_for_tests(lambda _left, _right: 0.55)
    question_focus = {
        "category": "Student financial aid",
        "sub_category": "FAFSA",
    }
    answer_focus = {
        "category": "Student financial aid",
        "sub_category": "General",
    }

    # when
    actual = compute_alignment(
        question_persona_id="parent-family",
        question_persona_role="Parent/Family",
        question_focus=question_focus,
        answer_persona_id="parent-family",
        answer_focus=answer_focus,
        answer_rationale="Reply stays on aid topic",
    )

    # then
    assert actual["scores"]["focus_match"] == 0.55
    assert actual["scores"]["persona_match"] == 1.0
    assert actual["scores"]["overall"] == pytest.approx(0.6 * 0.55 + 0.4 * 1.0)
    assert actual["labels"]["persona"] == "match"
    assert actual["answer"]["rationale"] == "Reply stays on aid topic"
