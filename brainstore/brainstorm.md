# Brainstorm - AZ-104 Trainer

> Documento de brainstorm e planejamento do projeto AZ-104 Trainer.

## Visão do Projeto

O **AZ-104 Trainer** é uma plataforma web inteligente para prática de questões de certificação **Microsoft Azure Administrator Associate (AZ-104)**.

### Problema Resolvido
Profissionais de TI precisam de uma ferramenta eficaz para se preparar para a certificação AZ-104, com:
- Questões de alta qualidade alinhadas ao exame real
- Feedback imediato e explicações detalhadas
- Acompanhamento de progresso por domínio
- Simulação de prova com cronômetro

### Público-Alvo
- Profissionais Azure iniciantes/intermediários
- DevOps Engineers
- Cloud Engineers
- System Administrators
- Estudantes de certificação

---

## Funcionalidades Principais

### 1. Banco de Questões
- 542+ questões organizadas por domínio
- 5 domínios do AZ-104
- 3 níveis de dificuldade
- Explicações detalhadas para cada resposta

### 2. Modo Prática
- Seleção por domínio
- Configuração de dificuldade
- Quantidade de questões (5-30)
- Modo aprendizado vs modo prova

### 3. Simulado (Mock Exam)
- Cronômetro configurável (60/90/120 min)
- Questões aleatórias
- Navegador de questões
- Resultado detalhado por habilidade

### 4. Dashboard
- Estatísticas de progresso
- Gráficos por domínio
- Total de questões respondidas
- Ações rápidas

### 5. Internacionalização
- Suporte EN/PT-BR
- Seletor de idioma no header
- Preferência persistida no localStorage

---

## Arquitetura

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React + TypeScript | 18.2 |
| Styling | Tailwind CSS | 3.4 |
| Build | Vite | 5.0 |
| Backend | FastAPI + Python | 3.11 |
| ORM | SQLAlchemy | 2.0 |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Containers | Docker + Compose | - |
| Web Server | Nginx | Alpine |

### Diagrama de Arquitetura

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

## Estrutura de Dados

### Modelo de Questão

```json
{
  "id": "uuid",
  "skill_id": "ig-01",
  "domain_id": "identity-governance",
  "question_text": "Which Azure service should you use to...",
  "options": [
    {"label": "A", "text": "Option A", "is_correct": false},
    {"label": "B", "text": "Option B", "is_correct": true},
    {"label": "C", "text": "Option C", "is_correct": false},
    {"label": "D", "text": "Option D", "is_correct": false}
  ],
  "correct_answer": "B",
  "explanation": "Azure RBAC is used because...",
  "difficulty": "intermediate",
  "tags": ["rbac", "access-control"],
  "reference_url": "https://learn.microsoft.com/..."
}
```

### Domínios do AZ-104

| Domínio | ID | Peso | Questões |
|---------|-----|------|----------|
| Identity & Governance | identity-governance | 20-25% | 260 |
| Storage | storage | 15-20% | 88 |
| Compute | compute | 20-25% | 90 |
| Networking | networking | 15-20% | 69 |
| Monitoring | monitoring | 10-15% | 35 |
| **Total** | | | **542** |

---

## Pipeline de Geração de Questões

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Skills     │───▶│ Documentação │───▶│  Geração IA  │
│  Measured    │    │  (Learn)     │    │  (GPT-4o)    │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               ▼
                                      ┌──────────────┐
                                      │  Revisão     │
                                      │  Humana      │
                                      └──────┬───────┘
                                             │
                                             ▼
                                    ┌──────────────┐
                                    │  PostgreSQL  │
                                    │  (Armazenar) │
                                    └──────────────┘
```

---

## Decisões de Projeto

### Decisão | Escolha | Justificativa
- Framework Frontend | React | Ecossistema maduro, TypeScript nativo
- Framework Backend | FastAPI | Performance, async nativo, docs automáticos
- Database | PostgreSQL | Robusto, suporte JSON, gratuito
- Cache | Redis | Performance, persistência de sessões
- Container | Docker | Portabilidade, reproduzibilidade
- Estilo | Tailwind CSS | Produtividade, design consistente

---

## Roadmap

### Fase 1 - MVP ✅
- [x] Setup do projeto
- [x] Backend FastAPI
- [x] Frontend React
- [x] Banco PostgreSQL
- [x] Docker Compose
- [x] Banco de questões

### Fase 2 - Features ✅
- [x] Modo prática
- [x] Simulado
- [x] Dashboard
- [x] Internacionalização (EN/PT-BR)

### Fase 3 - Próximos Passos
- [ ] Autenticação de usuários
- [ ] Histórico de respostas
- [ ] AI explicações
- [ ] Gamificação
- [ ] Deploy na Azure
- [ ] CI/CD com GitHub Actions

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Questões de baixa qualidade | Alto | Pipeline de validação humana |
| Performance do banco | Médio | Índices, cache Redis |
| Segurança dos dados | Alto | Variáveis de ambiente, .gitignore |
| Disponibilidade | Médio | Health checks, restart policy |

---

## Métricas de Sucesso

- **Qualidade das questões**: 95%+ precisão
- **Performance**: < 200ms resposta API
- **Disponibilidade**: 99.9% uptime
- **Usuários**: 100+ practice sessions/mês
- **Certificação**: Usuários passando no exame
