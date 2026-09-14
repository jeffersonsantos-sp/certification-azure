from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from uuid import UUID
from pydantic import BaseModel
import random

from app.core.database import get_db
from app.models.models import Question, Skill, Domain, UserAnswer, QuestionStatus, DifficultyLevel
from app.api.auth import get_current_user, User

router = APIRouter(prefix="/questions", tags=["questions"])


class AnswerRequest(BaseModel):
    answer: str


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
        "questions": [
            {
                "id": str(q.id),
                "skill_id": q.skill_id,
                "question_text": q.question_text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "difficulty": q.difficulty.value if q.difficulty else "intermediate",
                "tags": q.tags or [],
            }
            for q in questions
        ],
        "count": len(questions)
    }


@router.get("/random")
async def get_random_questions(
    count: int = 10,
    domain_id: str | None = None,
    difficulty: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get random questions for practice/mock exam."""
    query = select(Question).where(Question.status == QuestionStatus.approved)

    if domain_id:
        query = query.join(Skill).where(Skill.domain_id == domain_id)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)

    query = query.order_by(func.random()).limit(count)
    result = await db.execute(query)
    questions = result.scalars().all()

    return {
        "questions": [
            {
                "id": str(q.id),
                "skill_id": q.skill_id,
                "question_text": q.question_text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "difficulty": q.difficulty.value if q.difficulty else "intermediate",
                "tags": q.tags or [],
            }
            for q in questions
        ],
        "count": len(questions)
    }


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get overall statistics."""
    # Total questions
    total_query = select(func.count()).select_from(Question).where(Question.status == QuestionStatus.approved)
    total_result = await db.execute(total_query)
    total_questions = total_result.scalar()

    # Questions by domain
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

    # Questions by difficulty
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


@router.get("/{question_id}")
async def get_question(question_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return {
        "id": str(question.id),
        "skill_id": question.skill_id,
        "question_text": question.question_text,
        "options": question.options,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "difficulty": question.difficulty.value if question.difficulty else "intermediate",
        "tags": question.tags or [],
    }


@router.post("/{question_id}/answer")
async def submit_answer(
    question_id: UUID,
    request: AnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = request.answer.upper() == question.correct_answer

    user_answer = UserAnswer(
        user_id=current_user.id,
        question_id=question_id,
        selected_answer=request.answer.upper(),
        is_correct=is_correct,
    )
    db.add(user_answer)
    await db.commit()

    return {
        "correct": is_correct,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
    }
