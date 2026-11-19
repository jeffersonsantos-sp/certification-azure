#!/usr/bin/env python3
"""
AZ-104 Question Validator
Validates generated questions against Azure documentation.
"""

import json
import re
import sys
from pathlib import Path
from typing import Optional


def load_questions(filepath: str) -> dict:
    """Load questions from a JSON file."""
    with open(filepath) as f:
        return json.load(f)


def validate_structure(data: dict) -> list[str]:
    """Validate the structure of a question file."""
    issues = []

    if "metadata" not in data:
        issues.append("Missing 'metadata' field")
    if "questions" not in data:
        issues.append("Missing 'questions' field")
        return issues

    for i, q in enumerate(data["questions"]):
        prefix = f"Question {i+1}"

        if "question_text" not in q:
            issues.append(f"{prefix}: Missing question_text")
        if "explanation" not in q:
            issues.append(f"{prefix}: Missing explanation")
        if "difficulty" not in q:
            issues.append(f"{prefix}: Missing difficulty")
        elif q.get("difficulty") not in ("easy", "intermediate", "advanced"):
            issues.append(f"{prefix}: Invalid difficulty '{q.get('difficulty')}'")
        if not q.get("tags"):
            issues.append(f"{prefix}: Missing tags")

        question_type = q.get("question_type", "single_choice")
        options = q.get("options", [])
        correct_answer = q.get("correct_answer")
        valid_labels = {"A", "B", "C", "D"}

        if question_type in ("single_choice", "case_study", "multiple_choice"):
            if len(options) != 4:
                issues.append(f"{prefix}: Must have exactly 4 options")
            invalid = [
                label for label in (
                    correct_answer if isinstance(correct_answer, list) else [correct_answer]
                ) if label not in valid_labels
            ]
            if invalid:
                issues.append(f"{prefix}: Invalid correct_answer '{invalid}'")
            if question_type == "multiple_choice":
                correct_flags = [
                    option.get("label") for option in options if option.get("is_correct")
                ]
                if len(correct_flags) < 2:
                    issues.append(f"{prefix}: Multiple-choice needs at least two correct options")
                if sorted(correct_flags) != sorted(correct_answer or []):
                    issues.append(f"{prefix}: correct_answer must match is_correct flags")
        elif question_type == "case_study":
            if not (q.get("question_data") or {}).get("scenario"):
                issues.append(f"{prefix}: Case study requires question_data.scenario")
        elif question_type == "drag_drop":
            if len(options) < 2:
                issues.append(f"{prefix}: Drag-drop questions need at least 2 items")
            if not isinstance(correct_answer, list) or sorted(correct_answer) != sorted(
                option.get("label") for option in options
            ) or len(set(correct_answer)) != len(correct_answer):
                issues.append(f"{prefix}: Drag-drop correct_answer must list every option label once")
        elif question_type == "hotspot":
            question_data = q.get("question_data", {})
            if not question_data.get("image_url") or not question_data.get("regions"):
                issues.append(f"{prefix}: Hotspot requires image_url and regions")
            regions = question_data.get("regions", [])
            region_ids = {region.get("id") for region in regions}
            if correct_answer not in region_ids:
                issues.append(f"{prefix}: Hotspot correct_answer must be a region id")
            for region in regions:
                for field in ("x", "y", "width", "height"):
                    if not isinstance(region.get(field), (int, float)):
                        issues.append(f"{prefix}: Hotspot region {region.get('id')} needs numeric {field}")
        else:
            issues.append(f"{prefix}: Unknown question_type '{question_type}'")

    return issues


def validate_content(data: dict) -> list[str]:
    """Basic content validation rules."""
    issues = []

    warnings = []

    for i, q in enumerate(data.get("questions", [])):
        prefix = f"Question {i+1}"
        text = q.get("question_text", "")
        question_type = q.get("question_type", "single_choice")

        # Check for forbidden patterns
        forbidden = ["all of the above", "none of the above"]
        text_lower = text.lower()
        for pattern in forbidden:
            if pattern in text_lower:
                issues.append(f"{prefix}: Contains forbidden pattern '{pattern}'")
        for pattern in ("always", "never"):
            if re.search(rf"\b{pattern}\b", text_lower):
                issues.append(f"{prefix}: Contains forbidden pattern '{pattern}'")
        if re.search(r"\bonly\b", text_lower) and not re.search(
            r"read[- ]only|only allow|only if|only when|only from|only to|only have", text_lower
        ):
            warnings.append(f"{prefix}: Contains ambiguous absolute term 'only'")

        # Check options don't repeat
        options = [o.get("text", "") for o in q.get("options", [])]
        if len(set(options)) != len(options):
            issues.append(f"{prefix}: Duplicate options detected")

        # Check explanation exists and is not empty
        explanation = q.get("explanation", "")
        if len(explanation) < 20:
            issues.append(f"{prefix}: Explanation too short ({len(explanation)} chars)")
        if not q.get("reference_url"):
            if question_type == "single_choice":
                warnings.append(f"{prefix}: Missing reference_url (legacy single-choice draft)")
            else:
                issues.append(f"{prefix}: Advanced formats require reference_url")

    data.setdefault("_warnings", warnings)
    return issues


def review_file(filepath: str) -> dict:
    """Review a question file and return results."""
    data = load_questions(filepath)

    structure_issues = validate_structure(data)
    content_issues = validate_content(data)

    all_issues = structure_issues + content_issues

    return {
        "file": filepath,
        "valid": len(all_issues) == 0,
        "issue_count": len(all_issues),
        "structure_issues": structure_issues,
        "content_issues": content_issues,
        "warnings": data.get("_warnings", []),
        "status": data.get("metadata", {}).get("status", "unknown"),
        "question_count": len(data.get("questions", []))
    }


def approve_file(filepath: str):
    """Mark a file as approved."""
    data = load_questions(filepath)
    data["metadata"]["status"] = "approved"
    data["metadata"]["validated_at"] = __import__("datetime").datetime.now().isoformat()

    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Approved: {filepath}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="AZ-104 Question Validator")
    parser.add_argument("action", choices=["review", "approve", "list"],
                        help="Action to perform")
    parser.add_argument("--file", help="Specific file to review/approve")
    parser.add_argument("--dir", default="questions/drafts", help="Directory to scan")
    parser.add_argument("--status", help="Filter by status (draft, approved, etc.)")

    args = parser.parse_args()

    if args.file:
        files = [args.file]
    else:
        files = sorted(Path(args.dir).glob("*.json"))

    if args.action == "list":
        for f in files:
            data = load_questions(str(f))
            status = data.get("metadata", {}).get("status", "unknown")
            count = len(data.get("questions", []))
            print(f"[{status}] {count} questions - {f}")

    elif args.action == "review":
        total_issues = 0
        for f in files:
            result = review_file(str(f))
            if args.status and result["status"] != args.status:
                continue

            if result["valid"]:
                print(f"PASS: {f} ({result['question_count']} questions)")
            else:
                print(f"FAIL: {f} ({result['issue_count']} issues)")
                for issue in result["content_issues"][:5]:
                    print(f"  - {issue}")
                total_issues += result["issue_count"]

        print(f"\nTotal issues: {total_issues}")

    elif args.action == "approve":
        for f in files:
            data = load_questions(str(f))
            if args.status and data.get("metadata", {}).get("status") != args.status:
                continue
            approve_file(str(f))


if __name__ == "__main__":
    main()
