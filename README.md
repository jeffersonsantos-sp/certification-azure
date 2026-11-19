<div align="center">

# ☁️ AZ-104 Trainer

### Plataforma completa de preparação para a certificação Microsoft Azure Administrator Associate (AZ-104)

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

## 📋 Índice

- [Visão geral](#-visão-geral)
- [O que existe no projeto](#-o-que-existe-no-projeto)
- [Stack tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como acessar e usar](#-como-acessar-e-usar)
- [Laboratórios Azure](#-laboratórios-azure)
- [Importação e migrações](#-importação-e-migrações)
- [API](#-api)
- [Segurança](#-segurança)
- [Prompts e Skills](#-prompts-e-skills)
- [Internacionalização](#-internacionalização)
- [Comandos úteis](#-comandos-úteis)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)

---

## 🎯 Visão geral

O **AZ-104 Trainer** é uma aplicação web full-stack para estudar para o exame **Microsoft Azure Administrator Associate (AZ-104)**.

Ele combina:

- Banco de questões com explicações e formatos avançados.
- Modo prática e simulado cronometrado.
- Dashboard de desempenho por domínio.
- Suporte completo a **EN** e **PT-BR**.
- **23 laboratórios Azure** bilíngues, com instruções práticas via **Portal do Azure** e **Azure CLI**.
- Validação automática **read-only** dos recursos criados no Azure.
- Login/registro de usuários e progresso persistido por usuário.
- Segurança com varredura de segredos no commit e no CI.

Repositório:

```bash
git clone git@github.com:jeffersonsantos-sp/certification-azure.git
cd certification-azure
```

---

## ✨ O que existe no projeto

### Banco de questões

- Banco atual com **350 questões aprovadas** (número dinâmico: `GET /api/v1/questions/stats`).
- 5 domínios oficiais do AZ-104.
- 3 níveis de dificuldade: `easy`, `intermediate`, `advanced`.
- 5 formatos, com 26 questões avançadas aprovadas (8 `multiple_choice`, 6 `case_study`, 6 `drag_drop`, 6 `hotspot`):
  - `single_choice`
  - `multiple_choice`
  - `case_study`
  - `drag_drop`
  - `hotspot`
- Explicações detalhadas e referências para documentação oficial.
- Leitura sanitizada: `correct_answer`, `explanation` e `is_correct` não vazam em endpoints de consulta.

### Prática e simulado

- Practice por domínio/skill, dificuldade e quantidade de questões.
- Modo aprendizado (feedback imediato) e modo prova.
- Simulado com 40/50/60 questões e cronômetro de 60/90/120 minutos.
- Correção no servidor, com histórico opcional quando o usuário está autenticado.
- Relatório por domínio e skill.

### Laboratórios Azure

- **28 labs** cobrindo **todas as 15 skills** do AZ-104.
- **129 passos** e **121 checks** automatizados.
- Cada passo traz abas **Portal** e **Azure CLI**, nos idiomas EN e PT-BR.
- Validação automática via **Azure Resource Graph + ARM**, sem modificar recursos.
- Progresso por usuário, melhor score, histórico de validações e marcação automática de passos após aprovação.
- Tokens Azure nunca são gravados no banco.

### Internacionalização

- Interface em inglês e português.
- Idioma da interface e idioma das questões são independentes.
- Nomes de produtos Azure, cmdlets, comandos CLI e acrônimos permanecem em inglês com grafia canônica.
- Tradução sob demanda com cache em memória e `localStorage`.

---

## 🛠️ Stack tecnológica

### Frontend

| Tecnologia | Uso |
|---|---|
| React 18 | UI |
| TypeScript | Tipagem |
| Tailwind CSS | Estilização |
| Vite | Build e dev server |
| React Router | Rotas |
| Axios | Cliente HTTP |
| Recharts | Gráficos |
| MSAL Browser | OAuth com Microsoft Entra ID |

### Backend

| Tecnologia | Uso |
|---|---|
| Python 3.11 | Runtime |
| FastAPI | API REST |
| SQLAlchemy 2.0 | ORM assíncrono |
| Alembic | Base de migrações |
| Pydantic | Validação |
| httpx | Chamadas ARM/Resource Graph |

### Infraestrutura

| Tecnologia | Uso |
|---|---|
| PostgreSQL 16 | Dados |
| Redis 7 | Cache |
| Docker + Compose | Orquestração local |
| Nginx | Serviço do frontend |
| GitHub Actions | CI de secret scan |

---

## 🏗️ Arquitetura

```text
Navegador
   |
   | HTTPS local
   v
Frontend React (Nginx)  :3000
   |  /api/v1
   v
Backend FastAPI        :8000  ---- Azure Resource Manager / Resource Graph
   |                                 (token Azure curto, somente leitura)
   +--> PostgreSQL     :5432
   +--> Redis          :6379
```

Fluxo de autenticação dos labs:

1. O usuário entra no app com e-mail/senha e recebe um JWT da aplicação.
2. No detalhe do lab, clica em **Conectar ao Azure**.
3. O MSAL abre um popup de login Microsoft e obtém um token delegado para `https://management.azure.com/user_impersonation`.
4. O frontend envia esse token ao backend no header `X-Azure-Authorization`.
5. O backend valida claims (`tid`, `oid`, `exp`), aplica allowlists e executa checks read-only.

---

## 📁 Estrutura do projeto

```text
certification-azure/
├── frontend/
│   ├── src/
│   │   ├── azure/                 # Config MSAL e instância do cliente
│   │   ├── components/            # CommandList, StepMethodTabs, RequireAuth, etc.
│   │   ├── context/               # AuthContext, AzureContext, LanguageContext
│   │   ├── i18n/                  # en.ts, pt.ts, questions.ts, azureTerms.ts
│   │   ├── pages/                 # Dashboard, Practice, MockExam, Labs, LabDetail, etc.
│   │   ├── services/api.ts        # Cliente Axios + tipos
│   │   └── utils/                 #_domains, answers
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   └── app/
│       ├── api/                   # auth.py, questions.py, labs.py, azure.py
│       ├── core/                  # config.py, database.py, azure.py
│       ├── models/models.py       # Todas as tabelas
│       ├── services/azure.py      # AzureClient + LabValidator
│       └── main.py
├── labs/                          # 23 arquivos YAML bilíngues
├── scripts/                       # Importadores, migrações e scanner de segredos
├── prompts/README.md              # Prompts de IA
├── .claude/                       # CLAUDE.md + skills
├── .opencode/skills/              # Skills do OpenCode
├── .github/workflows/             # CI de secret scan
├── brainstore/brainstorm.md       # Planejamento e decisões
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚠️ Pré-requisitos

Para rodar com Docker:

- Docker 20.10+
- Docker Compose v2+
- Git

Para desenvolvimento local:

- Node.js 18+ e npm
- Python 3.11+
- PostgreSQL 16 e Redis 7 (ou Docker para subir apenas esses serviços)

Para usar validação de labs:

- Conta Microsoft com acesso a uma assinatura Azure.
- Permissão para criar um **App registration** no Microsoft Entra ID.
- Permissão **Reader** na assinatura ou nos resource groups dos labs.

---

## 🚀 Instalação

### 1. Docker Compose (recomendado)

```bash
git clone git@github.com:jeffersonsantos-sp/certification-azure.git
cd certification-azure

cp .env.example .env
# Edite .env: JWT_SECRET_KEY, Azure IDs, etc.

bash scripts/install_hooks.sh

docker compose up -d --build
docker compose ps
```

Serviços:

| Serviço | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Swagger UI | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |
| Health check | `http://localhost:8000/health` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Verificação rápida:

```bash
curl http://localhost:8000/health
curl -I http://localhost:3000
```

### 2. Desenvolvimento local

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

O frontend local sobe em `http://localhost:5173`. Se for usar login Azure nesse modo, configure `VITE_AZURE_REDIRECT_URI=http://localhost:5173` e cadastre essa URL no App registration.

---

## ⚙️ Configuração

Crie o `.env` na raiz. Nunca versionar este arquivo.

```env
# Aplicação
ENVIRONMENT=development
DEBUG=true
JWT_SECRET_KEY=change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Banco e cache
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/az104_trainer
REDIS_URL=redis://localhost:6379/0

# Azure labs — backend
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ALLOWLIST=your-tenant-id
AZURE_SUBSCRIPTION_ALLOWLIST=

# Azure labs — frontend/build time
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_REDIRECT_URI=http://localhost:3000
```

Notas:

- `AZURE_TENANT_ALLOWLIST` aceita uma lista separada por vírgulas e usa `AZURE_TENANT_ID` como fallback.
- Se nenhuma allowlist de tenant estiver configurada, os endpoints Azure retornam **503**.
- `AZURE_SUBSCRIPTION_ALLOWLIST` é opcional; se vazia, qualquer assinatura visível ao token pode ser usada.
- `VITE_AZURE_*` são embutidos no build. Após alterá-los, rode `docker compose build frontend`.

### App registration no Microsoft Entra ID

1. Entre no portal do Azure e abra **Microsoft Entra ID > App registrations > New registration**.
2. Nome sugerido: `az104-trainer`.
3. Supported account types: **Accounts in this organizational directory only (single tenant)**.
4. Em **Authentication**, adicione a plataforma **Single-page application**:
   - `http://localhost:3000`
   - `http://localhost:5173` se for usar `npm run dev`
5. Em **API permissions**, adicione:
   - **Azure Service Management**
   - Permissão delegada **user_impersonation**
   - Conceda **admin consent**
6. Copie **Directory (tenant) ID** e **Application (client) ID** para o `.env`.
7. Dê ao usuário de teste pelo menos a role **Reader** na assinatura ou nos resource groups.
8. Rebuild do frontend:

```bash
docker compose build frontend
docker compose up -d frontend backend
```

---

## 👤 Como acessar e usar

1. Abra `http://localhost:3000`.
2. Clique em **Register** e crie uma conta. Não existe usuário demo.
3. Faça login com o e-mail/senha criados.
4. No Dashboard:
   - use **Practice** para treinar por domínio;
   - use **Mock Exam** para simulados;
   - abra **Labs** para o catálogo de laboratórios.
5. Em `/labs`:
   - filtre por domínio, skill ou status;
   - abra um lab;
   - leia os objetivos e pré-requisitos;
   - execute os passos pela aba **Portal** ou **Azure CLI**;
   - marque os passos manualmente ou valide automaticamente.
6. No detalhe do lab:
   - clique em **Conectar ao Azure**;
   - selecione a assinatura;
   - execute os passos no Portal/CLI;
   - clique em **Validar laboratório**;
   - se aprovado, os passos são marcados como concluídos.

Dica: use o portal exatamente em `http://localhost:3000`, pois o redirect URI cadastrado precisa conferir.

---

## 🧪 Laboratórios Azure

### Catálogo atual

| Lab | Domínio | Skill | Dificuldade | Tempo |
|---|---|---|---|---|
| `identity-rbac-reader` | Identity & Governance | ig-02 | easy | 15 min |
| `identity-governance-policy` | Identity & Governance | ig-03 | intermediate | 20 min |
| `identity-entra-users-groups` | Identity & Governance | ig-01 | intermediate | 20 min |
| `networking-vnet-nsg` | Networking | vn-02 | intermediate | 25 min |
| `networking-vnet-peering` | Networking | vn-01 | intermediate | 25 min |
| `networking-load-balancer` | Networking | vn-03 | intermediate | 20 min |
| `networking-private-endpoint` | Networking | vn-03 | advanced | 30 min |
| `networking-udr` | Networking | vn-01 | intermediate | 20 min |
| `storage-blob-container` | Storage | st-03 | intermediate | 20 min |
| `storage-access-controls` | Storage | st-01 | intermediate | 20 min |
| `storage-redundancy-encryption` | Storage | st-02 | intermediate | 20 min |
| `storage-file-share` | Storage | st-03 | intermediate | 20 min |
| `compute-vm` | Compute | cm-02 | intermediate | 30 min |
| `compute-vm-disks-availability` | Compute | cm-02 | advanced | 30 min |
| `compute-arm-deployment` | Compute | cm-01 | intermediate | 20 min |
| `compute-aci` | Compute | cm-03 | intermediate | 15 min |
| `compute-container-registry` | Compute | cm-03 | intermediate | 15 min |
| `compute-app-service` | Compute | cm-04 | intermediate | 20 min |
| `compute-app-service-slots` | Compute | cm-04 | intermediate | 25 min |
| `monitoring-observability` | Monitoring | mn-01 | intermediate | 20 min |
| `monitoring-metric-alerts` | Monitoring | mn-01 | intermediate | 20 min |
| `monitoring-backup` | Monitoring | mn-02 | intermediate | 15 min |
| `monitoring-vm-backup` | Monitoring | mn-02 | advanced | 30 min |

### Como a validação funciona

O validador usa apenas leitura do control plane:

- Azure Resource Graph para recursos de primeiro nível.
- ARM direto para child resources e propriedades específicas.

Tipos de check suportados:

```text
resource_exists
resource_count
property_equals
tag_equals
role_assignment_exists
group_role_assignment_exists
nsg_rule_exists
subnet_exists
policy_assignment_exists
resource_lock_exists
virtual_network_peering_exists
load_balancer_probe_exists
app_service_slot_exists
backup_protected_vm_exists
file_share_exists
route_exists
manual
```

Regras:

- Checks obrigatórios reprovados impedem a aprovação do lab.
- Checks `manual` são informativos.
- Se todos os checks obrigatórios passam, o status vira `passed`, os steps são marcados como concluídos e a pontuação é salva.

### Limpeza

Cada lab usa um resource group próprio e traz um comando de cleanup:

```bash
az group delete --name rg-az104-lab-vnet --yes --no-wait
```

Sempre apague os grupos após o estudo para evitar custos.

---

## 📥 Importação e migrações

```bash
# Questões — etapa canônica de distribuição
docker compose exec backend python scripts/rebalance_questions.py

# Labs
docker compose exec backend python scripts/migrate_lab_checks.py
docker compose exec backend python scripts/migrate_lab_portal_steps.py
docker compose exec backend python scripts/import_labs.py
```

`scripts/import_labs.py` é idempotente: usa UUIDs determinísticos derivados de `lab slug`, `step key` e `check key`, preservando progresso e histórico.

---

## 📡 API

Documentação interativa:

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Criar conta |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/auth/me` | Usuário atual |

### Questões

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/v1/questions/` | Listar questões |
| `GET` | `/api/v1/questions/random` | Questões aleatórias |
| `GET` | `/api/v1/questions/stats` | Estatísticas |
| `GET` | `/api/v1/questions/{id}` | Detalhe sanitizado |
| `POST` | `/api/v1/questions/{id}/answer` | Responder uma questão |
| `POST` | `/api/v1/questions/submit-exam` | Corrigir simulado |

### Labs

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/v1/labs` | Catálogo com progresso |
| `GET` | `/api/v1/labs/progress/summary` | Resumo para dashboard |
| `GET` | `/api/v1/labs/{slug}` | Detalhe do lab |
| `POST` | `/api/v1/labs/{slug}/start` | Iniciar/retomar |
| `PATCH` | `/api/v1/labs/{slug}/steps/{step_id}` | Marcar passo |
| `POST` | `/api/v1/labs/{slug}/validate` | Validar no Azure |

### Azure

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/v1/azure/subscriptions` | Assinaturas visíveis |
| `GET` | `/api/v1/azure/settings` | Config salva do usuário |
| `PUT` | `/api/v1/azure/settings` | Salvar assinatura |

Headers:

```text
Authorization: Bearer <app_jwt>
X-Azure-Authorization: Bearer <azure_access_token>
```

---

## 🔐 Segurança

- `.env` e `.env.local` estão no `.gitignore`.
- Nenhum token Azure é persistido; o token fica apenas em memória/`sessionStorage`.
- Nenhum header de autorização é logado.
- App registration é single-tenant com permissão delegada `user_impersonation`.
- Tenant e assinatura podem ser restringidos por allowlist.
- Validação usa somente leitura (`Reader`).
- Respostas de questões não vazam gabarito em leituras.
- Keep `bcrypt==4.0.1` pinned for compatibility with `passlib`.

### Varredura de segredos

```bash
# Instalar hook local
bash scripts/install_hooks.sh

# Escanear manualmente todos os arquivos versionados
python3 scripts/scan_secrets.py --all
```

O hook usa `gitleaks` se disponível; caso contrário, usa o scanner Python incluído.

CI:

```text
.github/workflows/secret-scan.yml
```

Ele roda em todo `push` e `pull_request`.

Para camada extra, habilite **GitHub Secret Scanning** em **Settings > Code security and analysis**.

---

## 🧠 Prompts e Skills

### Prompts

O arquivo [`prompts/README.md`](prompts/README.md) contém prompts para:

- Geração de questões `single_choice`.
- Geração de formatos avançados.
- Validação de questões.
- Explicações com IA.
- Plano de estudo.
- Análise de desempenho.
- Tradução EN → PT-BR.
- Revisão de tradução.
- Revisão de código.
- Documentação.
- Testes.
- Autoria de labs Azure.
- Criação de checks de validação.
- Revisão de segurança.

### Skills

Claude:

- `.claude/CLAUDE.md`
- `.claude/skills/az104-domain-expert.md`
- `.claude/skills/database-expert.md`
- `.claude/skills/azure-labs-expert.md`

OpenCode:

- `.opencode/skills/question-generator.md`
- `.opencode/skills/code-reviewer.md`
- `.opencode/skills/docker-expert.md`
- `.opencode/skills/api-designer.md`
- `.opencode/skills/frontend-builder.md`
- `.opencode/skills/lab-author.md`

Planejamento e decisões:

```text
brainstore/brainstorm.md
```

---

## 🌍 Internacionalização

| Configuração | Escopo | Persistência |
|---|---|---|
| UI language | Navegação, botões, mensagens | `localStorage.language` |
| Question language | Enunciado, opções, explicação | `localStorage.questionLanguage` |
| Lab content | Título, descrição, passos e checks | JSONB `en` / `pt-BR` |

Nomes de recursos Azure, SKUs, cmdlets e comandos CLI nunca são traduzidos.

---

## 🧰 Comandos úteis

```bash
# Subir tudo
docker compose up -d --build

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Parar
docker compose down

# Status
docker compose ps

# Rebuild somente frontend (após alterar VITE_AZURE_*)
docker compose build frontend && docker compose up -d frontend

# Importar labs
docker compose exec backend python scripts/import_labs.py

# Secret scan
python3 scripts/scan_secrets.py --all

# Backend lint
docker compose exec backend ruff check app

# Frontend build
cd frontend && npm run build
```

---

## 🗺️ Roadmap

Fases concluídas:

- [x] Base do projeto, API, frontend, PostgreSQL, Redis e Docker Compose.
- [x] Banco de questões com 5 formatos.
- [x] Autenticação e registro expostos na UI.
- [x] Labs, progresso, detalhe e catálogo.
- [x] OAuth Azure com MSAL.
- [x] Validação read-only via Resource Graph/ARM.
- [x] Portal + CLI em todos os labs.
- [x] Cobertura das 15 skills com 28 labs.
- [x] Secret scan local e CI.

Próximos possíveis passos:

- [ ] Histórico de respostas com tela dedicada.
- [ ] Explicações geradas por IA.
- [ ] Gamificação.
- [ ] Deploy na Azure.
- [ ] Pipeline completo de CI/CD.

Detalhes em `brainstore/brainstorm.md`.

---

## 🤝 Contribuindo

1. Faça um fork.
2. Crie uma branch: `git checkout -b feature/minha-feature`.
3. Instale o hook: `bash scripts/install_hooks.sh`.
4. Commit e push.
5. Abra um Pull Request.

Antes de commitar:

```bash
git diff --cached
python3 scripts/scan_secrets.py --all
npm run build
docker compose exec backend ruff check app
```

---

## 📄 Licença

MIT.

---

## 👨‍💻 Autor

**Jefferson Santos**

DevOps Engineer | Cloud Engineer | Site Reliability Engineer

AWS • Azure • Kubernetes • Terraform • CI/CD • GitOps • Python • AI

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/jefferson-fsantos/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jeffersonsantos-sp)

---

<div align="center">

**Build. Practice. Validate. Improve. Certify. 🚀**

</div>
