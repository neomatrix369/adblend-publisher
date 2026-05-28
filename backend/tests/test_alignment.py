"""Alignment scoring unit tests — deterministic, no API keys."""

import pytest

from alignment import (
    compute_alignment,
    label_from_overall,
    score_focus_match,
    score_overall,
    score_persona_match,
)


FOCUS_MATCH_CASES = [
    (
        {"category": "Student financial aid", "sub_category": "FAFSA"},
        {"category": "Student financial aid", "sub_category": "FAFSA"},
        1.0,
    ),
    (
        {"category": "Student financial aid", "sub_category": "FAFSA"},
        {"category": "Student financial aid", "sub_category": "General"},
        0.55,
    ),
    (
        {"category": "Student financial aid", "sub_category": "FAFSA"},
        {"category": "AI tooling", "sub_category": "vector DB"},
        0.15,
    ),
    (
        {"category": "general", "sub_category": "general"},
        {"category": "AI tooling", "sub_category": "RAG"},
        0.35,
    ),
    (
        None,
        {"category": "AI tooling", "sub_category": "RAG"},
        0.35,
    ),
]


@pytest.mark.parametrize(
    ("question_focus", "answer_focus", "expected"),
    FOCUS_MATCH_CASES,
    ids=[
        "same_category_and_sub",
        "same_category_diff_sub",
        "different_category",
        "weak_general_only",
        "empty_question_focus",
    ],
)
def test_given_focus_pair_when_scored_then_returns_expected_match(
    question_focus: dict | None,
    answer_focus: dict | None,
    expected: float,
) -> None:
    # given, when
    actual = score_focus_match(question_focus, answer_focus)

    # then
    assert actual == expected, (
        f"Expected focus_match {expected} for {question_focus} vs {answer_focus}"
    )


PERSONA_MATCH_CASES = [
    ("current-student", "current-student", 1.0),
    ("current-student", "recent-graduate", 0.0),
    ("current-student", None, 0.0),
    (None, "current-student", None),
    (None, None, None),
]


@pytest.mark.parametrize(
    ("question_id", "answer_id", "expected"),
    PERSONA_MATCH_CASES,
    ids=[
        "matching_persona",
        "different_persona",
        "missing_answer_persona",
        "no_question_persona",
        "both_missing",
    ],
)
def test_given_persona_pair_when_scored_then_returns_expected_match(
    question_id: str | None,
    answer_id: str | None,
    expected: float | None,
) -> None:
    # given, when
    actual = score_persona_match(question_id, answer_id)

    # then
    assert actual == expected


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
