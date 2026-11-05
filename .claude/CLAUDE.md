# CLAUDE.md - AZ-104 Trainer Project

## Project Overview
Intelligent web platform for practicing Microsoft Azure Administrator Associate (AZ-104) certification questions.

Bilingual support (EN/PT-BR) with independent UI and question language settings. Questions are stored in English and translated on demand when the question language is PT-BR.

Question formats: `single_choice`, `multiple_choice`, `case_study`, `drag_drop`, and `hotspot`. Question-type metadata and format-specific data live in JSONB columns; scoring is type-aware and performed server-side.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Python, FastAPI, SQLAlchemy, Pydantic
- **Database**: PostgreSQL 16, Redis 7
- **DevOps**: Docker, Docker Compose, Nginx

## Project Structure
```
├── frontend/          # React application
├── backend/           # FastAPI application
├── scripts/           # Utility and migration scripts
├── skills-measured/   # AZ-104 exam data
├── questions/         # Generated questions
├── brainstore/        # Brainstorm documents
├── prompts/           # AI prompts
└── image/             # Project images
```

## Common Commands

### Development
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && uvicorn app.main:app --reload

# Docker
docker compose up -d
```

### Build & Deploy
```bash
# Build all services
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build frontend

# Build and tag Docker Hub images
docker build -t updateinformatica/az104-frontend:latest frontend
docker build -t updateinformatica/az104-backend:latest backend

# Push images after authenticating to Docker Hub
docker push updateinformatica/az104-frontend:latest
docker push updateinformatica/az104-backend:latest
```

### Database
```bash
# Connect to PostgreSQL
docker exec -it azure-postgres-1 psql -U postgres -d az104_trainer

# Check Redis
docker exec -it azure-redis-1 redis-cli

# Apply advanced-format schema changes to an existing database
python scripts/migrate_advanced_formats.py

# Seed one of each advanced question format
python scripts/seed_advanced_formats.py
```

## Code Style Guidelines

### TypeScript/React
- Use functional components with hooks
- Prefer const over let
- Use meaningful variable names
- Add proper TypeScript types
- Follow Tailwind CSS conventions

### Python
- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions
- Use async/await for async operations
- Handle errors gracefully

### Internationalization
- UI language lives in `frontend/src/i18n/en.ts` and `pt.ts`
- Question language lives in `LanguageContext` as `questionLanguage`
- Translation logic lives in `frontend/src/i18n/questions.ts`
- Keep Azure product names, resource type names, cmdlets, CLI commands, and acronyms in English when translating
- Preserve canonical Azure casing for resource names (for example `Virtual Networks`, not `Redes Virtuais`)
- `frontend/src/i18n/azureTerms.ts` protects those terms with placeholders before calling a translation provider
- Do not translate strings containing backticks or CLI commands (for example ``az group create``)
- Cache translations and always fall back to the original English text
- Advanced-format UI labels live under `questionContent.*` in `en.ts` and `pt.ts`

## API Conventions
- Base URL: `/api/v1/`
- Use JSON for request/response
- Implement proper error handling
- Use JWT for authentication
- Follow RESTful principles
- Read endpoints must not expose `correct_answer`, `explanation`, or option `is_correct`
- `POST /questions/submit-exam` scores complete exams; `POST /questions/{id}/answer` scores one question
- Authentication is optional for practice and exam scoring; a valid JWT persists `UserAnswer` rows
- `_normalise_answer`, `_is_correct`, and `_question_payload` centralize type-aware answer handling

## Database Schema
- **users**: User accounts
- **questions**: Question bank with `question_type` (`single_choice`, `multiple_choice`, `case_study`, `drag_drop`, `hotspot`), JSONB `question_data`, and JSONB `correct_answer`
- **user_answers**: User answers with JSONB `selected_answer`
- **domains**: Certification domains
- **skills**: Specific skills within domains

For multiple-choice and drag-and-drop questions, `correct_answer` is a JSON array. For single-choice, case study, and hotspot questions, it is a string. Hotspot region definitions live in `question_data.regions`; the correct value is a region ID.

## Security Notes
- Never commit `.env` files
- Use environment variables for secrets
- Implement proper CORS configuration
- Validate all user input
- Use parameterized queries
- Keep `bcrypt==4.0.1` pinned for compatibility with `passlib` 1.7.4
