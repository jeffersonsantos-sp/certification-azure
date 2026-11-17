#!/usr/bin/env python3
"""
Import bilingual lab definitions from YAML files into PostgreSQL.
"""

import argparse
import asyncio
import sys
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

import yaml
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.database import Base, async_session, engine
from app.models.models import (
    DifficultyLevel,
    Domain,
    Lab,
    LabCheck,
    LabCheckType,
    LabStatus,
    LabStep,
    Skill,
)

LOCALES = ("en", "pt-BR")
DEFAULT_LABS_DIR = PROJECT_ROOT / "labs"
LAB_NAMESPACE = "az104-lab"


def stable_id(*parts: str):
    return uuid5(NAMESPACE_URL, ":".join((LAB_NAMESPACE, *parts)))


def require_locales(value: dict, field: str, slug: str) -> None:
    if not isinstance(value, dict):
        raise TypeError(f"{slug}: {field} must be an object with en and pt-BR keys")
    missing = [locale for locale in LOCALES if locale not in value]
    if missing:
        raise ValueError(f"{slug}: {field} is missing locales: {', '.join(missing)}")
    for locale in LOCALES:
        if not isinstance(value[locale], (str, list)):
            raise TypeError(f"{slug}: {field}.{locale} must be a string or list")


def load_lab(path: Path) -> dict:
    data = yaml.safe_load(path.read_text())
    if not isinstance(data, dict):
        raise TypeError(f"{path}: lab file must contain a YAML object")

    required = ("slug", "title", "description", "domain_id", "skill_id", "resource_group_name")
    missing = [field for field in required if not data.get(field)]
    if missing:
        raise ValueError(f"{path}: missing required fields: {', '.join(missing)}")

    slug = data["slug"]
    for field in ("title", "description", "objectives", "prerequisites"):
        if field in data:
            require_locales(data[field], field, slug)
    if data.get("cost_warning") is not None:
        require_locales(data["cost_warning"], "cost_warning", slug)

    for collection in ("steps", "checks", "cleanup_commands"):
        if not isinstance(data.get(collection, []), list):
            raise TypeError(f"{slug}: {collection} must be a list")

    step_keys = set()
    for step in data.get("steps", []):
        key = step.get("key")
        if not key or key in step_keys:
            raise ValueError(f"{slug}: every step needs a unique key")
        step_keys.add(key)
        for field in ("title", "instructions"):
            require_locales(step.get(field), f"steps[{key}].{field}", slug)
        if step.get("validation_hint") is not None:
            require_locales(step["validation_hint"], f"steps[{key}].validation_hint", slug)
        if step.get("portal_steps") is not None:
            require_locales(step["portal_steps"], f"steps[{key}].portal_steps", slug)
        if not isinstance(step.get("position"), int):
            raise TypeError(f"{slug}: steps[{key}].position must be an integer")
        if not isinstance(step.get("commands", []), list):
            raise TypeError(f"{slug}: steps[{key}].commands must be a list")

    check_keys = set()
    for check in data.get("checks", []):
        key = check.get("key")
        if not key or key in check_keys:
            raise ValueError(f"{slug}: every check needs a unique key")
        check_keys.add(key)
        for field in ("name", "description"):
            require_locales(check.get(field), f"checks[{key}].{field}", slug)
        if not isinstance(check.get("position"), int):
            raise TypeError(f"{slug}: checks[{key}].position must be an integer")
        try:
            LabCheckType(check.get("check_type"))
        except ValueError as exc:
            raise ValueError(f"{slug}: checks[{key}] has an invalid check_type") from exc
        if not isinstance(check.get("config", {}), dict):
            raise TypeError(f"{slug}: checks[{key}].config must be an object")

    return data


async def upsert_lab(session, data: dict) -> tuple[Lab, int, int]:
    slug = data["slug"]
    domain = await session.get(Domain, data["domain_id"])
    if domain is None:
        raise ValueError(f"{slug}: domain {data['domain_id']} not found; seed domains first")
    skill = await session.get(Skill, data["skill_id"])
    if skill is None:
        raise ValueError(f"{slug}: skill {data['skill_id']} not found; seed skills first")
    if skill.domain_id != domain.id:
        raise ValueError(f"{slug}: skill {skill.id} does not belong to domain {domain.id}")

    lab = await session.scalar(select(Lab).where(Lab.slug == slug))
    if lab is None:
        lab = Lab(id=stable_id("lab", slug), slug=slug)
        session.add(lab)

    lab.title = data["title"]
    lab.description = data["description"]
    lab.objectives = data.get("objectives", {})
    lab.prerequisites = data.get("prerequisites", {})
    lab.cost_warning = data.get("cost_warning")
    lab.cleanup_commands = data.get("cleanup_commands", [])
    lab.domain_id = domain.id
    lab.skill_id = skill.id
    lab.difficulty = DifficultyLevel(data.get("difficulty", "intermediate"))
    lab.estimated_minutes = int(data.get("estimated_minutes", 30))
    lab.resource_group_name = data["resource_group_name"]
    lab.content_version = str(data.get("content_version", "1"))
    lab.status = LabStatus(data.get("status", "draft"))
    lab.sort_order = int(data.get("sort_order", 0))

    existing_steps = {
        step.key: step
        for step in (
            await session.scalars(select(LabStep).where(LabStep.lab_id == lab.id))
        ).all()
    }
    seen_steps = set()
    for item in data.get("steps", []):
        key = item["key"]
        seen_steps.add(key)
        step = existing_steps.get(key)
        if step is None:
            step = LabStep(id=stable_id("lab", slug, "step", key), lab_id=lab.id, key=key)
            session.add(step)
        step.position = item["position"]
        step.title = item["title"]
        step.instructions = item["instructions"]
        step.commands = item.get("commands", [])
        step.portal_steps = item.get("portal_steps", {})
        step.validation_hint = item.get("validation_hint")
    for key, step in existing_steps.items():
        if key not in seen_steps:
            await session.delete(step)

    existing_checks = {
        check.key: check
        for check in (
            await session.scalars(select(LabCheck).where(LabCheck.lab_id == lab.id))
        ).all()
    }
    seen_checks = set()
    for item in data.get("checks", []):
        key = item["key"]
        seen_checks.add(key)
        check = existing_checks.get(key)
        if check is None:
            check = LabCheck(id=stable_id("lab", slug, "check", key), lab_id=lab.id, key=key)
            session.add(check)
        check.position = item["position"]
        check.name = item["name"]
        check.description = item["description"]
        check.check_type = LabCheckType(item["check_type"])
        check.config = item.get("config", {})
        check.required = bool(item.get("required", True))
        check.weight = int(item.get("weight", 1))
    for key, check in existing_checks.items():
        if key not in seen_checks:
            await session.delete(check)

    return lab, len(seen_steps), len(seen_checks)


async def import_labs(labs_dir: Path) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    files = sorted(labs_dir.glob("*.yaml"))
    if not files:
        raise FileNotFoundError(f"No YAML lab files found in {labs_dir}")

    imported = 0
    failed = 0
    async with async_session() as session:
        for path in files:
            try:
                data = load_lab(path)
                lab, step_count, check_count = await upsert_lab(session, data)
                await session.commit()
                print(f"Imported {lab.slug}: {step_count} steps, {check_count} checks")
                imported += 1
            except (KeyError, TypeError, ValueError, SQLAlchemyError, yaml.YAMLError) as exc:
                await session.rollback()
                print(f"Error importing {path.name}: {exc}")
                failed += 1

        total_labs = await session.scalar(select(func.count()).select_from(Lab))
        total_steps = await session.scalar(select(func.count()).select_from(LabStep))
        total_checks = await session.scalar(select(func.count()).select_from(LabCheck))

    print(f"\nImported: {imported}; failed: {failed}")
    print(f"Database totals: {total_labs} labs, {total_steps} steps, {total_checks} checks")
    if failed:
        raise SystemExit(1)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Import AZ-104 lab YAML files")
    parser.add_argument(
        "--labs-dir",
        type=Path,
        default=DEFAULT_LABS_DIR,
        help="Directory containing lab YAML files",
    )
    args = parser.parse_args()
    await import_labs(args.labs_dir)


if __name__ == "__main__":
    asyncio.run(main())
