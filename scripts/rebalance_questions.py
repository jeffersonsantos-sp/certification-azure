#!/usr/bin/env python3
"""Rebalance approved questions by domain/skill without losing answer history."""

import asyncio
import json
import sys
from pathlib import Path
from uuid import uuid4

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select
from app.core.database import async_session
from app.models.models import DifficultyLevel, Question, QuestionStatus

DRAFTS_DIR = PROJECT_ROOT / "questions" / "drafts"
TARGETS_FILE = PROJECT_ROOT / "skills-measured" / "question-targets.json"


def load_targets() -> dict[str, int]:
    data = json.loads(TARGETS_FILE.read_text())
    return {
        skill["id"]: skill["target"]
        for domain in data["domains"]
        for skill in domain["skills"]
    }


def load_candidates() -> dict[str, list[dict]]:
    by_skill: dict[str, list[dict]] = {}
    seen: set[str] = set()

    for path in sorted(DRAFTS_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        metadata = data.get("metadata", {})
        skill_id = metadata.get("skill_id") or path.stem.split("_")[1]

        for item in data.get("questions", []):
            text = item.get("question_text", "").strip()
            if not text or text.lower() in seen:
                continue
            seen.add(text.lower())

            by_skill.setdefault(skill_id, []).append(
                {
                    "skill_id": skill_id,
                    "question_text": text,
                    "question_type": item.get("question_type", "single_choice"),
                    "question_data": item.get("question_data", {}),
                    "options": item.get("options", []),
                    "correct_answer": item.get("correct_answer", "A"),
                    "explanation": item.get("explanation", ""),
                    "reference_url": item.get("reference_url"),
                    "difficulty": item.get("difficulty", "intermediate"),
                    "tags": item.get("tags", []),
                }
            )

    return by_skill


def difficulty(value: str) -> DifficultyLevel:
    if value == "easy":
        return DifficultyLevel.easy
    if value == "advanced":
        return DifficultyLevel.advanced
    return DifficultyLevel.intermediate


async def main() -> None:
    targets = load_targets()
    candidates = load_candidates()
    selected: list[dict] = []

    for skill_id, target in targets.items():
        pool = candidates.get(skill_id, [])
        pool.sort(
            key=lambda item: (
                bool(item.get("reference_url")),
                len(item.get("tags") or []),
                len(item.get("explanation") or ""),
            ),
            reverse=True,
        )
        selected.extend(pool[:target])

    selected_texts = {item["question_text"].strip().lower() for item in selected}

    async with async_session() as session:
        result = await session.execute(select(Question))
        existing = result.scalars().all()

        existing_by_text: dict[str, list[Question]] = {}
        for question in existing:
            existing_by_text.setdefault(question.question_text.strip().lower(), []).append(question)

        for question in existing:
            question.status = QuestionStatus.review

        created = 0
        reused = 0
        for item in selected:
            key = item["question_text"].strip().lower()
            matches = existing_by_text.get(key, [])
            question = matches[0] if matches else None

            if question is None:
                question = Question(id=uuid4())
                session.add(question)
                created += 1
            else:
                reused += 1

            question.skill_id = item["skill_id"]
            question.question_text = item["question_text"]
            question.question_type = item["question_type"]
            question.question_data = item["question_data"]
            question.options = item["options"]
            question.correct_answer = item["correct_answer"]
            question.explanation = item["explanation"]
            question.reference_url = item["reference_url"]
            question.difficulty = difficulty(item["difficulty"])
            question.tags = item["tags"]
            question.status = QuestionStatus.approved

            for duplicate in matches[1:]:
                duplicate.status = QuestionStatus.review

        await session.commit()

    print(f"Selected approved questions: {len(selected)}")
    print(f"Reused existing IDs: {reused}")
    print(f"Created new IDs: {created}")
    print(f"Marked as review: {len(existing) + created - len(selected)}")


if __name__ == "__main__":
    asyncio.run(main())
