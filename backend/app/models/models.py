import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class DifficultyLevel(str, enum.Enum):
    easy = "easy"
    intermediate = "intermediate"
    advanced = "advanced"


class QuestionStatus(str, enum.Enum):
    draft = "draft"
    review = "review"
    approved = "approved"
    published = "published"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    answers: Mapped[list["UserAnswer"]] = relationship(back_populates="user")


class Domain(Base):
    __tablename__ = "domains"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    weight: Mapped[str] = mapped_column(String(20))

    skills: Mapped[list["Skill"]] = relationship(back_populates="domain")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    domain_id: Mapped[str] = mapped_column(ForeignKey("domains.id"))
    name: Mapped[str] = mapped_column(String(255))
    items: Mapped[dict] = mapped_column(JSONB)

    domain: Mapped["Domain"] = relationship(back_populates="skills")
    questions: Mapped[list["Question"]] = relationship(back_populates="skill")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"))
    question_text: Mapped[str] = mapped_column(Text)
    options: Mapped[dict] = mapped_column(JSONB)
    correct_answer: Mapped[str] = mapped_column(String(1))
    explanation: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[DifficultyLevel] = mapped_column(SAEnum(DifficultyLevel))
    tags: Mapped[dict] = mapped_column(JSONB, default=list)
    reference_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[QuestionStatus] = mapped_column(SAEnum(QuestionStatus), default=QuestionStatus.draft)
    validated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    validated_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    skill: Mapped["Skill"] = relationship(back_populates="questions")
    answers: Mapped[list["UserAnswer"]] = relationship(back_populates="question")


class UserAnswer(Base):
    __tablename__ = "user_answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id"))
    selected_answer: Mapped[str] = mapped_column(String(1))
    is_correct: Mapped[bool] = mapped_column(Boolean)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship(back_populates="answers")


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0)
    score_percentage: Mapped[float | None] = mapped_column(Integer)
    is_mock_exam: Mapped[bool] = mapped_column(Boolean, default=False)
