# Database Expert Skill

## Purpose
Assist with PostgreSQL database design, optimization, and management.

## When to Use
- When designing database schemas
- When optimizing queries
- When debugging database issues
- When implementing migrations

## Instructions

1. **Schema Design**:
   - Use proper normalization (3NF)
   - Define appropriate data types
   - Create indexes for frequently queried columns
   - Implement foreign key constraints
   - Use UUID for primary keys when appropriate

2. **Query Optimization**:
   - Use EXPLAIN ANALYZE for query plans
   - Avoid N+1 query problems
   - Use connection pooling
   - Implement proper pagination
   - Use bulk operations for large datasets

3. **Security Best Practices**:
   - Use parameterized queries
   - Implement row-level security
   - Encrypt sensitive data
   - Use proper authentication
   - Audit database access

4. **Migration Strategy**:
   - Use Alembic for migrations
   - Test migrations before production
   - Implement rollback procedures
   - Document schema changes
   - Use version control for migrations

## Advanced Question Schema

`questions` uses JSONB for format-flexible data:

- `question_type`: `single_choice`, `multiple_choice`, `case_study`, `drag_drop`, or `hotspot`
- `question_data`: JSONB object with `scenario`, `instructions`, `image_url`, and/or `regions`
- `correct_answer`: JSONB string for single/case/hotspot, JSONB array for multiple/drag
- `user_answers.selected_answer`: JSONB, matching the same answer shapes

Hotspot region coordinates are percentages relative to the image:

```json
{
  "id": "private-endpoint",
  "label": "Private endpoint",
  "x": 37.5,
  "y": 47.62,
  "width": 25,
  "height": 14.29
}
```

Use `scripts/migrate_advanced_formats.py` for existing databases. It is idempotent and converts legacy `varchar` answer columns to JSONB with `to_jsonb`.

## Lab Schema

The Azure labs feature adds:

- `labs`: bilingual JSONB content, domain/skill links, difficulty, resource group, cleanup commands and status
- `lab_steps`: unique `(lab_id, key)` with ordered bilingual instructions, `portal_steps` (Portal do Azure) and CLI `commands`
- `lab_checks`: unique `(lab_id, key)` with typed validation config and JSONB result config
- `lab_progress`: unique `(user_id, lab_id)` status and best score
- `lab_step_progress`: unique `(lab_progress_id, step_id)`
- `lab_validation_runs`: JSONB check results and validation history
- `azure_settings`: selected tenant/subscription metadata, never tokens

`scripts/import_labs.py` reads `labs/*.yaml` and upserts using deterministic UUIDs based on lab/step/check keys, so re-imports are idempotent and preserve progress references.

Lab check types currently supported: `resource_exists`, `resource_count`, `property_equals`, `tag_equals`, `role_assignment_exists`, `group_role_assignment_exists`, `nsg_rule_exists`, `subnet_exists`, `policy_assignment_exists`, `resource_lock_exists`, `virtual_network_peering_exists`, `load_balancer_probe_exists`, `app_service_slot_exists`, `backup_protected_vm_exists`, `file_share_exists`, `route_exists`, `manual`.

For existing databases, run:

```bash
python scripts/migrate_advanced_formats.py
python scripts/migrate_lab_checks.py
python scripts/migrate_lab_portal_steps.py
python scripts/import_labs.py
```

## SQLAlchemy Patterns

### Model Definition
```python
from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from typing import Any
from uuid import UUID, uuid4

class Question(Base):
    __tablename__ = "questions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    skill_id: Mapped[str] = mapped_column(String(50))
    question_text: Mapped[str] = mapped_column(Text)
    question_type: Mapped[str] = mapped_column(String(32), default="single_choice")
    question_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    options: Mapped[list] = mapped_column(JSONB)
    correct_answer: Mapped[Any] = mapped_column(JSONB)
    explanation: Mapped[str] = mapped_column(Text)
```

### Query Patterns
```python
# Pagination
async def get_questions(db: AsyncSession, skip: int = 0, limit: int = 20):
    result = await db.execute(
        select(Question)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

# Filtering
async def get_by_domain(db: AsyncSession, domain_id: str):
    result = await db.execute(
        select(Question)
        .where(Question.domain_id == domain_id)
    )
    return result.scalars().all()
```

## Performance Monitoring
- Use pg_stat_statements for query analysis
- Monitor connection pool usage
- Track slow queries
- Analyze index usage
- Monitor disk I/O
