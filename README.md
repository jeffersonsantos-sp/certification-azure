# ☁️ AZ-104 Trainer

> **An intelligent web platform for practicing questions, simulating exams, analyzing performance, and preparing for the Microsoft Azure Administrator Associate (AZ-104) certification.**

![Azure](https://img.shields.io/badge/Microsoft-Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Python](https://img.shields.io/badge/Python-FastAPI-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Terraform](https://img.shields.io/badge/IaC-Terraform-844FBA?style=for-the-badge&logo=terraform&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)

---

# 🎯 Project Overview

**AZ-104 Trainer** is a web application designed to help Azure professionals, Cloud Engineers, DevOps Engineers, and students prepare for the **Microsoft Azure Administrator Associate (AZ-104)** certification.

The application goes beyond a traditional question bank by providing:

- 📝 Practice questions
- 🧪 Mock exams
- 🤖 AI-powered explanations
- 📊 Performance analytics
- 🎯 Knowledge-gap detection
- 🔄 Smart review and spaced repetition
- 🗺️ Personalized study recommendations
- 🏆 Gamification and achievements

The main goal is to answer one important question:

> **Am I really ready to take the AZ-104 certification exam?**

---

# 💡 The Idea

The user answers questions related to Azure administration and receives immediate feedback.

Example:

```text
❌ Your answer: C

✅ Correct answer: B

Explanation:

Azure RBAC is used to manage access to Azure resources.
It allows permissions to be assigned to users, groups,
managed identities, and service principals.

Domain:
Identity and Governance

Your current performance:
62%

Recommended topics:
- Azure RBAC
- Azure Policy
- Management Groups
```

Over time, the platform builds a **knowledge profile** for each user.

---

# 🚀 Core Features

## 1. 📝 Question Bank

Questions organized by AZ-104 domains and topics.

Possible categories:

- Identity and Governance
- Compute
- Storage
- Virtual Networking
- Monitoring
- Backup and Recovery
- Security
- Resource Management

Each question may contain:

```text
Question
Multiple-choice options
Correct answer
Detailed explanation
Difficulty level
Certification domain
Tags
Reference documentation
User answer history
```

---

## 2. 🎯 Training Mode

Users can create customized study sessions.

Example:

```text
Choose a topic:

[ Azure Networking ]
[ Azure Storage ]
[ Identity & Governance ]
[ Azure Compute ]
[ Monitoring ]
[ Mixed Questions ]
```

Configuration:

```text
Number of questions: 10

Difficulty:
○ Beginner
○ Intermediate
○ Advanced

Mode:
○ Learning
○ Exam
```

---

## 3. 🧪 Mock Exam Mode

A dedicated mode that simulates a certification exam.

Features:

- ⏱️ Timer
- 🔀 Randomized questions
- 📊 Final score
- 🎯 Performance by domain
- 📈 Historical comparison
- 🧠 Review of incorrect answers

Example:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━

        AZ-104 RESULT

        Score: 78%

        READINESS: GOOD 🚀

━━━━━━━━━━━━━━━━━━━━━━━━━━

Identity & Governance      ████████░░ 80%
Storage                    ██████░░░░ 65%
Compute                    █████████░ 90%
Networking                 █████░░░░░ 50%
Monitoring                 ████████░░ 82%

━━━━━━━━━━━━━━━━━━━━━━━━━━

Main improvement area:

Azure Networking
```

---

## 4. 🤖 AI Explanation Engine

The user can request an AI explanation for each question.

The AI can explain:

- Why the correct answer is correct
- Why other alternatives are incorrect
- Which Azure concept is being tested
- Practical examples
- Best practices
- Related Azure services

Example:

```text
🤖 Explain with AI

Azure RBAC should be used because it provides
role-based access control for Azure resources.

Example:

DevOps Team
      ↓
Contributor Role
      ↓
Resource Group
```

---

## 5. 📊 Performance Dashboard

Each user has a personalized dashboard.

Metrics:

- Total questions answered
- Accuracy rate
- Questions answered per day
- Study streak
- Average response time
- Performance evolution
- Results by certification domain
- Exam readiness score

Example:

```text
┌─────────────────────────────────────┐
│          AZ-104 PROGRESS            │
├─────────────────────────────────────┤
│ Questions Answered       1,248      │
│ Accuracy                 74%        │
│ Study Streak             🔥 12 days │
│                                     │
│ Estimated Readiness      78%        │
└─────────────────────────────────────┘
```

---

## 6. 🧠 Knowledge Gap Detection

The platform analyzes the user's answers and identifies weak areas.

Example:

```text
⚠️ Knowledge Gaps Detected

1. Azure Networking
   Accuracy: 48%

2. Azure Storage
   Accuracy: 56%

3. Identity and Governance
   Accuracy: 61%
```

The application can then recommend:

```text
🎯 Next Study Session

1. Review Azure Virtual Networks
2. Practice NSG questions
3. Review Azure Load Balancer
4. Study Azure DNS
5. Take a Networking Quiz
```

---

## 7. 🔄 Smart Review System

The project can implement **Spaced Repetition**.

Questions answered incorrectly return for review at strategic intervals.

Example:

```text
❌ Incorrect Answer

Review Schedule:

1st review → Tomorrow
2nd review → 3 days
3rd review → 7 days
4th review → 14 days
```

---

## 8. 🏆 Gamification

Users can unlock achievements and maintain study streaks.

Examples:

```text
🥉 Azure Beginner
Complete 100 questions

🥈 Cloud Explorer
Complete 500 questions

🥇 Azure Administrator
Complete 1,000 questions

🔥 7 Day Streak
Study for 7 consecutive days

🧠 Networking Master
Achieve 90%+ in Azure Networking
```

---

# 🗺️ Study Roadmap

```text
START
  │
  ▼
Identity & Governance
  ├── Microsoft Entra ID
  ├── Azure RBAC
  ├── Azure Policy
  └── Management Groups
  │
  ▼
Storage
  ├── Storage Accounts
  ├── Blob Storage
  ├── Azure Files
  └── Storage Security
  │
  ▼
Compute
  ├── Virtual Machines
  ├── App Services
  ├── Containers
  └── VM Availability
  │
  ▼
Networking
  ├── Virtual Networks
  ├── NSG
  ├── Load Balancer
  ├── Application Gateway
  ├── Azure DNS
  └── Azure Firewall
  │
  ▼
Monitoring & Backup
  │
  ▼
🎯 EXAM READY
```

---

# 🏗️ Proposed Architecture

```text
                    ┌───────────────────┐
                    │       USER        │
                    │    Web Browser    │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │     FRONTEND      │
                    │ React / Next.js   │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      BACKEND      │
                    │      FastAPI      │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Question Engine │ │ Analytics Engine│ │    AI Engine    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                    ┌───────────────────┐
                    │    PostgreSQL     │
                    └───────────────────┘
```

---

# ⚙️ Technology Stack

## Frontend

- React or Next.js
- TypeScript
- Tailwind CSS
- Recharts or Chart.js
- React Query

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- JWT Authentication
- Alembic

## Database

- PostgreSQL
- Redis

## AI Layer

Possible providers:

- Azure OpenAI
- OpenRouter
- Other LLM APIs

AI use cases:

- Personalized explanations
- Feedback generation
- Study recommendations
- Knowledge-gap analysis
- Question generation for practice

---

# ☁️ Azure Architecture

The project itself can serve as a complete Cloud and DevOps portfolio project.

```text
                         INTERNET
                             │
                             ▼
                    Azure Front Door
                             │
                             ▼
                  Azure Kubernetes Service
                            AKS
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
       Frontend           Backend           AI Service
        Pods               Pods
          │                  │
          └──────────┬───────┘
                     │
                     ▼
              Azure Database
              for PostgreSQL
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Azure Cache            Key Vault
      for Redis
```

---

# 🔄 DevOps Workflow

```text
Developer
    │
    ▼
GitHub
    │
    ▼
GitHub Actions
    │
    ├── Lint
    ├── Unit Tests
    ├── Security Scan
    ├── Build
    └── Docker Image
            │
            ▼
    Azure Container Registry
            │
            ▼
         Terraform
            │
            ▼
    Azure Infrastructure
            │
            ▼
            AKS
            │
            ▼
       Argo CD / GitOps
            │
            ▼
        Production
```

---

# 🏗️ Infrastructure as Code

Infrastructure can be provisioned with **Terraform**.

Possible resources:

```text
Azure Resource Group
Azure Kubernetes Service
Azure Container Registry
Azure Database for PostgreSQL
Azure Key Vault
Azure Application Insights
Azure Monitor
Azure Storage Account
Azure Front Door
Azure Cache for Redis
```

Suggested repository structure:

```text
infrastructure/
├── modules/
│   ├── aks/
│   ├── acr/
│   ├── postgres/
│   ├── key-vault/
│   └── monitoring/
│
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
│
├── providers.tf
├── variables.tf
├── outputs.tf
└── main.tf
```

---

# 🔐 Security and DevSecOps

Recommended security practices:

- GitHub Secrets or OIDC authentication
- Azure Key Vault
- Managed Identities
- Secret rotation
- RBAC
- Least privilege
- Container image scanning
- Infrastructure scanning
- Dependency scanning

Possible tools:

- Trivy
- Checkov
- GitHub CodeQL
- SonarQube
- Kyverno

---

# 📁 Project Structure

```text
az104-trainer/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── database/
│   │
│   ├── tests/
│   └── requirements.txt
│
├── infrastructure/
│   └── terraform/
│
├── kubernetes/
│   ├── frontend/
│   ├── backend/
│   ├── ingress/
│   └── monitoring/
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       ├── backend-ci.yml
│       ├── infrastructure-ci.yml
│       └── deploy.yml
│
├── docker-compose.yml
├── README.md
└── LICENSE
```

---

# 📡 API Design

## Get Questions

```http
GET /api/v1/questions
```

Example response:

```json
{
  "id": "az104-001",
  "question": "Which Azure service should you use to manage access to Azure resources?",
  "options": [
    "Azure Monitor",
    "Azure RBAC",
    "Azure Backup",
    "Azure Advisor"
  ],
  "category": "Identity and Governance",
  "difficulty": "Intermediate"
}
```

---

## Submit Answer

```http
POST /api/v1/questions/{id}/answer
```

Request:

```json
{
  "answer": "Azure RBAC"
}
```

Response:

```json
{
  "correct": true,
  "explanation": "Azure RBAC provides role-based access control for Azure resources.",
  "category": "Identity and Governance",
  "user_accuracy": 78
}
```

---

## Dashboard

```http
GET /api/v1/dashboard
```

Possible response:

```json
{
  "questions_answered": 1248,
  "accuracy": 74,
  "study_streak": 12,
  "estimated_readiness": 78,
  "weakest_domains": [
    "Networking",
    "Storage"
  ]
}
```

---

# 🗄️ Suggested Data Model

Core entities:

```text
User
Question
Answer
Category
Exam
ExamAttempt
StudySession
ReviewSchedule
Achievement
UserAchievement
```

Basic relationship:

```text
User
 ├── Answers
 ├── Exam Attempts
 ├── Study Sessions
 ├── Review Schedule
 └── Achievements

Question
 ├── Category
 ├── Options
 ├── Correct Answer
 └── Explanations
```

---

# 🎯 MVP Scope

The first version should focus on delivering a usable product.

## Phase 1 — Foundation

- [ ] Create Git repository
- [ ] Define application architecture
- [ ] Configure Docker Compose
- [ ] Configure PostgreSQL
- [ ] Create FastAPI project
- [ ] Create frontend project
- [ ] Implement environment configuration

## Phase 2 — Authentication

- [ ] User registration
- [ ] Login
- [ ] JWT authentication
- [ ] Password hashing
- [ ] User profile

## Phase 3 — Question Engine

- [ ] Create question model
- [ ] Create categories
- [ ] Create multiple-choice questions
- [ ] Submit answers
- [ ] Calculate correctness
- [ ] Display explanations

## Phase 4 — Dashboard

- [ ] Total questions answered
- [ ] Accuracy rate
- [ ] Performance by category
- [ ] Study history
- [ ] Basic charts

## Phase 5 — Mock Exam

- [ ] Random question generation
- [ ] Timer
- [ ] Final score
- [ ] Detailed result
- [ ] Incorrect-answer review

---

# 🚀 Future Versions

## Version 2

- [ ] AI explanations
- [ ] Smart study plan
- [ ] Spaced repetition
- [ ] Advanced analytics
- [ ] Gamification
- [ ] Badges
- [ ] Daily challenges

## Version 3

- [ ] AI Tutor
- [ ] Voice mode
- [ ] Adaptive difficulty
- [ ] Personalized certification readiness
- [ ] Mobile application
- [ ] Multi-certification support

---

# 📊 Certification Readiness Score

One of the main differentiators can be a calculated readiness score.

Example:

```text
┌─────────────────────────────────────┐
│      CERTIFICATION READINESS        │
│                                     │
│              82%                    │
│                                     │
│         ████████░░                  │
│                                     │
│ 🟢 You are almost ready!            │
│                                     │
│ Recommended actions:                │
│                                     │
│ • Improve Networking                │
│ • Review Azure Storage              │
│ • Complete 2 mock exams             │
└─────────────────────────────────────┘
```

The score could consider:

```text
Accuracy
+
Question difficulty
+
Performance by domain
+
Recent performance
+
Mock exam results
+
Response consistency
```

---

# 🌍 Future Expansion

The project can evolve into a broader certification platform:

```text
CloudCert Trainer
│
├── Microsoft Azure
│   ├── AZ-900
│   ├── AZ-104
│   ├── AZ-305
│   └── AZ-400
│
├── AWS
│   ├── Cloud Practitioner
│   ├── Solutions Architect
│   ├── SysOps
│   └── DevOps Engineer
│
├── Kubernetes
│   ├── CKA
│   ├── CKAD
│   └── CKS
│
└── HashiCorp
    └── Terraform Associate
```

---

# 🧭 Suggested Development Roadmap

## Sprint 1

```text
Project setup
Docker Compose
FastAPI
PostgreSQL
Frontend
Authentication
```

## Sprint 2

```text
Question CRUD
Categories
Question answering
Result validation
```

## Sprint 3

```text
User dashboard
Analytics
Charts
Performance by domain
```

## Sprint 4

```text
Mock exams
Timer
Exam results
Question review
```

## Sprint 5

```text
AI integration
Smart explanations
Study recommendations
Knowledge-gap detection
```

## Sprint 6

```text
Terraform
Azure infrastructure
CI/CD
Kubernetes
Monitoring
```

---

# 🧑‍💻 Portfolio Value

This project is designed to demonstrate practical skills in:

```text
☁️ Azure Cloud
🐳 Docker
☸️ Kubernetes
🏗️ Terraform
🔄 CI/CD
🔐 DevSecOps
📊 Observability
🐍 Python
⚡ FastAPI
🗄️ PostgreSQL
🎨 Modern Frontend
🤖 Artificial Intelligence
```

It can serve both as:

1. **A real study platform for Azure certifications**
2. **A complete Cloud/DevOps portfolio project**

---

# 🎯 Final Vision

> **Build. Practice. Analyze. Improve. Certify. 🚀**

**AZ-104 Trainer** is not intended to be only a collection of questions.

The vision is to create a **Personal Cloud Certification Coach** capable of helping users understand their current level, identify weaknesses, practice strategically, and build confidence before taking the AZ-104 exam.

---

## 👨‍💻 Author

**Jefferson Santos**

DevOps Engineer | Cloud Engineer | Site Reliability Engineer

```text
AWS • Azure • Kubernetes • Terraform • CI/CD • GitOps • Python • AI
```

---

⭐ **If this project interests you, consider starring the repository and contributing to its evolution.**
