# Brainstorm - AZ-104 Trainer

> Documento de brainstorm, decisões e roadmap do projeto AZ-104 Trainer.
> Última atualização: Fases 0–4 concluídas, 28 labs publicados, 350 questões balanceadas e 26 questões avançadas.

---

## Visão do Projeto

O **AZ-104 Trainer** é uma plataforma web para preparação para a certificação **Microsoft Azure Administrator Associate (AZ-104)**.

### Problema resolvido

Profissionais de TI precisam de:

- Questões alinhadas ao exame, com explicações confiáveis.
- Simulação realista de prova.
- Acompanhamento de desempenho por domínio e skill.
- Prática hands-on em Azure sem provisionamento automático pelo app.
- Validar o que foi feito no portal/CLI sem dar permissão de escrita ao trainer.

### Público-alvo

- Cloud/DevOps/SRE engineers.
- Administradores Windows/Linux em transição para Azure.
- Estudantes de certificação AZ-104.
- Instrutores que precisam de labs padronizados.

---

## Funcionalidades atuais

### 1. Banco de questões

- Banco local atual: **350 questões aprovadas**, com distribuição equilibrada por domínio/skill.
- 5 domínios e 15 skills.
- 5 formatos: `single_choice`, `multiple_choice`, `case_study`, `drag_drop`, `hotspot`.
- 26 questões avançadas aprovadas (8 multiple, 6 case, 6 drag, 6 hotspot), todas com `reference_url`.
- Distribuição por domínio: Identity 85, Storage 70, Compute 75, Networking 65, Monitoring 55.
- Explicações, referências e tags.
- Leitura sanitizada: gabarito não aparece em consultas.

### 2. Practice e Mock Exam

- Practice por domínio, dificuldade e quantidade.
- Modo aprendizado e modo prova; no modo prova o gabarito aparece só no resumo final.
- Simulado com cronômetro e navegação entre questões.
- Sessões persistidas em `sessionStorage` com retomar/descartar; cronômetro ajustado pelo tempo real.
- Correção no servidor, com persistência opcional de respostas e links de documentação.
- Revisão final com resposta do aluno, gabarito, explicação e referência oficial.

### 3. Dashboard

- Estatísticas gerais de questões.
- Progresso por domínio.
- Card de labs com resumo de conclusão/aprovação.
- Ações rápidas para Practice, Mock Exam e Labs.

### 4. Internacionalização

- Interface EN/PT-BR.
- Idioma das questões independente do idioma da interface.
- Nomes Azure, SKUs, cmdlets e comandos permanecem em inglês.

### 5. Autenticação

- Registro/login com JWT próprio.
- Rotas protegidas de labs.
- Progresso por usuário.

### 6. Laboratórios Azure

- **28 labs** cobrindo **todas as 15 skills**.
- **129 passos**, **121 checks**.
- Portal + Azure CLI em abas, em EN/PT-BR.
- OAuth Microsoft via MSAL.
- Validação somente leitura via Resource Graph + ARM.
- Histórico de validações em `lab_validation_runs`.
- Tokens Azure nunca persistidos.
- Inclui 4 labs de troubleshooting e 1 capstone multidomínio.
- Reset por usuário/lab redefine progresso, steps e histórico de validação; recursos Azure não são excluídos.

---

## Arquitetura

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript, Tailwind, Vite |
| Auth frontend | MSAL Browser |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic |
| Dados | PostgreSQL 16, Redis 7 |
| Azure | Resource Graph, ARM, Microsoft Entra ID |
| Containers | Docker, Docker Compose, Nginx |
| CI | GitHub Actions |
| Segurança | pre-commit secret scan, scanner Python, GitHub Secret Scanning |

### Fluxo de validação

```text
1. Usuário autentica no app (JWT local)
2. Usuário conecta ao Azure via MSAL popup
3. Frontend envia:
   Authorization: Bearer <app_jwt>
   X-Azure-Authorization: Bearer <azure_token>
4. Backend valida exp/tid/oid e allowlists
5. LabValidator executa checks control-plane
6. Resultado salvo em lab_validation_runs
7. LabProgress atualizado; se aprovado, steps são marcados
```

---

## Decisões de projeto

### Decisões gerais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Frontend | React | Ecossistema maduro, TS nativo |
| Backend | FastAPI | Async, performance, OpenAPI |
| DB | PostgreSQL | JSONB, robustez |
| Cache | Redis | Performance |
| Container | Docker Compose | Reproduzibilidade local |
| Estilo | Tailwind | Consistência visual |
| Idioma | EN + PT-BR | Alvo brasileiro e internacional |
| Questões | JSONB | Flexibilidade para 5 formatos |
| Labs | YAML bilíngue | Fonte de verdade versionável |

### Decisões dos labs

| Decisão | Escolha |
|---|---|
| Conteúdo | `labs/*.yaml`, EN/PT-BR em JSONB |
| Execução | Portal do Azure **e** Azure CLI |
| Autenticação Azure | App registration SPA single-tenant |
| Permissão Azure | Delegada `user_impersonation` em Azure Service Management |
| Validação | Control plane via Resource Graph + ARM |
| Escopo RBAC | Reader no subscription/resource group |
| Tokens | Memória/sessionStorage no frontend, nunca no banco |
| Tenant | `AZURE_TENANT_ALLOWLIST`, fallback para `AZURE_TENANT_ID` |
| Subscription | `AZURE_SUBSCRIPTION_ALLOWLIST` opcional e seleção persistida |
| Cleanup | Resource group por lab, exclusão manual |
| Data plane | Fora de escopo |
| Provisionamento | Fora de escopo: o aluno cria os recursos |
| Multi-tenant | Fora de escopo |

---

## Cobertura de labs por skill

| Skill | Labs |
|---|---|
| ig-01 | `identity-entra-users-groups` |
| ig-02 | `identity-rbac-reader` |
| ig-03 | `identity-governance-policy` |
| st-01 | `storage-access-controls` |
| st-02 | `storage-redundancy-encryption` |
| st-03 | `storage-blob-container`, `storage-file-share` |
| cm-01 | `compute-arm-deployment` |
| cm-02 | `compute-vm`, `compute-vm-disks-availability` |
| cm-03 | `compute-aci`, `compute-container-registry` |
| cm-04 | `compute-app-service`, `compute-app-service-slots` |
| vn-01 | `networking-vnet-peering`, `networking-udr`, `networking-troubleshooting-route` |
| vn-02 | `networking-vnet-nsg`, `networking-troubleshooting-nsg` |
| vn-03 | `networking-load-balancer`, `networking-private-endpoint` |
| mn-01 | `monitoring-observability`, `monitoring-metric-alerts` |
| mn-02 | `monitoring-backup`, `monitoring-vm-backup`, `monitoring-troubleshooting-backup` |
| multidomínio | `capstone-contoso-foundations` |

---

## Checks implementados

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
backup_policy_exists
file_share_exists
route_exists
manual
```

Regras:

- Checks obrigatórios reprovados bloqueiam a aprovação.
- `manual` é informativo.
- Ao aprovar, o progresso vira `passed` e os steps são marcados como concluídos.
- Resource Graph é usado para recursos de topo; ARM para child resources.

---

## Endpoints dos labs

| Método | Rota | Função |
|---|---|---|
| `GET` | `/api/v1/labs` | Lista labs e progresso |
| `GET` | `/api/v1/labs/progress/summary` | Resumo para dashboard |
| `GET` | `/api/v1/labs/{slug}` | Detalhe, passos e checks |
| `POST` | `/api/v1/labs/{slug}/start` | Cria/retoma progresso |
| `PATCH` | `/api/v1/labs/{slug}/steps/{step_id}` | Marca passo |
| `POST` | `/api/v1/labs/{slug}/validate` | Executa validação |
| `POST` | `/api/v1/labs/{slug}/reset` | Redefine progresso e histórico |
| `GET` | `/api/v1/azure/subscriptions` | Lista assinaturas |
| `GET` | `/api/v1/azure/settings` | Lê config salva |
| `PUT` | `/api/v1/azure/settings` | Salva assinatura |

---

## Modelo de dados dos labs

- `labs`: slug, conteúdo bilíngue, domínio, skill, dificuldade, tempo, RG, status.
- `lab_steps`: passos ordenados, `instructions`, `commands`, `portal_steps`, `validation_hint`.
- `lab_checks`: tipo, config JSONB, obrigatoriedade e peso.
- `lab_progress`: status, melhor score, última validação.
- `lab_step_progress`: passos concluídos.
- `lab_validation_runs`: histórico e resultados por check.
- `azure_settings`: tenant/assinatura/prefixo de RG, nunca tokens.

`scripts/import_labs.py` é idempotente por UUID determinístico derivado de chaves.

---

## Segurança

- `.env` e `.env.local` nunca versionados.
- `scripts/scan_secrets.py` roda manualmente, no pre-commit e no CI.
- `gitleaks` é usado automaticamente quando disponível.
- GitHub Secret Scanning deve ser ativado em Settings → Code security and analysis.
- Tokens Azure não são logados nem persistidos.
- Nenhum header `Authorization` é gravado em logs.
- App registration single-tenant com SPA redirect.
- Reader é suficiente para validação.
- Allowlists de tenant e subscription.
- Cleanup manual evita custo residual.

---

## Fases de entrega

| Fase | Entrega | Status |
|---|---|---|
| 0 | Modelos, YAMLs e importador | Concluída |
| 1 | Catálogo, detalhe, progresso e auth local | Concluída |
| 2 | OAuth Azure, validação read-only e lab piloto | Concluída |
| P1 | 5 labs para cobrir skills restantes | Concluída |
| P2 | 5 labs avançados e novos checks | Concluída |
| Estudo 1 | Distribuição do banco rebalanceada | Concluída |
| Estudo 2 | Sessões persistidas e modo Exam corrigido | Concluída |
| Estudo 3 | Formatos avançados e links de documentação | Concluída |
| Estudo 4 | Troubleshooting labs e capstone | Concluída |
| UI | Tema escuro, footer real e progresso real de labs | Concluída |
| Segurança | Secret scan local + CI | Concluída |
| Documentação | README, prompts, skills, brainstorm | Concluída |

---

## Roadmap

### Concluído

- [x] Setup do projeto.
- [x] Banco de questões e 5 formatos.
- [x] Practice, simulado e dashboard.
- [x] Internacionalização EN/PT-BR.
- [x] Autenticação local.
- [x] Labs, progresso e validação.
- [x] OAuth Microsoft.
- [x] Portal + CLI nos labs.
- [x] 28 labs cobrindo 15 skills.
- [x] Reset de labs para começar do zero.
- [x] Sessões de Practice/Mock Exam retomáveis.
- [x] 26 questões avançadas com documentação oficial.
- [x] Labs de troubleshooting e capstone multidomínio.
- [x] Tema escuro, footer com contadores reais e progresso real de labs.
- [x] Segredos e CI de segurança.

### Pendente / futuro

- [ ] Histórico de respostas com tela dedicada.
- [ ] Explicações geradas por IA.
- [ ] Gamificação.
- [ ] Deploy na Azure.
- [ ] CI/CD completo com publicação de imagens.
- [ ] Relatórios de validação mais ricos.
- [ ] Suporte a mais idiomas.
- [ ] Modo instructor/admin.

---

## Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Questões incorretas | Alto | Revisão humana e prompts de validação |
| Segredos no repositório | Alto | Hook + CI + GitHub Secret Scanning |
| Token Azure vazar em log | Alto | Nunca logar headers; token só em memória |
| Custo Azure nos labs | Médio | RGs por lab, cleanup, evitar recursos caros |
| Indexação do Resource Graph | Médio | Retry e checks ARM para child resources |
| UI do Portal mudar | Médio | Instruções textuais, sem screenshots rígidos |
| Quota/capacidade Azure | Médio | Labs usam SKUs baratos; alguns podem exigir outra região |

---

## Métricas atuais

| Métrica | Valor |
|---|---|
| Questões aprovadas | 350 no banco local (balanceadas) |
| Formatos de questão | 5 (26 questões avançadas) |
| Domínios | 5 |
| Skills | 15 |
| Labs | 28 |
| Passos de labs | 129 |
| Checks | 121 |
| Idiomas | EN, PT-BR |
| Secret scan | pre-commit + CI |
