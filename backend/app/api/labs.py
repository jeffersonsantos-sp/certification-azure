from collections import defaultdict
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import User, get_current_user
from app.core.azure import (
    AzureAuthContext,
    allowed_subscription_ids,
    get_azure_auth,
)
from app.core.database import get_db
from app.models.models import (
    AzureSettings,
    Lab,
    LabProgress,
    LabProgressStatus,
    LabStatus,
    LabStepProgress,
    LabValidationRun,
    ValidationStatus,
)
from app.services.azure import AzureClient, AzureClientError, LabValidator

router = APIRouter(prefix="/labs", tags=["labs"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AzureAuth = Annotated[AzureAuthContext, Depends(get_azure_auth)]


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class StepProgressUpdate(BaseModel):
    completed: bool = True


class LabValidationRequest(BaseModel):
    subscription_id: str | None = None
    resource_group: str | None = None


def _step_ids(lab: Lab) -> set[UUID]:
    return {step.id for step in lab.steps}


def _progress_payload(
    lab: Lab,
    progress: LabProgress | None,
    completed_step_ids: set[UUID] | None = None,
) -> dict:
    completed = (completed_step_ids or set()) & _step_ids(lab)
    total_steps = len(lab.steps)
    percentage = round((len(completed) / total_steps) * 100) if total_steps else 0

    return {
        "status": progress.status.value if progress else LabProgressStatus.not_started.value,
        "started_at": progress.started_at.isoformat() if progress and progress.started_at else None,
        "completed_at": progress.completed_at.isoformat() if progress and progress.completed_at else None,
        "last_validated_at": (
            progress.last_validated_at.isoformat()
            if progress and progress.last_validated_at
            else None
        ),
        "best_score": progress.best_score if progress else 0,
        "total_steps": total_steps,
        "completed_steps": len(completed),
        "progress_percentage": percentage,
        "all_steps_completed": total_steps > 0 and len(completed) == total_steps,
    }


def _lab_summary(lab: Lab, progress: LabProgress | None, completed_step_ids: set[UUID]) -> dict:
    return {
        "id": str(lab.id),
        "slug": lab.slug,
        "title": lab.title,
        "description": lab.description,
        "domain_id": lab.domain_id,
        "skill_id": lab.skill_id,
        "difficulty": lab.difficulty.value if lab.difficulty else "intermediate",
        "estimated_minutes": lab.estimated_minutes,
        "resource_group_name": lab.resource_group_name,
        "content_version": lab.content_version,
        "status": lab.status.value,
        "sort_order": lab.sort_order,
        "progress": _progress_payload(lab, progress, completed_step_ids),
    }


def _lab_detail(lab: Lab, progress: LabProgress | None, completed_step_ids: set[UUID]) -> dict:
    return {
        "id": str(lab.id),
        "slug": lab.slug,
        "title": lab.title,
        "description": lab.description,
        "objectives": lab.objectives or {},
        "prerequisites": lab.prerequisites or {},
        "cost_warning": lab.cost_warning,
        "cleanup_commands": lab.cleanup_commands or [],
        "domain_id": lab.domain_id,
        "skill_id": lab.skill_id,
        "difficulty": lab.difficulty.value if lab.difficulty else "intermediate",
        "estimated_minutes": lab.estimated_minutes,
        "resource_group_name": lab.resource_group_name,
        "content_version": lab.content_version,
        "status": lab.status.value,
        "sort_order": lab.sort_order,
        "steps": [
            {
                "id": str(step.id),
                "key": step.key,
                "position": step.position,
                "title": step.title,
                "instructions": step.instructions,
                "commands": step.commands or [],
                "validation_hint": step.validation_hint,
                "completed": step.id in completed_step_ids,
            }
            for step in lab.steps
        ],
        "checks": [
            {
                "id": str(check.id),
                "key": check.key,
                "position": check.position,
                "name": check.name,
                "description": check.description,
                "check_type": check.check_type.value,
                "required": check.required,
                "weight": check.weight,
            }
            for check in lab.checks
        ],
        "progress": _progress_payload(lab, progress, completed_step_ids),
    }


async def _get_lab(db: AsyncSession, slug: str) -> Lab:
    result = await db.execute(
        select(Lab)
        .where(Lab.slug == slug, Lab.status == LabStatus.published)
        .options(selectinload(Lab.steps), selectinload(Lab.checks))
    )
    lab = result.scalar_one_or_none()
    if lab is None:
        raise HTTPException(status_code=404, detail="Lab not found")
    return lab


async def _get_progress(
    db: AsyncSession,
    user_id: UUID,
    lab_id: UUID,
) -> LabProgress | None:
    result = await db.execute(
        select(LabProgress)
        .where(LabProgress.user_id == user_id, LabProgress.lab_id == lab_id)
        .options(selectinload(LabProgress.step_progress))
    )
    return result.scalar_one_or_none()


async def _get_completed_step_ids(
    db: AsyncSession,
    progress: LabProgress | None,
) -> set[UUID]:
    if progress is None:
        return set()

    result = await db.execute(
        select(LabStepProgress.step_id).where(
            LabStepProgress.lab_progress_id == progress.id
        )
    )
    return set(result.scalars().all())


@router.get("")
async def list_labs(
    db: DbSession,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(Lab)
        .where(Lab.status == LabStatus.published)
        .options(selectinload(Lab.steps))
        .order_by(Lab.sort_order, Lab.slug)
    )
    labs = result.scalars().all()

    progress_result = await db.execute(
        select(LabProgress).where(LabProgress.user_id == current_user.id)
    )
    progress_by_lab = {progress.lab_id: progress for progress in progress_result.scalars().all()}

    step_rows = await db.execute(
        select(LabStepProgress.lab_progress_id, LabStepProgress.step_id)
        .join(LabProgress)
        .where(LabProgress.user_id == current_user.id)
    )
    completed_by_progress: dict[UUID, set[UUID]] = defaultdict(set)
    for progress_id, step_id in step_rows.all():
        completed_by_progress[progress_id].add(step_id)

    items = []
    for lab in labs:
        progress = progress_by_lab.get(lab.id)
        completed = completed_by_progress.get(progress.id, set()) if progress else set()
        items.append(_lab_summary(lab, progress, completed))

    return {"labs": items, "count": len(items)}


@router.get("/progress/summary")
async def progress_summary(
    db: DbSession,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(Lab)
        .where(Lab.status == LabStatus.published)
        .options(selectinload(Lab.steps))
    )
    labs = result.scalars().all()
    lab_ids = {lab.id for lab in labs}
    total_steps = sum(len(lab.steps) for lab in labs)

    progress_result = await db.execute(
        select(LabProgress).where(LabProgress.user_id == current_user.id)
    )
    progresses = [
        progress
        for progress in progress_result.scalars().all()
        if progress.lab_id in lab_ids
    ]

    step_rows = await db.execute(
        select(LabStepProgress.lab_progress_id, LabStepProgress.step_id)
        .join(LabProgress)
        .where(LabProgress.user_id == current_user.id)
    )
    valid_step_ids = {step.id for lab in labs for step in lab.steps}
    completed_by_progress: dict[UUID, set[UUID]] = defaultdict(set)
    for progress_id, step_id in step_rows.all():
        if step_id in valid_step_ids:
            completed_by_progress[progress_id].add(step_id)

    completed_steps = sum(len(completed_by_progress[progress.id]) for progress in progresses)
    statuses = [progress.status for progress in progresses]

    return {
        "total_labs": len(labs),
        "labs_started": sum(
            1 for status in statuses if status != LabProgressStatus.not_started
        ),
        "labs_in_progress": sum(
            1 for status in statuses if status == LabProgressStatus.in_progress
        ),
        "labs_passed": sum(1 for status in statuses if status == LabProgressStatus.passed),
        "labs_failed": sum(1 for status in statuses if status == LabProgressStatus.failed),
        "labs_not_started": len(labs)
        - sum(1 for status in statuses if status != LabProgressStatus.not_started),
        "total_steps": total_steps,
        "completed_steps": completed_steps,
        "completion_percentage": (
            round((completed_steps / total_steps) * 100) if total_steps else 0
        ),
        "best_score_average": (
            round(sum(progress.best_score for progress in progresses) / len(progresses))
            if progresses
            else 0
        ),
    }


@router.get("/{slug}")
async def get_lab(
    slug: str,
    db: DbSession,
    current_user: CurrentUser,
):
    lab = await _get_lab(db, slug)
    progress = await _get_progress(db, current_user.id, lab.id)
    completed = await _get_completed_step_ids(db, progress)
    return _lab_detail(lab, progress, completed)


@router.post("/{slug}/start")
async def start_lab(
    slug: str,
    db: DbSession,
    current_user: CurrentUser,
):
    lab = await _get_lab(db, slug)
    progress = await _get_progress(db, current_user.id, lab.id)

    if progress is None:
        progress = LabProgress(
            user_id=current_user.id,
            lab_id=lab.id,
            status=LabProgressStatus.in_progress,
            started_at=_utcnow(),
        )
        db.add(progress)
        await db.commit()
        progress = await _get_progress(db, current_user.id, lab.id)
    elif progress.status == LabProgressStatus.not_started:
        progress.status = LabProgressStatus.in_progress
        progress.started_at = _utcnow()
        await db.commit()

    completed = await _get_completed_step_ids(db, progress)
    return _progress_payload(lab, progress, completed)


@router.patch("/{slug}/steps/{step_id}")
async def update_step_progress(
    slug: str,
    step_id: UUID,
    payload: StepProgressUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    lab = await _get_lab(db, slug)
    step = next((item for item in lab.steps if item.id == step_id), None)
    if step is None:
        raise HTTPException(status_code=404, detail="Lab step not found")

    progress = await _get_progress(db, current_user.id, lab.id)
    if progress is None:
        progress = LabProgress(
            user_id=current_user.id,
            lab_id=lab.id,
            status=LabProgressStatus.not_started,
            started_at=_utcnow(),
        )
        db.add(progress)
        await db.flush()

    existing = await db.scalar(
        select(LabStepProgress).where(
            LabStepProgress.lab_progress_id == progress.id,
            LabStepProgress.step_id == step.id,
        )
    )

    if payload.completed and existing is None:
        db.add(
            LabStepProgress(
                lab_progress_id=progress.id,
                step_id=step.id,
                completed_at=_utcnow(),
            )
        )
        if progress.status == LabProgressStatus.not_started:
            progress.status = LabProgressStatus.in_progress
        progress.started_at = progress.started_at or _utcnow()
    elif not payload.completed and existing is not None:
        await db.delete(existing)

    await db.flush()
    remaining = await db.scalar(
        select(func.count())
        .select_from(LabStepProgress)
        .where(LabStepProgress.lab_progress_id == progress.id)
    )
    if remaining == 0 and progress.status == LabProgressStatus.in_progress:
        progress.status = LabProgressStatus.not_started

    progress.updated_at = _utcnow()
    await db.commit()

    progress = await _get_progress(db, current_user.id, lab.id)
    completed = await _get_completed_step_ids(db, progress)
    return _progress_payload(lab, progress, completed)


@router.post("/{slug}/validate")
async def validate_lab(
    slug: str,
    payload: LabValidationRequest,
    db: DbSession,
    current_user: CurrentUser,
    auth: AzureAuth,
):
    lab = await _get_lab(db, slug)
    subscription_id = payload.subscription_id
    if subscription_id is None:
        settings = await db.scalar(
            select(AzureSettings).where(AzureSettings.user_id == current_user.id)
        )
        subscription_id = settings.subscription_id if settings else None
    if not subscription_id:
        raise HTTPException(status_code=400, detail="Select an Azure subscription first")

    try:
        UUID(subscription_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid subscription ID") from exc

    allowed = allowed_subscription_ids()
    if allowed and subscription_id.lower() not in allowed:
        raise HTTPException(status_code=403, detail="Subscription is not allowed")

    resource_group = payload.resource_group or lab.resource_group_name
    async with AzureClient(auth.access_token) as client:
        validator = LabValidator(
            client,
            subscription_id,
            resource_group,
            auth.principal,
        )
        try:
            results = await validator.run(lab.checks)
        except AzureClientError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    total_weight = sum(max(check.weight, 1) for check in lab.checks)
    passed_weight = sum(
        max(check.weight, 1)
        for check, result in zip(lab.checks, results)
        if result["status"] == "passed"
    )
    score = round((passed_weight / total_weight) * 100) if total_weight else 0
    required_failed = any(
        check.required and result["status"] != "passed"
        for check, result in zip(lab.checks, results)
    )
    has_error = any(result["status"] == "error" for result in results)
    passed = not required_failed
    status = ValidationStatus.passed if passed else (
        ValidationStatus.error if has_error else ValidationStatus.failed
    )
    now = _utcnow()

    progress = await _get_progress(db, current_user.id, lab.id)
    if progress is None:
        progress = LabProgress(
            user_id=current_user.id,
            lab_id=lab.id,
            status=LabProgressStatus.not_started,
            started_at=now,
        )
        db.add(progress)
        await db.flush()

    if passed:
        completed = await _get_completed_step_ids(db, progress)
        for step in lab.steps:
            if step.id not in completed:
                db.add(
                    LabStepProgress(
                        lab_progress_id=progress.id,
                        step_id=step.id,
                        completed_at=now,
                    )
                )
        progress.status = LabProgressStatus.passed
        progress.completed_at = now
    else:
        progress.status = LabProgressStatus.failed

    progress.best_score = max(progress.best_score or 0, score)
    progress.last_validated_at = now
    progress.updated_at = now

    run = LabValidationRun(
        user_id=current_user.id,
        lab_id=lab.id,
        subscription_id=subscription_id,
        resource_group=resource_group,
        status=status,
        score_percentage=score,
        checks=results,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    progress = await _get_progress(db, current_user.id, lab.id)
    completed = await _get_completed_step_ids(db, progress)
    return {
        "run_id": str(run.id),
        "status": run.status.value,
        "passed": run.status == ValidationStatus.passed,
        "score_percentage": score,
        "subscription_id": subscription_id,
        "resource_group": resource_group,
        "checks": results,
        "progress": _progress_payload(lab, progress, completed),
    }
