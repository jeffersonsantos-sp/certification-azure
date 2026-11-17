import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

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


class LabStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class LabProgressStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    passed = "passed"
    failed = "failed"


class ValidationStatus(str, enum.Enum):
    passed = "passed"
    failed = "failed"
    error = "error"


class LabCheckType(str, enum.Enum):
    resource_exists = "resource_exists"
    resource_count = "resource_count"
    property_equals = "property_equals"
    tag_equals = "tag_equals"
    role_assignment_exists = "role_assignment_exists"
    nsg_rule_exists = "nsg_rule_exists"
    subnet_exists = "subnet_exists"
    policy_assignment_exists = "policy_assignment_exists"
    resource_lock_exists = "resource_lock_exists"
    group_role_assignment_exists = "group_role_assignment_exists"
    virtual_network_peering_exists = "virtual_network_peering_exists"
    load_balancer_probe_exists = "load_balancer_probe_exists"
    manual = "manual"


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
    labs: Mapped[list["Lab"]] = relationship(back_populates="domain")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    domain_id: Mapped[str] = mapped_column(ForeignKey("domains.id"))
    name: Mapped[str] = mapped_column(String(255))
    items: Mapped[dict] = mapped_column(JSONB)

    domain: Mapped["Domain"] = relationship(back_populates="skills")
    questions: Mapped[list["Question"]] = relationship(back_populates="skill")
    labs: Mapped[list["Lab"]] = relationship(back_populates="skill")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"))
    question_text: Mapped[str] = mapped_column(Text)
    question_type: Mapped[str] = mapped_column(String(32), default="single_choice")
    question_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    options: Mapped[list] = mapped_column(JSONB)
    correct_answer: Mapped[Any] = mapped_column(JSONB)
    explanation: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[DifficultyLevel] = mapped_column(SAEnum(DifficultyLevel))
    tags: Mapped[list] = mapped_column(JSONB, default=list)
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
    selected_answer: Mapped[Any] = mapped_column(JSONB)
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


class Lab(Base):
    __tablename__ = "labs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    title: Mapped[dict] = mapped_column(JSONB)
    description: Mapped[dict] = mapped_column(JSONB)
    objectives: Mapped[dict] = mapped_column(JSONB, default=dict)
    prerequisites: Mapped[dict] = mapped_column(JSONB, default=dict)
    cost_warning: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    cleanup_commands: Mapped[list] = mapped_column(JSONB, default=list)
    domain_id: Mapped[str] = mapped_column(ForeignKey("domains.id"))
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"))
    difficulty: Mapped[DifficultyLevel] = mapped_column(SAEnum(DifficultyLevel), default=DifficultyLevel.intermediate)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=30)
    resource_group_name: Mapped[str] = mapped_column(String(90))
    content_version: Mapped[str] = mapped_column(String(20), default="1")
    status: Mapped[LabStatus] = mapped_column(SAEnum(LabStatus), default=LabStatus.draft)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    domain: Mapped["Domain"] = relationship(back_populates="labs")
    skill: Mapped["Skill"] = relationship(back_populates="labs")
    steps: Mapped[list["LabStep"]] = relationship(
        back_populates="lab",
        cascade="all, delete-orphan",
        order_by="LabStep.position",
    )
    checks: Mapped[list["LabCheck"]] = relationship(
        back_populates="lab",
        cascade="all, delete-orphan",
        order_by="LabCheck.position",
    )


class LabStep(Base):
    __tablename__ = "lab_steps"
    __table_args__ = (
        UniqueConstraint("lab_id", "key", name="uq_lab_steps_lab_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("labs.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(80))
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[dict] = mapped_column(JSONB)
    instructions: Mapped[dict] = mapped_column(JSONB)
    commands: Mapped[list] = mapped_column(JSONB, default=list)
    portal_steps: Mapped[dict] = mapped_column(JSONB, default=dict)
    validation_hint: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    lab: Mapped["Lab"] = relationship(back_populates="steps")


class LabCheck(Base):
    __tablename__ = "lab_checks"
    __table_args__ = (
        UniqueConstraint("lab_id", "key", name="uq_lab_checks_lab_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("labs.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(80))
    position: Mapped[int] = mapped_column(Integer)
    name: Mapped[dict] = mapped_column(JSONB)
    description: Mapped[dict] = mapped_column(JSONB)
    check_type: Mapped[LabCheckType] = mapped_column(SAEnum(LabCheckType))
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    weight: Mapped[int] = mapped_column(Integer, default=1)

    lab: Mapped["Lab"] = relationship(back_populates="checks")


class LabProgress(Base):
    __tablename__ = "lab_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "lab_id", name="uq_lab_progress_user_lab"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lab_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("labs.id", ondelete="CASCADE"), index=True)
    status: Mapped[LabProgressStatus] = mapped_column(
        SAEnum(LabProgressStatus),
        default=LabProgressStatus.not_started,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_validated_at: Mapped[datetime | None] = mapped_column(DateTime)
    best_score: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship()
    lab: Mapped["Lab"] = relationship()
    step_progress: Mapped[list["LabStepProgress"]] = relationship(
        back_populates="progress",
        cascade="all, delete-orphan",
    )


class LabStepProgress(Base):
    __tablename__ = "lab_step_progress"
    __table_args__ = (
        UniqueConstraint("lab_progress_id", "step_id", name="uq_lab_step_progress_progress_step"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_progress_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("lab_progress.id", ondelete="CASCADE"),
        index=True,
    )
    step_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("lab_steps.id", ondelete="CASCADE"),
        index=True,
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    progress: Mapped["LabProgress"] = relationship(back_populates="step_progress")
    step: Mapped["LabStep"] = relationship()


class LabValidationRun(Base):
    __tablename__ = "lab_validation_runs"
    __table_args__ = (
        Index("ix_lab_validation_runs_user_lab_created", "user_id", "lab_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lab_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("labs.id", ondelete="CASCADE"))
    subscription_id: Mapped[str] = mapped_column(String(36))
    resource_group: Mapped[str] = mapped_column(String(90))
    status: Mapped[ValidationStatus] = mapped_column(SAEnum(ValidationStatus))
    score_percentage: Mapped[int] = mapped_column(Integer, default=0)
    checks: Mapped[list] = mapped_column(JSONB, default=list)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship()
    lab: Mapped["Lab"] = relationship()


class AzureSettings(Base):
    __tablename__ = "azure_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tenant_id: Mapped[str] = mapped_column(String(36))
    subscription_id: Mapped[str] = mapped_column(String(36))
    subscription_name: Mapped[str] = mapped_column(String(255))
    resource_group_prefix: Mapped[str] = mapped_column(String(50), default="rg-az104-lab")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship()
