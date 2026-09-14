# CLAUDE.md - AZ-104 Trainer Project

## Project Overview
Intelligent web platform for practicing Microsoft Azure Administrator Associate (AZ-104) certification questions.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Python, FastAPI, SQLAlchemy, Pydantic
- **Database**: PostgreSQL 16, Redis 7
- **DevOps**: Docker, Docker Compose, Nginx

## Project Structure
```
├── frontend/          # React application
├── backend/           # FastAPI application
├── scripts/           # Utility scripts
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
```

### Database
```bash
# Connect to PostgreSQL
docker exec -it azure-postgres-1 psql -U postgres -d az104_trainer

# Check Redis
docker exec -it azure-redis-1 redis-cli
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

## API Conventions
- Base URL: `/api/v1/`
- Use JSON for request/response
- Implement proper error handling
- Use JWT for authentication
- Follow RESTful principles

## Database Schema
- **users**: User accounts
- **questions**: Question bank
- **answers**: User answers
- **domains**: Certification domains
- **skills**: Specific skills within domains

## Security Notes
- Never commit `.env` files
- Use environment variables for secrets
- Implement proper CORS configuration
- Validate all user input
- Use parameterized queries
