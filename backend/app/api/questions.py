from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import User, get_optional_current_user
from app.core.database import get_db
from app.models.models import (
    DifficultyLevel,
    Domain,
    Question,
    QuestionStatus,
    Skill,
    UserAnswer,
)

router = APIRouter(prefix="/questions", tags=["questions"])


class AnswerRequest(BaseModel):
    answer: Any


class ExamAnswer(BaseModel):
    question_id: UUID
    answer: Any


class ExamSubmitRequest(BaseModel):
    answers: list[ExamAnswer]


def _normalise_answer(question: Question, answer: Any) -> Any:
    question_type = question.question_type or "single_choice"

    if question_type == "multiple_choice":
        if isinstance(answer, str):
            values = [answer]
        elif isinstance(answer, (list, tuple, set)):
            values = list(answer)
        else:
            values = []
        return sorted({str(value).upper() for value in values if str(value).strip()})
    if question_type == "drag_drop":
        return [str(value) for value in answer] if isinstance(answer, (list, tuple)) else []
    if question_type == "hotspot":
        return str(answer) if answer is not None else ""
    return str(answer).upper() if answer is not None else ""


def _is_correct(question: Question, answer: Any) -> bool:
    question_type = question.question_type or "single_choice"
    selected = _normalise_answer(question, answer)
    correct = question.correct_answer

    if question_type == "multiple_choice":
        if not isinstance(correct, (list, tuple)):
            return False
        expected = sorted({str(value).upper() for value in correct})
        return bool(selected) and selected == expected
    if question_type == "drag_drop":
        if not isinstance(correct, (list, tuple)):
            return False
        return bool(selected) and selected == [str(value) for value in correct]
    if question_type == "hotspot":
        return bool(selected) and selected == str(correct)
    return bool(selected) and selected == str(correct).upper()


def _question_payload(question: Question) -> dict:
    options = [
        {"label": option.get("label", ""), "text": option.get("text", "")}
        for option in (question.options or [])
    ]
    return {
        "id": str(question.id),
        "skill_id": question.skill_id,
        "question_text": question.question_text,
        "question_type": question.question_type or "single_choice",
        "question_data": question.question_data or {},
        "options": options,
        "difficulty": question.difficulty.value if question.difficulty else "intermediate",
        "tags": question.tags or [],
    }


@router.get("/")
async def list_questions(
    skill_id: str | None = None,
    domain_id: str | None = None,
    difficulty: str | None = None,
    limit: int = 20,
    offset: int = 0,
    random_order: bool = False,
    db: AsyncSession = Depends(get_db),
):
    query = select(Question).where(Question.status == QuestionStatus.approved)

    if skill_id:
        query = query.where(Question.skill_id == skill_id)
    if domain_id:
        query = query.join(Skill).where(Skill.domain_id == domain_id)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)

    if random_order:
        query = query.order_by(func.random())

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    questions = result.scalars().all()

    return {
        "questions": [_question_payload(question) for question in questions],
        "count": len(questions)
    }


@router.get("/random")
async def get_random_questions(
    count: int = 10,
    domain_id: str | None = None,
    difficulty: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get random questions for practice/mock exam without revealing answers."""
    query = select(Question).where(Question.status == QuestionStatus.approved)

    if domain_id:
        query = query.join(Skill).where(Skill.domain_id == domain_id)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)

    query = query.order_by(func.random()).limit(count)
    result = await db.execute(query)
    questions = result.scalars().all()

    return {
        "questions": [_question_payload(question) for question in questions],
        "count": len(questions)
    }


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get overall statistics."""
    total_query = select(func.count()).select_from(Question).where(Question.status == QuestionStatus.approved)
    total_result = await db.execute(total_query)
    total_questions = total_result.scalar()

    domain_stats = []
    domains_result = await db.execute(select(Domain))
    domains = domains_result.scalars().all()

    for domain in domains:
        count_query = (
            select(func.count())
            .select_from(Question)
            .join(Skill)
            .where(Skill.domain_id == domain.id)
            .where(Question.status == QuestionStatus.approved)
        )
        count_result = await db.execute(count_query)
        count = count_result.scalar()
        domain_stats.append({
            "id": domain.id,
            "name": domain.name,
            "weight": domain.weight,
            "question_count": count
        })

    difficulty_stats = []
    for diff in DifficultyLevel:
        count_query = (
            select(func.count())
            .select_from(Question)
            .where(Question.difficulty == diff)
            .where(Question.status == QuestionStatus.approved)
        )
        count_result = await db.execute(count_query)
        count = count_result.scalar()
        difficulty_stats.append({
            "difficulty": diff.value,
            "count": count
        })

    return {
        "total_questions": total_questions,
        "domains": domain_stats,
        "difficulties": difficulty_stats,
    }


@router.post("/submit-exam")
async def submit_exam(
    request: ExamSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Score a complete practice or mock exam in a single request."""
    if not request.answers:
        raise HTTPException(status_code=400, detail="No answers submitted")
    if len(request.answers) > 200:
        raise HTTPException(status_code=400, detail="Too many answers submitted")

    question_ids = list({answer.question_id for answer in request.answers})
    result = await db.execute(select(Question).where(Question.id.in_(question_ids)))
    questions = {question.id: question for question in result.scalars().all()}

    if len(questions) != len(question_ids):
        raise HTTPException(status_code=404, detail="One or more questions were not found")

    results = []
    correct_count = 0

    for item in request.answers:
        question = questions[item.question_id]
        selected = _normalise_answer(question, item.answer)
        is_correct = _is_correct(question, item.answer)
        if is_correct:
            correct_count += 1

        if current_user and selected:
            db.add(UserAnswer(
                user_id=current_user.id,
                question_id=question.id,
                selected_answer=selected,
                is_correct=is_correct,
            ))

        results.append({
            "question_id": str(question.id),
            "question_type": question.question_type or "single_choice",
            "selected": selected,
            "correct": is_correct,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
        })

    if current_user:
        await db.commit()

    total = len(results)
    return {
        "total": total,
        "correct": correct_count,
        "score_percentage": round((correct_count / total) * 100, 1) if total else 0,
        "results": results,
    }


@router.get("/{question_id}")
async def get_question(question_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return _question_payload(question)


@router.post("/{question_id}/answer")
async def submit_answer(
    question_id: UUID,
    request: AnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    selected = _normalise_answer(question, request.answer)
    is_correct = _is_correct(question, request.answer)

    if current_user and selected:
        user_answer = UserAnswer(
            user_id=current_user.id,
            question_id=question_id,
            selected_answer=selected,
            is_correct=is_correct,
        )
        db.add(user_answer)
        await db.commit()

    return {
        "correct": is_correct,
        "question_type": question.question_type or "single_choice",
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
    }
