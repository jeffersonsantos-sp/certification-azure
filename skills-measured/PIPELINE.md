# AZ-104 Question Generation Pipeline

## Visão Geral

Pipeline para gerar questões de certificação AZ-104 usando IA + validação humana.

## Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUESTION GENERATION PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Skills       │───▶│ Documentation│───▶│ AI Generate  │       │
│  │ Measured     │    │ (Learn)      │    │ (GPT-4o)     │       │
│  └──────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                  │               │
│                                                  ▼               │
│                                         ┌──────────────┐        │
│                                         │ Human Review │        │
│                                         │ (Validate)   │        │
│                                         └──────┬───────┘        │
│                                                │                 │
│                                                ▼                 │
│                                       ┌──────────────┐          │
│                                       │ PostgreSQL   │          │
│                                       │ (Store)      │          │
│                                       └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura de uma Questão

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
  "tags": ["rbac", "access-control", "identity"],
  "reference_url": "https://learn.microsoft.com/en-us/azure/...",
  "status": "draft|review|approved|published",
  "validated_by": null,
  "validated_at": null
}
```

### Formatos avançados

| `question_type` | `correct_answer` | Campos adicionais |
|-----------------|------------------|-------------------|
| `single_choice` | string (`"B"`) | opções A–D |
| `multiple_choice` | array (`["A", "C"]`) | `is_correct` em cada opção |
| `case_study` | string (`"B"`) | `question_data.scenario`, `question_data.instructions` |
| `drag_drop` | array ordenado com todos os labels | opções sem `is_correct` |
| `hotspot` | ID da região | `question_data.image_url`, `question_data.regions` |

Para `drag_drop`, o array deve conter cada label exatamente uma vez. Para `hotspot`, cada região precisa de `id`, `label`, `x`, `y`, `width` e `height` em percentuais.

## Prompts de Geração

### Prompt Base (por skill)

```
You are a Microsoft Azure certification expert creating practice questions
for the AZ-104 exam.

Generate {count} multiple-choice questions for the following skill:

Domain: {domain_name}
Skill: {skill_name}
Specific items: {skill_items}

Requirements:
1. Each question must have exactly 4 options (A, B, C, D)
2. Only ONE correct answer per question
3. Questions should vary in difficulty (easy, intermediate, advanced)
4. Include real-world scenarios when possible
5. Explanations must reference Azure documentation
6. Do NOT use "All of the above" or "None of the above" as options
7. Avoid absolute terms like "always", "never", "only"

Return in this exact JSON format:
{
  "questions": [
    {
      "question_text": "...",
      "question_type": "single_choice",
      "question_data": {},
      "options": [
        {"label": "A", "text": "..."},
        {"label": "B", "text": "..."},
        {"label": "C", "text": "..."},
        {"label": "D", "text": "..."}
      ],
      "correct_answer": "B",
      "explanation": "...",
      "difficulty": "intermediate",
      "tags": ["..."],
      "reference_url": "https://learn.microsoft.com/..."
    }
  ]
}
```

Para gerar formatos avançados, use o prompt de formatos avançados em
`prompts/README.md`. Ele cobre `multiple_choice`, `case_study`, `drag_drop`
e `hotspot`, incluindo as regras de `question_data` e `correct_answer`.

### Prompt de Validação

```
Review this AZ-104 practice question for accuracy:

Question: {question}
Options: {options}
Correct Answer: {correct_answer}
Explanation: {explanation}

Check:
1. Is the correct answer actually correct according to Azure documentation?
2. Are the distractors (wrong answers) plausible but clearly wrong?
3. Is the explanation accurate and complete?
4. Does this question test real-world knowledge, not just memorization?
5. Is the difficulty level appropriate?

Return:
{
  "valid": true/false,
  "issues": ["..."],
  "suggested_fixes": ["..."]
}
```

## Contagem de Questões por Domínio

| Domínio | Peso | Questões Atuais | Meta |
|---------|------|-----------------|------|
| Identity & Governance | 20-25% | 155 | 150 |
| Storage | 15-20% | 61 | 120 |
| Compute | 20-25% | 91 | 150 |
| Networking | 15-20% | 69 | 120 |
| Monitoring | 10-15% | 35 | 100 |
| **Total** | | **411** | **~640** |

Os totais atuais refletem o banco aprovado. O total de 411 inclui 407 questões
de escolha única e 4 exemplos de formatos avançados (um de cada tipo).

## Execução

### Pré-requisitos

- Python 3.11+
- OpenAI API key ou Azure OpenAI
- PostgreSQL rodando

### Comandos

```bash
# 1. Instalar dependências
pip install -r backend/requirements.txt

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves de API

# 3. Gerar questões para um skill específico
python scripts/generate.py --skill ig-01 --count 15

# 4. Gerar questões para todos os skills
python scripts/generate.py --all --count 10

# 5. Validar questões geradas
python scripts/validate.py review --status draft

# 6. Aplicar a migração de formatos avançados
python scripts/migrate_advanced_formats.py

# 7. Popular um exemplo de cada formato avançado
python scripts/seed_advanced_formats.py
```

## Critérios de Aprovação

Uma questão é aprovada quando:

- [ ] Resposta correta está verificada na documentação
- [ ] Explicação está precisa e completa
- [ ] Opções incorretas são plausíveis mas claramente erradas
- [ ] Questão testa conhecimento prático, não apenas memorização
- [ ] Dificuldade está adequada ao nível declarado
- [ ] Terminologia está atualizada (Microsoft Entra ID, não Azure AD)
- [ ] `question_type` é válido e `correct_answer` tem o formato correto
- [ ] `drag_drop` lista todos os labels exatamente uma vez
- [ ] `hotspot` referencia uma região existente em `question_data.regions`
- [ ] Comandos CLI, cmdlets e snippets de código não foram traduzidos
