<div align="center">

# ☁️ AZ-104 Trainer

### Intelligent Web Platform for Microsoft Azure Administrator Associate Certification

![Azure](https://img.shields.io/badge/Microsoft%20Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📋 Table of Contents

- [Screenshots](#-screenshots)
- [About](#-about)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [AZ-104 Certification Domains](#-az-104-certification-domains)
- [AI Question Generation](#-ai-question-generation)
- [Internationalization](#-internationalization)
- [Skills & Prompts](#-skills--prompts)
- [Contributing](#-contributing)
- [Author](#-author)

---

## 📸 Screenshots

### Dashboard
![Dashboard](image/1.png)

### Practice Mode
![Practice Mode](image/2.png)

### Mock Exam
![Mock Exam](image/3.png)

---

## 🎯 About

**AZ-104 Trainer** is a full-stack web application designed to help IT professionals prepare for the **Microsoft Azure Administrator Associate (AZ-104)** certification exam.

This platform goes beyond a traditional question bank by providing:

- **542+ Practice Questions** across 5 certification domains
- **AI-Powered Explanations** for every answer
- **Mock Exams** that simulate the real certification experience
- **Performance Analytics** with domain-specific insights
- **Internationalization (i18n)** supporting English and Portuguese (PT-BR)

The project demonstrates practical skills in **Cloud Architecture**, **DevOps**, **Full-Stack Development**, and **AI Integration**.

---

## ✨ Key Features

### 📝 Question Bank
- 542+ carefully crafted questions
- Organized by 5 AZ-104 certification domains
- Multiple difficulty levels (Easy, Intermediate, Advanced)
- Detailed explanations for every answer
- Tags and references to official documentation

### 🎯 Practice Mode
- Study by domain with targeted questions
- Choose difficulty level
- Select number of questions (5-30)
- Learning mode (see answers immediately) or Exam mode (answers at the end)
- Real-time score tracking

### 🧪 Mock Exam
- Timed exams (60/90/120 minutes)
- Configurable number of questions (40/50/60)
- Randomized question order
- Question navigator for easy navigation
- Detailed performance breakdown by skill
- Pass/fail scoring (70% threshold)

### 📊 Performance Dashboard
- Total questions answered
- Domain-specific progress bars
- Approved questions count
- Quick action buttons for Practice and Mock Exam

### 🌍 Internationalization
- Full EN/PT-BR support
- Language selector in header
- Persistent language preference (localStorage)
- All UI elements translated

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI Framework |
| TypeScript | 5.9 | Type Safety |
| Tailwind CSS | 3.4 | Styling |
| Vite | 5.0 | Build Tool |
| React Router | 6.21 | Routing |
| Axios | 1.6 | HTTP Client |
| Recharts | 2.10 | Charts |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Runtime |
| FastAPI | 0.109+ | API Framework |
| SQLAlchemy | 2.0 | ORM |
| Alembic | 1.13 | Migrations |
| Pydantic | 2.0 | Data Validation |

### Database & Cache
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 16 | Primary Database |
| Redis | 7 | Caching & Sessions |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container Orchestration |
| Nginx | Frontend Serving & Reverse Proxy |

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────────┐
                    │           USUÁRIO               │
                    │        Navegador Web            │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │        FRONTEND (React)         │
                    │      Porta: 3000 (Nginx)        │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │       BACKEND (FastAPI)         │
                    │        Porta: 8000              │
                    └───────┬───────────────┬─────────┘
                            │               │
                ┌───────────┴───┐   ┌───────┴─────────┐
                ▼               ▼   ▼                  ▼
        ┌──────────────┐ ┌──────────────┐    ┌──────────────┐
        │  PostgreSQL  │ │    Redis     │    │  OpenAI API  │
        │   (Dados)    │ │   (Cache)    │    │   (IA)       │
        │  Porta: 5432 │ │  Porta: 6379 │    │              │
        └──────────────┘ └──────────────┘    └──────────────┘
```

---

## 📁 Project Structure

```
certification-azure/
│
├── frontend/                          # React Frontend
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   ├── context/                  # React contexts
│   │   │   └── LanguageContext.tsx   # i18n context provider
│   │   ├── i18n/                     # Internationalization
│   │   │   ├── en.ts                 # English translations
│   │   │   ├── pt.ts                 # Portuguese translations
│   │   │   └── index.ts              # i18n utilities
│   │   ├── pages/                    # Page components
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── Practice.tsx          # Practice mode
│   │   │   ├── MockExam.tsx          # Mock exam mode
│   │   │   └── QuestionView.tsx      # Single question view
│   │   ├── services/                 # API services
│   │   │   └── api.ts                # Axios API client
│   │   ├── App.tsx                   # Main app with routing
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── Dockerfile                    # Multi-stage Docker build
│   ├── nginx.conf                    # Nginx configuration
│   └── package.json                  # Node.js dependencies
│
├── backend/                           # FastAPI Backend
│   ├── app/
│   │   ├── api/                      # API routes
│   │   │   ├── auth.py               # Authentication endpoints
│   │   │   └── questions.py          # Questions endpoints
│   │   ├── core/                     # Core configuration
│   │   │   ├── config.py             # App settings
│   │   │   └── database.py           # Database connection
│   │   ├── models/                   # SQLAlchemy models
│   │   │   └── models.py             # Database models
│   │   └── main.py                   # FastAPI app entry
│   ├── questions/                    # Question data (JSON)
│   ├── Dockerfile                    # Backend Docker image
│   └── requirements.txt              # Python dependencies
│
├── scripts/                           # Utility scripts
│   ├── generate.py                   # AI question generation
│   ├── generate-batch.sh             # Batch generation script
│   ├── import_questions.py           # Question importer
│   └── validate.py                   # Question validator
│
├── skills-measured/                   # AZ-104 exam data
│   ├── az104-skills.json             # Official skills breakdown
│   └── PIPELINE.md                   # Generation pipeline docs
│
├── questions/                         # Generated questions
│   └── drafts/                       # Draft questions by domain
│
├── .opencode/                         # OpenCode AI Skills
│   ├── config.json                   # Project configuration
│   └── skills/                       # AI assistant skills
│       ├── question-generator.md     # Question generation skill
│       ├── code-reviewer.md          # Code review skill
│       ├── docker-expert.md          # Docker expertise
│       ├── api-designer.md           # API design skill
│       └── frontend-builder.md       # Frontend development
│
├── .claude/                           # Claude AI Skills
│   ├── CLAUDE.md                     # Project context for Claude
│   └── skills/                       # Claude-specific skills
│       ├── az104-domain-expert.md    # AZ-104 domain knowledge
│       └── database-expert.md        # Database expertise
│
├── brainstore/                        # Brainstorm Documents
│   └── brainstorm.md                 # Project planning & decisions
│
├── prompts/                           # AI Prompts
│   └── README.md                     # Collection of AI prompts
│
├── image/                             # Project Screenshots
│   ├── 1.png                         # Dashboard screenshot
│   ├── 2.png                         # Practice mode screenshot
│   └── 3.png                         # Mock exam screenshot
│
├── docker-compose.yml                 # Multi-container setup
├── .env.example                       # Environment template
├── .gitignore                         # Git ignore rules
└── README.md                          # This file
```

---

## ⚠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Node.js** (v18+) and **npm** (v9+) — for local frontend development
- **Python** (v3.11+) — for local backend development
- **Git** (v2.30+)

---

## 🚀 Installation

### Option 1: Docker (Recommended)

This is the easiest way to run the entire application:

```bash
# Clone the repository
git clone git@github.com:jeffersonsantos-sp/certification-azure.git
cd certification-azure

# Start all services
docker compose up -d

# Access the application
open http://localhost:3000
```

**Services will be available at:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Docs (Swagger): `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Option 2: Local Development

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env with your settings

# Run the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# OpenRouter / AI Configuration
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free

# PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/az104_trainer

# Redis
REDIS_URL=redis://localhost:6379/0

# Environment
ENVIRONMENT=development
DEBUG=true
```

---

## 🏃 Running the Application

### Docker Compose Commands

```bash
# Start all services (detached)
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild images
docker compose build --no-cache

# Check service status
docker compose ps
```

### Development Commands

```bash
# Frontend
cd frontend
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npm run lint         # Run ESLint

# Backend
cd backend
uvicorn app.main:app --reload     # Hot reload
```

---

## 📡 API Documentation

### Interactive Docs

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### API Endpoints

#### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/questions/` | List questions (with filters) |
| `GET` | `/api/v1/questions/random` | Get random questions |
| `GET` | `/api/v1/questions/{id}` | Get single question |
| `POST` | `/api/v1/questions/{id}/answer` | Submit answer |
| `GET` | `/api/v1/questions/stats` | Get statistics |

---

## 📚 AZ-104 Certification Domains

The application covers all 5 domains of the Microsoft Azure Administrator Associate exam:

| Domain | Weight | Questions | Focus |
|--------|--------|-----------|-------|
| Identity & Governance | 20-25% | 260 | Microsoft Entra ID, RBAC, Policy |
| Storage | 15-20% | 88 | Storage Accounts, Blob, Azure Files |
| Compute | 20-25% | 90 | VMs, ARM templates, Containers |
| Networking | 15-20% | 69 | VNets, NSGs, Load Balancers |
| Monitoring | 10-15% | 35 | Azure Monitor, Backup, Recovery |

---

## 🤖 AI Question Generation

The project includes scripts for AI-powered question generation:

```bash
# Generate questions for a specific skill
python scripts/generate.py --skill ig-01 --count 10

# Batch generate for multiple skills
bash scripts/generate-batch.sh

# Validate generated questions
python scripts/validate.py --file questions/drafts/ig-01.json

# Import questions to database
python scripts/import_questions.py --file questions/drafts/ig-01.json
```

---

## 🌍 Internationalization (i18n)

The application supports multiple languages:

- **English (EN)** — Default
- **Português (PT-BR)**

### Adding a New Language

1. Create a new translation file in `frontend/src/i18n/`:
   ```typescript
   // frontend/src/i18n/es.ts
   import type { Translations } from './en'
   
   const es: Translations = {
     lang: 'es',
     langLabel: 'Español',
     langFlag: '🇪🇸',
     // ... translations
   }
   
   export default es
   ```

2. Register the language in `frontend/src/i18n/index.ts`:
   ```typescript
   import es from './es'
   
   export const languages = {
     en,
     'pt-BR': pt,
     es,  // Add here
   } as const
   ```

---

## 🧠 Skills & Prompts

### OpenCode Skills

The project includes AI assistant skills in `.opencode/skills/`:

| Skill | Purpose |
|-------|---------|
| `question-generator.md` | Generate AZ-104 certification questions |
| `code-reviewer.md` | Review code quality and security |
| `docker-expert.md` | Docker and containerization guidance |
| `api-designer.md` | RESTful API design best practices |
| `frontend-builder.md` | React frontend development |

### Claude Skills

Claude-specific skills in `.claude/skills/`:

| Skill | Purpose |
|-------|---------|
| `az104-domain-expert.md` | Deep AZ-104 domain knowledge |
| `database-expert.md` | PostgreSQL and SQLAlchemy expertise |

### AI Prompts

Collection of prompts in `prompts/README.md`:

- **Question Generation**: Create certification practice questions
- **Question Validation**: Verify question accuracy
- **AI Explanation**: Generate student-friendly explanations
- **Study Recommendations**: Personalized study plans
- **Performance Analysis**: Mock exam result analysis
- **Code Review**: Automated code quality checks

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| Questions | 542+ |
| Certification Domains | 5 |
| API Endpoints | 10+ |
| Supported Languages | 2 (EN, PT-BR) |
| Frontend Components | 4 pages |
| Backend Services | FastAPI + PostgreSQL |
| Containerization | Docker + Docker Compose |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Jefferson Santos**

DevOps Engineer | Cloud Engineer | Site Reliability Engineer

```
AWS • Azure • Kubernetes • Terraform • CI/CD • GitOps • Python • AI
```

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/jeffersonsantos-sp)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jeffersonsantos-sp)

---

<div align="center">

**⭐ If this project interests you, consider starring the repository!**

**Build. Practice. Analyze. Improve. Certify. 🚀**

</div>
