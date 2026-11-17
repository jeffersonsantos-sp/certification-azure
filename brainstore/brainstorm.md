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
- 411 questões aprovadas organizadas por domínio
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
        ┌──────────────┐ ┌──────────────┐    ┌────────────────────┐
        │  PostgreSQL  │ │    Redis     │    │  Translation APIs  │
        │   (Dados)    │ │   (Cache)    │    │ (Google/MyMemory)  │
        │  Porta: 5432 │ │  Porta: 6379 │    │                    │
        └──────────────┘ └──────────────┘    └────────────────────┘
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
  "question_type": "single_choice",
  "question_data": {},
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
| Identity & Governance | identity-governance | 20-25% | 155 |
| Storage | storage | 15-20% | 61 |
| Compute | compute | 20-25% | 91 |
| Networking | networking | 15-20% | 69 |
| Monitoring | monitoring | 10-15% | 35 |
| **Total** | | | **411** |

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

## Laboratórios Azure (MVP P3)

### Objetivo

Adicionar uma aba de laboratórios guiados por assunto e validar automaticamente, com permissão somente leitura, se os recursos criados pelo aluno no Azure atendem aos objetivos do lab.

### Decisões

| Decisão | Escolha |
|---------|---------|
| Conteúdo | Bilíngue EN/PT-BR em JSONB |
| Autenticação | Expor `/login` e `/register` existentes para salvar progresso |
| Assinatura Azure | Selecionável na interface, protegida por tenant |
| Validação | Control plane via Azure Resource Graph + ARM |
| Checks sem automação | Tipo `manual`, marcado pelo aluno |
| Tokens Azure | Somente em memória/sessão, nunca no banco |
| Cleanup | Manual por resource group |
| Assinatura mensal | Mesmo tenant; nova assinatura apenas troca o dropdown |

### Escopo do MVP

- 18 labs cobrindo todas as 15 skills AZ-104 em Identity & Governance, Networking, Storage, Compute e Monitoring, com instruções de Portal e Azure CLI em abas.
- 1 assinatura Azure por validação.
- Leitura de recursos via Resource Graph e ARM.
- Sem provisionamento automático.
- Sem validação de data plane (blob content, SSH, conectividade).
- Sem multi-tenant; app registration single-tenant.

### Modelo de dados

- `labs`: definição do laboratório, conteúdo bilíngue, domínio, skill, difficulty, resource group e status.
- `lab_steps`: passos ordenados com Markdown bilíngue e comandos.
- `lab_checks`: verificações tipadas por lab.
- `lab_progress`: progresso e melhor score por usuário/lab.
- `lab_step_progress`: passos concluídos.
- `lab_validation_runs`: histórico de validações e resultados.
- `azure_settings`: tenant/assinatura selecionada e prefixo de resource group, sem tokens.

Tipos de check iniciais:

- `resource_exists`
- `resource_count`
- `property_equals`
- `tag_equals`
- `role_assignment_exists`
- `nsg_rule_exists`
- `subnet_exists`
- `manual`

### Endpoints previstos

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/api/v1/labs` | Lista labs e progresso |
| `GET` | `/api/v1/labs/{slug}` | Detalhe, passos e checks |
| `POST` | `/api/v1/labs/{slug}/start` | Cria/retoma progresso |
| `PATCH` | `/api/v1/labs/{slug}/steps/{step_id}` | Marca passo concluído |
| `POST` | `/api/v1/labs/{slug}/validate` | Executa validação no Azure |
| `GET` | `/api/v1/labs/{slug}/runs` | Histórico de validações |
| `GET` | `/api/v1/labs/progress/summary` | Resumo para o Dashboard |
| `GET` | `/api/v1/azure/subscriptions` | Lista assinaturas do usuário |

A validação usa `Authorization: Bearer <app_jwt>` e `X-Azure-Authorization: Bearer <azure_token>`.

### Telas previstas

- `/labs`: catálogo com filtro por domínio/skill e status.
- `/labs/:slug`: objetivos, pré-requisitos, passos, comandos, conexão Azure, validação e cleanup.
- Dashboard: card com labs concluídos e taxa de aprovação.

### Segurança e custos

- Papel `Reader` na assinatura.
- Allowlist de tenant; allowlist opcional de assinaturas.
- Sem logs de headers de autorização.
- Rate limit por usuário.
- Resource group por lab e comando de cleanup.
- Budget alerts na assinatura.
- Evitar recursos caros: Bastion, VPN Gateway, Application Gateway, Premium SSD e ingestão alta de logs.

### Fases

| Fase | Entrega | Status |
|------|---------|--------|
| 0 | Modelos, YAML dos labs e importador | ✅ Concluída |
| 1 | Aba de labs, detalhe e progresso | ✅ Concluída |
| 2 | Login Azure + validador + lab piloto | 🚧 Implementado; falta testar com app registration real |
| 3 | Mais labs, histórico e testes | ⏳ Pendente |

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
- [x] Formatos avançados: multiple choice, case study, drag-drop e hotspot

### Fase 3 - Próximos Passos
- [x] Autenticação de usuários (JWT no backend e UI de login/registro expostas)
- [~] Histórico de respostas (persistência em `user_answers` pronta; endpoint e tela pendentes)
- [ ] AI explicações (explicações atuais são estáticas)
- [ ] Gamificação
- [ ] Deploy na Azure
- [ ] CI/CD com GitHub Actions

### Fase 4 - Laboratórios Azure
- [x] Documentação do MVP
- [x] Modelos e schema dos laboratórios
- [x] Labs bilíngues em YAML
- [x] Importador idempotente
- [x] Aba de laboratórios no frontend
- [x] Login/registro no frontend
- [x] Integração OAuth com Azure (MSAL)
- [x] Validador via Resource Graph/ARM
- [ ] Teste end-to-end com app registration real
- [ ] Histórico e relatório de validações

### Prioridades

| Prioridade | Escopo | Status |
|------------|--------|--------|
| P0 | Correção factual, referências e integridade das questões | ✅ Concluído |
| P1 | Segurança da API, balanceamento de respostas e formatos avançados | ✅ Concluído |
| P2 | Autenticação exposta no frontend, histórico/analytics, AI, gamificação, deploy e CI/CD | 🚧 Pendente |
| P3 | Laboratórios Azure com validação somente leitura | 🚧 Em andamento |

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
