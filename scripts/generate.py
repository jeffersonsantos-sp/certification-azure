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


@dataclass
class Option:
    label: str
    text: str


@dataclass
class GeneratedQuestion:
    question_text: str
    options: list[Option]
    correct_answer: str
    explanation: str
    difficulty: str
    tags: list[str]


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


def build_prompt(domain_name: str, skill_name: str, skill_items: list[str], count: int) -> str:
    """Build the generation prompt for a specific skill."""
    items_text = "\n".join(f"  - {item}" for item in skill_items)

    return f"""You are a Microsoft Azure certification expert creating practice questions
for the AZ-104 exam.

Generate {count} multiple-choice questions for the following skill:

Domain: {domain_name}
Skill: {skill_name}
Specific items:
{items_text}

Requirements:
1. Each question must have exactly 4 options (A, B, C, D)
2. Only ONE correct answer per question
3. Questions should vary in difficulty (easy, intermediate, advanced)
4. Include real-world scenarios when possible
5. Explanations must reference Azure documentation
6. Do NOT use "All of the above" or "None of the above" as options
7. Avoid absolute terms like "always", "never", "only"
8. Use current terminology: Microsoft Entra ID (not Azure AD), etc.

Return in this exact JSON format:
{{
  "questions": [
    {{
      "question_text": "...",
      "options": [
        {{"label": "A", "text": "..."}},
        {{"label": "B", "text": "..."}},
        {{"label": "C", "text": "..."}},
        {{"label": "D", "text": "..."}}
      ],
      "correct_answer": "B",
      "explanation": "...",
      "difficulty": "intermediate",
      "tags": ["tag1", "tag2"]
    }}
  ]
}}"""


def generate_questions(
    client: OpenAI,
    model: str,
    domain_name: str,
    skill_name: str,
    skill_items: list[str],
    count: int = 10,
    max_retries: int = 3
) -> list[GeneratedQuestion]:
    """Generate questions using OpenAI API with retry logic."""
    import time

    prompt = build_prompt(domain_name, skill_name, skill_items, count)

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an Azure certification expert. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )

            if not response.choices or not response.choices[0].message.content:
                raise ValueError(f"Empty response from API")

            content = response.choices[0].message.content
            data = json.loads(content)

            questions = []
            for q in data.get("questions", []):
                options = [Option(label=o["label"], text=o["text"]) for o in q["options"]]
                questions.append(GeneratedQuestion(
                    question_text=q["question_text"],
                    options=options,
                    correct_answer=q["correct_answer"],
                    explanation=q["explanation"],
                    difficulty=q.get("difficulty", "intermediate"),
                    tags=q.get("tags", [])
                ))

            return questions

        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                print(f"  Retry {attempt + 1}/{max_retries} after error: {e}")
                time.sleep(wait_time)
            else:
                raise


def save_questions(
    questions: list[GeneratedQuestion],
    skill_id: str,
    domain_id: str,
    output_dir: str = "questions/drafts"
):
    """Save generated questions to JSON files."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/{domain_id}_{skill_id}_{timestamp}.json"

    data = {
        "metadata": {
            "skill_id": skill_id,
            "domain_id": domain_id,
            "generated_at": datetime.now().isoformat(),
            "count": len(questions),
            "status": "draft"
        },
        "questions": [asdict(q) for q in questions]
    }

    with open(filename, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(questions)} questions to {filename}")
    return filename


def main():
    import argparse
    from dotenv import load_dotenv

    load_dotenv()

    parser = argparse.ArgumentParser(description="AZ-104 Question Generator")
    parser.add_argument("--skill", help="Generate for specific skill ID (e.g., ig-01)")
    parser.add_argument("--all", action="store_true", help="Generate for all skills")
    parser.add_argument("--count", type=int, default=10, help="Questions per skill")
    parser.add_argument("--model", default=os.getenv("OPENAI_MODEL", "openai/gpt-4o"), help="Model to use")
    parser.add_argument("--skills-file", default="skills-measured/az104-skills.json")
    parser.add_argument("--output-dir", default="questions/drafts")

    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")

    if not api_key:
        print("Set OPENAI_API_KEY environment variable")
        sys.exit(1)

    client_kwargs = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url

    client = OpenAI(**client_kwargs)
    skills_data = load_skills(args.skills_file)

    if args.skill:
        result = get_skill_by_id(skills_data, args.skill)
        if not result:
            print(f"Skill {args.skill} not found")
            sys.exit(1)

        domain = result["domain"]
        skill = result["skill"]

        print(f"Generating {args.count} questions for: {skill['name']}")
        questions = generate_questions(
            client, args.model,
            domain["name"], skill["name"], skill["items"],
            args.count
        )
        save_questions(questions, skill["id"], domain["id"], args.output_dir)

    elif args.all:
        total = 0
        for domain in skills_data["domains"]:
            for skill in domain["skills"]:
                print(f"Generating {args.count} questions for: {skill['name']}")
                questions = generate_questions(
                    client, args.model,
                    domain["name"], skill["name"], skill["items"],
                    args.count
                )
                save_questions(questions, skill["id"], domain["id"], args.output_dir)
                total += len(questions)
                print(f"  → {len(questions)} questions generated")

        print(f"\nTotal: {total} questions generated")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
