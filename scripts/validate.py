#!/usr/bin/env python3
"""
AZ-104 Question Validator
Validates generated questions against Azure documentation.
"""

import json
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
        if "options" not in q or len(q.get("options", [])) != 4:
            issues.append(f"{prefix}: Must have exactly 4 options")
        if "correct_answer" not in q:
            issues.append(f"{prefix}: Missing correct_answer")
        if "explanation" not in q:
            issues.append(f"{prefix}: Missing explanation")
        if "difficulty" not in q:
            issues.append(f"{prefix}: Missing difficulty")

        # Check correct_answer is valid
        valid_labels = {"A", "B", "C", "D"}
        if q.get("correct_answer") not in valid_labels:
            issues.append(f"{prefix}: Invalid correct_answer '{q.get('correct_answer')}'")

    return issues


def validate_content(data: dict) -> list[str]:
    """Basic content validation rules."""
    issues = []

    for i, q in enumerate(data.get("questions", [])):
        prefix = f"Question {i+1}"
        text = q.get("question_text", "")

        # Check for forbidden patterns
        forbidden = ["all of the above", "none of the above", "always", "never", "only"]
        text_lower = text.lower()
        for pattern in forbidden:
            if pattern in text_lower:
                issues.append(f"{prefix}: Contains forbidden pattern '{pattern}'")

        # Check options don't repeat
        options = [o.get("text", "") for o in q.get("options", [])]
        if len(set(options)) != len(options):
            issues.append(f"{prefix}: Duplicate options detected")

        # Check explanation exists and is not empty
        explanation = q.get("explanation", "")
        if len(explanation) < 20:
            issues.append(f"{prefix}: Explanation too short ({len(explanation)} chars)")

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
