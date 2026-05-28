#!/usr/bin/env python3
"""Persona metadata for data/golden_dataset.json.

Patch (``--apply``): add ``personas[]`` and entry ``persona_id`` / ``persona_role`` only.
Review (``--list``, ``--persona``, ``--all``): inspect assignments (read-only).
Validate (``--check``): confirm coverage on the file on disk (read-only).
"""

from __future__ import annotations

import argparse
import copy
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = REPO_ROOT / "data" / "golden_dataset.json"
ORIGINAL_REF = "d371cf9:data/golden_dataset.json"

# Slice 4 AdTech demo questions — not in git canonical tree; explicit persona map.
DEMO_PERSONAS: list[dict[str, str]] = [
    {
        "id": "software-engineer",
        "role": "Software Engineer",
        "description": (
            "Builds production AI chatbot and RAG infrastructure; "
            "evaluates vendors, frameworks, and models."
        ),
    },
    {
        "id": "ad-publisher",
        "role": "Ad Publisher",
        "description": (
            "Monetises in-chat experiences via programmatic ads, SSPs, "
            "attribution, and measurement."
        ),
    },
]

ADTECH_PERSONA_LOOKUP: dict[str, tuple[str, str]] = {
    "Which vector database should I use for a production RAG system with 50M embeddings?": (
        "software-engineer",
        "Software Engineer",
    ),
    "Pinecone vs Weaviate Cloud for enterprise search \u2014 what are real costs at scale?": (
        "software-engineer",
        "Software Engineer",
    ),
    "Which LLM API is most cost-effective for 10M queries/month in production?": (
        "software-engineer",
        "Software Engineer",
    ),
    "How does LangChain compare to LlamaIndex for building RAG pipelines?": (
        "software-engineer",
        "Software Engineer",
    ),
    "Difference between text-embedding-3-small and text-embedding-3-large for semantic search?": (
        "software-engineer",
        "Software Engineer",
    ),
    "How does cosine similarity work in vector search?": (
        "software-engineer",
        "Software Engineer",
    ),
    "Explain how retrieval-augmented generation works": (
        "software-engineer",
        "Software Engineer",
    ),
    "Which SSP should we integrate with to maximise fill rate for our AI chatbot?": (
        "ad-publisher",
        "Ad Publisher",
    ),
    "What attribution platform should we use to track chatbot \u2192 paid subscription conversions?": (
        "ad-publisher",
        "Ad Publisher",
    ),
    "What metrics matter most when measuring ROI of in-chat advertising?": (
        "ad-publisher",
        "Ad Publisher",
    ),
    "How does intent-based targeting work in conversational AI contexts?": (
        "ad-publisher",
        "Ad Publisher",
    ),
    "What is programmatic advertising and how does it work?": (
        "ad-publisher",
        "Ad Publisher",
    ),
}


def load_original_personas() -> tuple[list[dict[str, str]], dict[str, tuple[str, str]]]:
    raw = subprocess.check_output(
        ["git", "show", ORIGINAL_REF],
        cwd=REPO_ROOT,
        text=True,
    )
    original = json.loads(raw)
    personas: list[dict[str, str]] = []
    lookup: dict[str, tuple[str, str]] = {}

    for persona in original.get("personas", []):
        personas.append(
            {
                "id": persona["id"],
                "role": persona["role"],
                "description": persona.get("description", ""),
            }
        )
        for question in persona.get("questions", []):
            lookup[question["text"]] = (persona["id"], persona["role"])

    return personas, lookup


def load_original_focus_lookup() -> dict[str, tuple[str, str, str]]:
    raw = subprocess.check_output(
        ["git", "show", ORIGINAL_REF],
        cwd=REPO_ROOT,
        text=True,
    )
    original = json.loads(raw)
    lookup: dict[str, tuple[str, str, str]] = {}
    for persona in original.get("personas", []):
        for question in persona.get("questions", []):
            lookup[question["text"]] = (
                persona["id"],
                persona["role"],
                question["focus"],
            )
    return lookup


def load_dataset(path: Path | None = None) -> dict[str, Any]:
    target = path or DATA_PATH
    with target.open(encoding="utf-8") as f:
        return json.load(f)


def write_dataset(data: dict[str, Any], path: Path | None = None) -> None:
    target = path or DATA_PATH
    with target.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=True)
        f.write("\n")


def _entry_with_persona(
    entry: dict[str, Any],
    persona_id: str,
    persona_role: str,
) -> dict[str, Any]:
    patched: dict[str, Any] = {}
    for key, value in entry.items():
        if key in ("persona_id", "persona_role"):
            continue
        patched[key] = value
        if key == "user_input":
            patched["persona_id"] = persona_id
            patched["persona_role"] = persona_role
    return patched


def patch_personas_only(data: dict[str, Any]) -> tuple[dict[str, Any], int, int, int]:
    personas, lookup = load_original_personas()
    personas = personas + DEMO_PERSONAS
    lookup = {**lookup, **ADTECH_PERSONA_LOOKUP}
    patched = copy.deepcopy(data)
    patched["personas"] = personas

    new_entries: list[dict[str, Any]] = []
    matched = 0
    adtech_matched = 0

    for entry in patched.get("entries", []):
        user_input = entry.get("user_input", "")
        if user_input in lookup:
            persona_id, persona_role = lookup[user_input]
            new_entries.append(_entry_with_persona(entry, persona_id, persona_role))
            if user_input in ADTECH_PERSONA_LOOKUP:
                adtech_matched += 1
            else:
                matched += 1
        else:
            new_entries.append(copy.deepcopy(entry))

    patched["entries"] = new_entries
    unmatched = len(new_entries) - matched - adtech_matched
    return patched, matched, adtech_matched, unmatched


def verify_non_persona_unchanged(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    def strip_persona(entry: dict[str, Any]) -> dict[str, Any]:
        return {k: v for k, v in entry.items() if k not in ("persona_id", "persona_role")}

    before_entries = [strip_persona(e) for e in before.get("entries", [])]
    after_entries = [strip_persona(e) for e in after.get("entries", [])]

    if before_entries != after_entries:
        for i, (before_entry, after_entry) in enumerate(
            zip(before_entries, after_entries)
        ):
            if before_entry != after_entry:
                errors.append(
                    f"Entry {i} changed beyond persona fields: "
                    f"{before_entry.get('user_input', '')[:50]}…"
                )
                break
        if len(before_entries) != len(after_entries):
            errors.append(
                f"Entry count changed: {len(before_entries)} → {len(after_entries)}"
            )

    return errors


def validate_on_disk(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if not data.get("personas"):
        errors.append("Missing top-level personas[]")
    for entry in data.get("entries", []):
        if not entry.get("persona_id"):
            errors.append(f"Missing persona_id: {entry.get('user_input', '')[:50]}…")
    return errors


def persona_entries(data: dict[str, Any], persona_id: str) -> list[dict[str, Any]]:
    return [e for e in data["entries"] if e.get("persona_id") == persona_id]


def print_persona_review(
    data: dict[str, Any],
    persona_id: str,
    *,
    index: int | None = None,
    total: int | None = None,
    original_lookup: dict[str, tuple[str, str, str]] | None = None,
) -> None:
    personas = {p["id"]: p for p in data.get("personas", [])}
    persona = personas.get(persona_id)
    if not persona:
        print(f"Unknown persona: {persona_id}", file=sys.stderr)
        print(f"Available: {', '.join(personas)}", file=sys.stderr)
        raise SystemExit(1)

    header = f"Persona {index}/{total}" if index and total else "Persona"
    print(f"\n{'=' * 72}")
    print(f"{header}: {persona['role']} ({persona_id})")
    print(f"{'=' * 72}")
    print(f"Description: {persona['description']}")
    print(f"Questions: {len(persona_entries(data, persona_id))}")
    print()

    for i, entry in enumerate(persona_entries(data, persona_id), start=1):
        focus = entry.get("focus", {})
        intent = entry.get("intent", {})
        user_input = entry["user_input"]
        orig = original_lookup.get(user_input) if original_lookup else None
        check = ""
        if orig:
            ok = orig[0] == persona_id and orig[2] == focus.get("sub_category")
            check = (
                " [canonical OK]"
                if ok
                else f" [MISMATCH vs canonical: {orig[0]}/{orig[2]}]"
            )

        print(
            f"  {i:2}. focus: {focus.get('category')} › "
            f"{focus.get('sub_category')}{check}"
        )
        print(f"      intent: {intent.get('tier')} ({intent.get('score')})")
        print(f"      Q: {user_input}")
        print()


def print_persona_list(data: dict[str, Any]) -> None:
    print(f"\nPersonas ({len(data.get('personas', []))}):")
    for i, persona in enumerate(data.get("personas", []), start=1):
        count = len(persona_entries(data, persona["id"]))
        print(f"  {i}. {persona['id']:22} {persona['role']:22} ({count} questions)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write persona-only patch to golden_dataset.json",
    )
    parser.add_argument(
        "--from-main",
        action="store_true",
        help="With --apply: patch starting from main branch file",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate persona coverage on disk (read-only)",
    )
    parser.add_argument("--list", action="store_true", help="List personas and counts")
    parser.add_argument("--persona", metavar="ID", help="Review one persona")
    parser.add_argument("--all", action="store_true", help="Review all personas")
    args = parser.parse_args()

    if not any([args.apply, args.check, args.list, args.persona, args.all]):
        parser.print_help()
        return 0

    if args.apply:
        if args.from_main:
            raw = subprocess.check_output(
                ["git", "show", "main:data/golden_dataset.json"],
                cwd=REPO_ROOT,
                text=True,
            )
            before = json.loads(raw)
        else:
            if not DATA_PATH.is_file():
                print(f"Missing dataset: {DATA_PATH}", file=sys.stderr)
                return 1
            before = load_dataset()

        after, matched, adtech_matched, unmatched = patch_personas_only(before)
        print(
            f"personas={len(after.get('personas', []))} student_aid={matched} "
            f"adtech={adtech_matched} unmatched={unmatched}"
        )
        if unmatched > 0:
            print("Warning: some entries have no persona assignment", file=sys.stderr)

        errors = verify_non_persona_unchanged(before, after)
        if errors:
            for err in errors:
                print(f"ERROR: {err}", file=sys.stderr)
            return 1

        write_dataset(after)
        print(f"Wrote persona-only patch to {DATA_PATH}")
        return 0

    if not DATA_PATH.is_file():
        print(f"Missing dataset: {DATA_PATH}", file=sys.stderr)
        return 1

    data = load_dataset()
    original_lookup = load_original_focus_lookup()

    if args.check:
        errors = validate_on_disk(data)
        if errors:
            for err in errors:
                print(f"ERROR: {err}", file=sys.stderr)
            return 1
        print(
            f"OK: {len(data.get('personas', []))} personas, "
            f"{len(data.get('entries', []))} entries"
        )
        return 0

    if args.list:
        print_persona_list(data)
        print(f"\nTotal entries: {len(data['entries'])}")
        return 0

    if args.persona:
        personas = data.get("personas", [])
        ids = [p["id"] for p in personas]
        idx = ids.index(args.persona) + 1 if args.persona in ids else None
        print_persona_review(
            data,
            args.persona,
            index=idx,
            total=len(personas),
            original_lookup=original_lookup,
        )
        return 0

    if args.all:
        personas = data.get("personas", [])
        for i, persona in enumerate(personas, start=1):
            print_persona_review(
                data,
                persona["id"],
                index=i,
                total=len(personas),
                original_lookup=original_lookup,
            )
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
