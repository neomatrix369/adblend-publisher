"""Question↔answer alignment scoring via cosine similarity (no LLM for scores)."""

from __future__ import annotations

from typing import TypedDict

from persona_registry import persona_profile_text
from text_similarity import text_similarity

WEAK_FOCUS_SCORE = 0.35
PERSONA_MATCH_THRESHOLD = 0.75


class FocusDict(TypedDict, total=False):
    category: str
    sub_category: str


class AlignmentScores(TypedDict):
    focus_match: float
    persona_match: float | None
    overall: float


class AlignmentLabels(TypedDict):
    focus: str
    persona: str


def _norm(value: str | None) -> str:
    return (value or "").strip().casefold()


def focus_to_text(focus: FocusDict | None) -> str:
    if not focus:
        return ""
    category = (focus.get("category") or "").strip()
    sub_category = (focus.get("sub_category") or "").strip()
    if category and sub_category:
        return f"{category} {sub_category}"
    return category or sub_category


def _is_weak_focus(focus: FocusDict | None) -> bool:
    if not focus:
        return True
    category = _norm(focus.get("category"))
    sub = _norm(focus.get("sub_category"))
    if not category and not sub:
        return True
    if category == "general" and (not sub or sub == "general"):
        return True
    return False


def score_focus_match(
    question_focus: FocusDict | None,
    answer_focus: FocusDict | None,
) -> float:
    if _is_weak_focus(question_focus) or _is_weak_focus(answer_focus):
        return WEAK_FOCUS_SCORE

    q_cat = _norm(question_focus.get("category") if question_focus else "")
    q_sub = _norm(question_focus.get("sub_category") if question_focus else "")
    a_cat = _norm(answer_focus.get("category") if answer_focus else "")
    a_sub = _norm(answer_focus.get("sub_category") if answer_focus else "")

    if q_cat == a_cat and q_sub == a_sub:
        return 1.0

    question_text = focus_to_text(question_focus)
    answer_text = focus_to_text(answer_focus)
    full_similarity = text_similarity(question_text, answer_text)

    category_similarity = text_similarity(q_cat, a_cat) if q_cat and a_cat else 0.0
    sub_similarity = text_similarity(q_sub, a_sub) if q_sub and a_sub else 0.0

    return round(max(full_similarity, category_similarity, sub_similarity), 2)


def score_persona_match(
    question_persona_id: str | None,
    answer_persona_id: str | None,
    *,
    question_persona_role: str | None = None,
    answer_rationale: str | None = None,
    answer_focus: FocusDict | None = None,
) -> float | None:
    if not question_persona_id:
        return None

    if (
        answer_persona_id
        and _norm(answer_persona_id) == _norm(question_persona_id)
    ):
        return 1.0

    question_text = persona_profile_text(
        question_persona_id,
        question_persona_role,
    )
    if answer_persona_id:
        answer_text = persona_profile_text(answer_persona_id)
    else:
        answer_parts = [
            part
            for part in (
                (answer_rationale or "").strip(),
                focus_to_text(answer_focus),
            )
            if part
        ]
        answer_text = ". ".join(answer_parts)

    if not question_text.strip():
        return 0.0
    if not answer_text.strip():
        return 0.0

    return round(text_similarity(question_text, answer_text), 2)


def score_overall(
    focus_match: float,
    persona_match: float | None,
) -> float:
    if persona_match is None:
        return focus_match
    return 0.6 * focus_match + 0.4 * persona_match


def label_from_overall(overall: float) -> str:
    if overall >= 0.75:
        return "strong"
    if overall >= 0.45:
        return "partial"
    return "weak"


def persona_label(persona_match: float | None) -> str:
    if persona_match is None:
        return "n/a"
    if persona_match >= PERSONA_MATCH_THRESHOLD:
        return "match"
    return "mismatch"


def compute_alignment(
    *,
    question_persona_id: str | None,
    question_persona_role: str | None,
    question_focus: FocusDict | None,
    answer_persona_id: str | None,
    answer_focus: FocusDict | None,
    answer_rationale: str | None = None,
) -> dict:
    focus_match = score_focus_match(question_focus, answer_focus)
    persona_match = score_persona_match(
        question_persona_id,
        answer_persona_id,
        question_persona_role=question_persona_role,
        answer_rationale=answer_rationale,
        answer_focus=answer_focus,
    )
    overall = score_overall(focus_match, persona_match)

    return {
        "question": {
            "persona_id": question_persona_id,
            "persona_role": question_persona_role,
            "focus": question_focus or {"category": "", "sub_category": ""},
        },
        "answer": {
            "focus": answer_focus or {"category": "", "sub_category": ""},
            "persona_id": answer_persona_id,
            "rationale": answer_rationale or "",
        },
        "scores": {
            "focus_match": round(focus_match, 2),
            "persona_match": (
                round(persona_match, 2) if persona_match is not None else None
            ),
            "overall": round(overall, 2),
        },
        "labels": {
            "focus": label_from_overall(overall),
            "persona": persona_label(persona_match),
        },
    }
