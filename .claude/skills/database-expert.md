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

## SQLAlchemy Patterns

### Model Definition
```python
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import uuid

class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id = Column(String(10), nullable=False)
    question_text = Column(String(1000), nullable=False)
    difficulty = Column(String(20), nullable=False)
    created_at = Column(DateTime, server_default="now()")
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
