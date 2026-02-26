#!/usr/bin/env python3
"""
Lint a web-app spec markdown file for handoff readiness.

Checks:
1) Required section headings
2) Placeholder tokens (for example: {foo}, [TODO], TBD)
3) Empty field bullets (for example: "- Target user:")
4) Optional turn output contract sections
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REQUIRED_SECTION_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("Objective", re.compile(r"^##\s*(?:1\.\s*)?Objective\b", re.MULTILINE)),
    ("MVP Scope", re.compile(r"^##\s*(?:2\.\s*)?MVP Scope\b", re.MULTILINE)),
    ("User Journey", re.compile(r"^##\s*(?:3\.\s*)?User Journey\b", re.MULTILINE)),
    (
        "Functional Requirements",
        re.compile(r"^##\s*(?:4\.\s*)?Functional Requirements\b", re.MULTILINE),
    ),
    (
        "Data and Integrations",
        re.compile(r"^##\s*(?:5\.\s*)?Data and Integrations\b", re.MULTILINE),
    ),
    (
        "Non-Functional Requirements",
        re.compile(r"^##\s*(?:6\.\s*)?Non-Functional Requirements\b", re.MULTILINE),
    ),
    ("Delivery Plan", re.compile(r"^##\s*(?:7\.\s*)?Delivery Plan\b", re.MULTILINE)),
    (
        "Decisions and Open Questions",
        re.compile(r"^##\s*(?:8\.\s*)?Decisions and Open Questions\b", re.MULTILINE),
    ),
]

OUTPUT_CONTRACT_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("Decisions", re.compile(r"^##\s*Decisions\b", re.MULTILINE)),
    ("Unresolved Questions", re.compile(r"^##\s*Unresolved Questions\b", re.MULTILINE)),
    ("Next Action", re.compile(r"^##\s*Next Action\b", re.MULTILINE)),
]

PLACEHOLDER_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\{[^{}\n]+\}"),
    re.compile(r"\[(?:TODO|TBD|FIXME)\]", re.IGNORECASE),
    re.compile(r"\b(?:TBD|FIXME|XXX)\b", re.IGNORECASE),
]

# Empty field-style bullets such as "- Target user:"
EMPTY_FIELD_BULLET = re.compile(r"^\s*-\s+[^:\n]{1,120}:\s*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lint markdown spec completeness.")
    parser.add_argument("spec_path", help="Path to a markdown spec file")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail on warnings as well as errors",
    )
    parser.add_argument(
        "--require-output-contract",
        action="store_true",
        help="Require Decisions / Unresolved Questions / Next Action sections",
    )
    return parser.parse_args()


def find_missing_sections(
    content: str,
    patterns: list[tuple[str, re.Pattern[str]]],
) -> list[str]:
    missing: list[str] = []
    for name, pattern in patterns:
        if not pattern.search(content):
            missing.append(name)
    return missing


def find_placeholder_hits(lines: list[str]) -> list[str]:
    hits: list[str] = []
    for idx, line in enumerate(lines, start=1):
        for pattern in PLACEHOLDER_PATTERNS:
            if pattern.search(line):
                hits.append(f"L{idx}: {line.rstrip()}")
                break
    return hits


def find_empty_field_bullets(lines: list[str]) -> list[str]:
    hits: list[str] = []
    for idx, line in enumerate(lines, start=1):
        if EMPTY_FIELD_BULLET.match(line):
            hits.append(f"L{idx}: {line.rstrip()}")
    return hits


def main() -> int:
    args = parse_args()
    path = Path(args.spec_path)
    if not path.exists():
        print(f"[ERROR] File not found: {path}")
        return 2
    if not path.is_file():
        print(f"[ERROR] Path is not a file: {path}")
        return 2

    content = path.read_text(encoding="utf-8")
    lines = content.splitlines()

    errors: list[str] = []
    warnings: list[str] = []

    missing_sections = find_missing_sections(content, REQUIRED_SECTION_PATTERNS)
    if missing_sections:
        errors.append(
            "Missing required sections: " + ", ".join(missing_sections),
        )

    placeholder_hits = find_placeholder_hits(lines)
    if placeholder_hits:
        errors.append("Found unresolved placeholders:")
        errors.extend(f"  - {hit}" for hit in placeholder_hits)

    empty_field_hits = find_empty_field_bullets(lines)
    if empty_field_hits:
        warnings.append("Found empty field bullets:")
        warnings.extend(f"  - {hit}" for hit in empty_field_hits)

    if args.require_output_contract:
        missing_contract = find_missing_sections(content, OUTPUT_CONTRACT_PATTERNS)
        if missing_contract:
            warnings.append(
                "Missing output-contract sections: " + ", ".join(missing_contract),
            )

    if errors:
        print(f"[FAIL] {path}")
        for err in errors:
            print(f"[ERROR] {err}")
    else:
        print(f"[PASS] {path}")

    if warnings:
        for warning in warnings:
            print(f"[WARN] {warning}")

    if errors:
        return 1
    if args.strict and warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
