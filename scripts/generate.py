#!/usr/bin/env python3
"""
AZ-104 Question Generator
Generates certification practice questions using AI + human validation.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, asdict

try:
    from openai import OpenAI
except ImportError:
    print("Install openai: pip install openai")
    sys.exit(1)


VALID_DIFFICULTIES = ("easy", "intermediate", "advanced")
VALID_TYPES = ("single_choice", "multiple_choice", "case_study", "drag_drop", "hotspot")


@dataclass
class Option:
    label: str
    text: str
    is_correct: bool = False


@dataclass
class GeneratedQuestion:
    question_text: str
    question_type: str = "single_choice"
    question_data: dict | None = None
    options: list[Option] | None = None
    correct_answer: object = "A"
    explanation: str = ""
    reference_url: str | None = None
    difficulty: str = "intermediate"
    tags: list[str] | None = None
    status: str = "draft"


def load_skills(skills_path: str = "skills-measured/az104-skills.json") -> dict:
    """Load skills measured from JSON file."""
    with open(skills_path) as f:
        return json.load(f)


def get_skill_by_id(skills_data: dict, skill_id: str) -> Optional[dict]:
    """Find a specific skill by its ID."""
    for domain in skills_data["domains"]:
        for skill in domain["skills"]:
            if skill["id"] == skill_id:
                return {"domain": domain, "skill": skill}
    return None


def build_prompt(
    domain_name: str,
    skill_name: str,
    skill_items: list[str],
    count: int,
    question_type: str = "single_choice",
) -> str:
    """Build the generation prompt for a specific skill."""
    items_text = "\n".join(f"  - {item}" for item in skill_items)

    type_rule = (
        "Set question_type to single_choice with exactly four options A-D and one correct label."
        if question_type == "single_choice"
        else f"Set question_type to {question_type} and follow the format rules below."
    )

    advanced_rules = ""
    if question_type == "multiple_choice":
        advanced_rules = "multiple_choice: 4 options; at least two correct labels; correct_answer is an array."
    elif question_type == "case_study":
        advanced_rules = "case_study: 4 options; put the scenario in question_data.scenario; correct_answer is one label."
    elif question_type == "drag_drop":
        advanced_rules = "drag_drop: at least 2 options; correct_answer lists every option label exactly once in order."
    elif question_type == "hotspot":
        advanced_rules = "hotspot: no options; provide question_data.image_url and question_data.regions; correct_answer is a region ID."

    return f"""You are a Microsoft Azure certification expert creating practice questions
for the AZ-104 exam.

Generate {count} questions for the following skill:

Domain: {domain_name}
Skill: {skill_name}
Specific items:
{items_text}

Requirements:
1. {type_rule}
2. Difficulty must be exactly one of: easy, intermediate, advanced.
3. Include real-world administrative scenarios when possible.
4. Every explanation must reference at least one official Microsoft Learn page in `reference_url`.
5. Do NOT use "All of the above" or "None of the above" as options.
6. Avoid absolute terms such as "always", "never" as standalone claims.
7. "read-only" and "only allow" are valid technical phrases and must not be avoided.
8. Use current terminology: Microsoft Entra ID (not Azure AD).
9. Keep Azure names, SKUs, cmdlets and CLI commands in English.
10. Provide 2-5 short tags.
11. Vary the correct answer label across questions; do not make B the answer every time.
{advanced_rules}

Return in this exact JSON format:
{{
  "questions": [
    {{
      "question_text": "...",
      "question_type": "{question_type}",
      "question_data": {{}},
      "options": [
        {{"label": "A", "text": "...", "is_correct": false}},
        {{"label": "B", "text": "...", "is_correct": true}},
        {{"label": "C", "text": "...", "is_correct": false}},
        {{"label": "D", "text": "...", "is_correct": false}}
      ],
      "correct_answer": "B",
      "explanation": "...",
      "reference_url": "https://learn.microsoft.com/...",
      "difficulty": "intermediate",
      "tags": ["tag1", "tag2"]
    }}
  ]
}}"""


def rotate_correct_label(question: GeneratedQuestion, index: int) -> GeneratedQuestion:
    """Rotate options so correct answers are not always label B."""
    if question.question_type != "single_choice" or not question.options:
        return question
    labels = [option.label for option in question.options]
    if "B" not in labels:
        return question
    current = next(
        (option.label for option in question.options if option.is_correct),
        str(question.correct_answer),
    )
    if current not in labels:
        return question
    offset = index % len(labels)
    current_index = labels.index(current)
    shifted = (current_index + offset) % len(labels)
    target_label = labels[shifted]
    question.options = [
        Option(label=option.label, text=option.text, is_correct=option.label == target_label)
        for option in question.options
    ]
    question.correct_answer = target_label
    return question


def normalise_question(raw: dict, fallback_type: str) -> GeneratedQuestion:
    question_type = raw.get("question_type", fallback_type)
    if question_type not in VALID_TYPES:
        question_type = fallback_type

    options_raw = raw.get("options") or []
    options = [
        Option(
            label=str(option.get("label", "")),
            text=str(option.get("text", "")),
            is_correct=bool(option.get("is_correct", False)),
        )
        for option in options_raw
    ]

    difficulty = raw.get("difficulty", "intermediate")
    if difficulty not in VALID_DIFFICULTIES:
        difficulty = "intermediate"

    tags = raw.get("tags") or []

    return GeneratedQuestion(
        question_text=str(raw.get("question_text", "")).strip(),
        question_type=question_type,
        question_data=raw.get("question_data") or {},
        options=options,
        correct_answer=raw.get("correct_answer", "A"),
        explanation=str(raw.get("explanation", "")).strip(),
        reference_url=raw.get("reference_url") or None,
        difficulty=difficulty,
        tags=[str(tag) for tag in tags],
    )


def generate_questions(
    client: OpenAI,
    model: str,
    domain_name: str,
    skill_name: str,
    skill_items: list[str],
    count: int = 10,
    question_type: str = "single_choice",
    max_retries: int = 8,
) -> list[GeneratedQuestion]:
    """Generate questions using OpenAI API with retry logic."""
    import time

    prompt = build_prompt(domain_name, skill_name, skill_items, count, question_type)

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an Azure certification expert. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )

            if not response.choices or not response.choices[0].message.content:
                raise ValueError("Empty response from API")

            data = json.loads(response.choices[0].message.content)
            questions = [
                rotate_correct_label(normalise_question(item, question_type), index)
                for index, item in enumerate(data.get("questions", []))
            ]
            if not questions:
                raise ValueError("No questions in response")
            return questions[:count]

        except Exception as exc:
            message = str(exc)
            if "Retry-After" in message or "in-flight" in message.lower():
                wait_time = 130
            else:
                wait_time = (attempt + 1) * 5
            if attempt < max_retries - 1:
                print(f"  Retry {attempt + 1}/{max_retries} after {wait_time}s: {exc}")
                time.sleep(wait_time)
            else:
                raise


def existing_question_texts(output_dir: str = "questions/drafts") -> set[str]:
    """Return normalized question texts already present in drafts."""
    texts: set[str] = set()
    for path in Path(output_dir).glob("*.json"):
        data = json.loads(path.read_text())
        for question in data.get("questions", []):
            text = str(question.get("question_text", "")).strip().lower()
            if text:
                texts.add(text)
    return texts


def save_questions(
    questions: list[GeneratedQuestion],
    skill_id: str,
    domain_id: str,
    output_dir: str = "questions/drafts",
) -> str:
    """Save generated questions to a JSON file."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    seen = existing_question_texts(output_dir)
    questions = [
        question for question in questions
        if question.question_text.strip().lower() not in seen
    ]
    if not questions:
        print("All generated questions were duplicates; nothing saved.")
        return ""

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/{domain_id}_{skill_id}_{timestamp}.json"

    data = {
        "metadata": {
            "skill_id": skill_id,
            "domain_id": domain_id,
            "generated_at": datetime.now().isoformat(),
            "count": len(questions),
            "status": "draft",
        },
        "questions": [asdict(question) for question in questions],
    }

    with open(filename, "w") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)

    print(f"Saved {len(questions)} questions to {filename}")
    return filename


def count_drafts(output_dir: str = "questions/drafts") -> dict[str, int]:
    """Count current draft questions by skill."""
    counts: dict[str, int] = {}
    for path in Path(output_dir).glob("*.json"):
        data = json.loads(path.read_text())
        skill_id = data.get("metadata", {}).get("skill_id") or path.stem.split("_")[1]
        counts[skill_id] = counts.get(skill_id, 0) + len(data.get("questions", []))
    return counts


def load_targets(path: str = "skills-measured/question-targets.json") -> dict[str, int]:
    """Load target question counts by skill."""
    with open(path) as handle:
        data = json.load(handle)
    return {
        skill["id"]: skill["target"]
        for domain in data["domains"]
        for skill in domain["skills"]
    }


def build_client() -> OpenAI:
    from dotenv import load_dotenv

    load_dotenv(Path(".env").resolve())
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")

    if not api_key:
        raise RuntimeError("Set OPENAI_API_KEY in the environment or .env")

    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="AZ-104 Question Generator")
    parser.add_argument("--skill", help="Generate for specific skill ID (e.g., ig-01)")
    parser.add_argument("--all", action="store_true", help="Generate for all skills")
    parser.add_argument("--balance", action="store_true", help="Generate only the deficit to reach skill targets")
    parser.add_argument("--count", type=int, default=10, help="Questions per skill")
    parser.add_argument("--batch-size", type=int, default=12, help="Max questions per generation call")
    parser.add_argument("--question-type", default="single_choice", choices=VALID_TYPES)
    parser.add_argument("--model", default=os.getenv("OPENAI_MODEL", "openai/gpt-4o"), help="Model to use")
    parser.add_argument("--skills-file", default="skills-measured/az104-skills.json")
    parser.add_argument("--targets-file", default="skills-measured/question-targets.json")
    parser.add_argument("--output-dir", default="questions/drafts")
    parser.add_argument("--dry-run", action="store_true", help="Print the generation plan only")

    args = parser.parse_args()
    if not args.skill and not args.all and not args.balance:
        parser.print_help()
        return

    skills_data = load_skills(args.skills_file)
    targets = load_targets(args.targets_file) if args.balance else {}
    current = count_drafts(args.output_dir) if args.balance else {}

    plan: list[tuple[str, dict, dict, int]] = []
    for domain in skills_data["domains"]:
        for skill in domain["skills"]:
            skill_id = skill["id"]
            if args.skill and skill_id != args.skill:
                continue
            if args.balance:
                need = max(0, targets.get(skill_id, 0) - current.get(skill_id, 0))
                if need == 0:
                    continue
            elif args.all:
                need = args.count
            else:
                need = args.count
            plan.append((skill_id, domain, skill, need))

    if not plan:
        print("No skills need generation.")
        return

    print("Generation plan:")
    for skill_id, _, _, need in plan:
        print(f"  {skill_id}: {current.get(skill_id, 0)} -> {targets.get(skill_id, '?')} (generate {need})")

    if args.dry_run:
        return

    client = build_client()
    import time

    total = 0
    calls_since_cooldown = 0
    for skill_id, domain, skill, need in plan:
        while need > 0:
            if calls_since_cooldown >= 4:
                print("Cooldown 130s (OpenRouter in-flight budget)...")
                time.sleep(130)
                calls_since_cooldown = 0
            batch = min(need, args.batch_size)
            questions = generate_questions(
                client,
                args.model,
                domain["name"],
                skill["name"],
                skill["items"],
                batch,
                args.question_type,
            )
            saved = save_questions(questions, skill_id, domain["id"], args.output_dir)
            if saved:
                saved_count = len(json.loads(Path(saved).read_text())["questions"])
                total += saved_count
                need -= saved_count
            else:
                need -= batch
            time.sleep(8)
            if len(questions) < batch:
                break

    print(f"\nTotal: {total} questions generated")


if __name__ == "__main__":
    main()
