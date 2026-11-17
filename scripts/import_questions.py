#!/usr/bin/env python3
"""
Import questions from JSON files into PostgreSQL database.
"""

import json
import asyncio
import sys
from pathlib import Path
from datetime import datetime
from uuid import uuid4

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import async_session, engine, Base
from app.models.models import Question, Domain, Skill, QuestionStatus, DifficultyLevel


DOMAINS = [
    {"id": "identity-governance", "name": "Manage Azure identities and governance", "weight": "20-25%"},
    {"id": "storage", "name": "Implement and manage storage", "weight": "15-20%"},
    {"id": "compute", "name": "Deploy and manage Azure compute resources", "weight": "20-25%"},
    {"id": "networking", "name": "Implement and manage virtual networking", "weight": "15-20%"},
    {"id": "monitoring", "name": "Monitor and maintain Azure resources", "weight": "10-15%"},
]

SKILLS = [
    {"id": "ig-01", "domain_id": "identity-governance", "name": "Manage Microsoft Entra users and groups", "items": ["Create users and groups", "Manage properties", "Manage licenses", "Manage external users", "Configure SSPR"]},
    {"id": "ig-02", "domain_id": "identity-governance", "name": "Manage access to Azure resources", "items": ["Manage built-in roles", "Assign roles", "Interpret assignments"]},
    {"id": "ig-03", "domain_id": "identity-governance", "name": "Manage Azure subscriptions and governance", "items": ["Azure Policy", "Resource locks", "Tags", "Resource groups", "Subscriptions", "Cost management", "Management groups"]},
    {"id": "st-01", "domain_id": "storage", "name": "Configure access to storage", "items": ["Firewalls and VNets", "SAS tokens", "Stored access policies", "Access keys", "Identity-based access"]},
    {"id": "st-02", "domain_id": "storage", "name": "Configure and manage storage accounts", "items": ["Create accounts", "Redundancy", "Object replication", "Encryption", "Storage Explorer"]},
    {"id": "st-03", "domain_id": "storage", "name": "Configure Azure Files and Blob Storage", "items": ["File shares", "Containers", "Storage tiers", "Soft delete", "Snapshots", "Lifecycle management", "Versioning"]},
    {"id": "cm-01", "domain_id": "compute", "name": "Automate deployment with ARM/Bicep", "items": ["Interpret templates", "Modify templates", "Deploy resources", "Export/convert"]},
    {"id": "cm-02", "domain_id": "compute", "name": "Create and configure virtual machines", "items": ["Create VM", "Encryption", "Move VM", "Manage sizes", "Disks", "Availability", "VMSS"]},
    {"id": "cm-03", "domain_id": "compute", "name": "Provision and manage containers", "items": ["Container Registry", "Container Instances", "Container Apps", "Sizing and scaling"]},
    {"id": "cm-04", "domain_id": "compute", "name": "Create and configure App Service", "items": ["App Service plan", "Scaling", "Certificates/TLS", "Custom DNS", "Backup", "Networking", "Deployment slots"]},
    {"id": "vn-01", "domain_id": "networking", "name": "Configure and manage virtual networks", "items": ["VNets and subnets", "VNet peering", "Public IPs", "UDR", "Troubleshoot connectivity"]},
    {"id": "vn-02", "domain_id": "networking", "name": "Configure secure access", "items": ["NSGs and ASGs", "Effective security rules", "Azure Bastion", "Service endpoints", "Private endpoints"]},
    {"id": "vn-03", "domain_id": "networking", "name": "Configure name resolution and load balancing", "items": ["Azure DNS", "Load balancer", "Troubleshoot load balancing"]},
    {"id": "mn-01", "domain_id": "monitoring", "name": "Monitor resources in Azure", "items": ["Metrics", "Log settings", "Query logs", "Alert rules", "Azure Monitor Insights", "Network Watcher"]},
    {"id": "mn-02", "domain_id": "monitoring", "name": "Implement backup and recovery", "items": ["Recovery Services vault", "Backup vault", "Backup policy", "Backup/restore", "Site Recovery", "Failover", "Reports and alerts"]},
]


async def seed_domains_and_skills():
    """Create domains and skills in database."""
    async with async_session() as session:
        # Create domains
        for domain_data in DOMAINS:
            domain = Domain(
                id=domain_data["id"],
                name=domain_data["name"],
                weight=domain_data["weight"]
            )
            await session.merge(domain)

        # Create skills
        for skill_data in SKILLS:
            skill = Skill(
                id=skill_data["id"],
                domain_id=skill_data["domain_id"],
                name=skill_data["name"],
                items=skill_data["items"]
            )
            await session.merge(skill)

        await session.commit()
        print(f"Seeded {len(DOMAINS)} domains and {len(SKILLS)} skills")


def load_question_file(filepath: str) -> dict:
    """Load a question file including metadata."""
    with open(filepath) as handle:
        return json.load(handle)


async def import_questions(questions_dir: str = "questions/drafts", *, include_drafts: bool = False, approve: bool = False):
    """Import all questions from JSON files into database."""
    async with async_session() as session:
        total_imported = 0
        total_skipped = 0

        for filepath in Path(questions_dir).glob("*.json"):
            try:
                document = load_question_file(str(filepath))
                file_status = (document.get("metadata") or {}).get("status", "draft")
                questions_data = document.get("questions", [])
                filename = filepath.stem
                if file_status == "draft" and not include_drafts:
                    print(f"Skipping draft file {filename}; use --include-drafts")
                    continue
                parts = filename.split("_")

                if len(parts) >= 2:
                    domain_id = parts[0]
                    skill_id = parts[1]
                else:
                    print(f"Skipping {filename}: cannot parse domain/skill")
                    total_skipped += 1
                    continue

                for q in questions_data:
                    # Check if question already exists
                    existing = await session.execute(
                        text("SELECT id FROM questions WHERE question_text = :text"),
                        {"text": q["question_text"]}
                    )
                    if existing.first():
                        total_skipped += 1
                        continue

                    # Map difficulty
                    difficulty_map = {
                        "easy": DifficultyLevel.easy,
                        "intermediate": DifficultyLevel.intermediate,
                        "advanced": DifficultyLevel.advanced,
                    }
                    difficulty = difficulty_map.get(q.get("difficulty", "intermediate"), DifficultyLevel.intermediate)

                    question_type = q.get("question_type", "single_choice")
                    correct_answer = q.get("correct_answer", "A")
                    if question_type == "multiple_choice" and isinstance(correct_answer, list):
                        correct_labels = set(correct_answer)
                    elif question_type in ("single_choice", "case_study"):
                        correct_labels = {correct_answer}
                    else:
                        correct_labels = set()

                    options = []
                    for opt in q.get("options", []):
                        options.append({
                            "label": opt["label"],
                            "text": opt["text"],
                            "is_correct": (
                                opt["label"] in correct_labels
                                if question_type in ("single_choice", "case_study", "multiple_choice")
                                else False
                            )
                        })

                    question = Question(
                        id=uuid4(),
                        skill_id=skill_id,
                        question_text=q["question_text"],
                        question_type=question_type,
                        question_data=q.get("question_data", {}),
                        options=options,
                        correct_answer=correct_answer,
                        explanation=q.get("explanation", ""),
                        difficulty=difficulty,
                        tags=q.get("tags", []),
                        reference_url=q.get("reference_url"),
                        status=QuestionStatus.approved if approve else QuestionStatus.draft,
                        created_at=datetime.utcnow()
                    )
                    session.add(question)
                    total_imported += 1

                await session.commit()
                print(f"Imported from {filename}: {len(questions_data)} questions")

            except Exception as e:
                print(f"Error processing {filepath}: {e}")
                await session.rollback()
                total_skipped += 1

        print(f"\nTotal imported: {total_imported}")
        print(f"Total skipped: {total_skipped}")


async def main():
    import argparse

    parser = argparse.ArgumentParser(description="Import questions from JSON files")
    parser.add_argument("--file", help="Import a specific JSON file")
    parser.add_argument("--dir", default="questions/drafts", help="Questions directory")
    parser.add_argument("--include-drafts", action="store_true", help="Include files marked as draft")
    parser.add_argument("--approve", action="store_true", help="Import as approved instead of draft")
    args = parser.parse_args()

    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("\nSeeding domains and skills...")
    await seed_domains_and_skills()

    print("\nImporting questions...")
    if args.file:
        await import_questions(args.file, include_drafts=True, approve=args.approve)
    else:
        await import_questions(args.dir, include_drafts=args.include_drafts, approve=args.approve)

    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
