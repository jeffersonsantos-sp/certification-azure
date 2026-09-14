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
  "options": [
    {"label": "A", "text": "Option A", "is_correct": false},
    {"label": "B", "text": "Option B", "is_correct": true},
    {"label": "C", "text": "Option C", "is_correct": false},
    {"label": "D", "text": "Option D", "is_correct": false}
  ],
  "explanation": "Azure RBAC is used because...",
  "difficulty": "intermediate",
  "tags": ["rbac", "access-control", "identity"],
  "reference_url": "https://learn.microsoft.com/en-us/azure/...",
  "status": "draft|review|approved|published",
  "validated_by": null,
  "validated_at": null
}
```

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
      "options": [
        {"label": "A", "text": "..."},
        {"label": "B", "text": "..."},
        {"label": "C", "text": "..."},
        {"label": "D", "text": "..."}
      ],
      "correct_answer": "B",
      "explanation": "...",
      "difficulty": "intermediate",
      "tags": ["..."]
    }
  ]
}
```

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

| Domínio | Peso | Questões/10 | Total Estimado |
|---------|------|-------------|----------------|
| Identity & Governance | 20-25% | 15 | 150 |
| Storage | 15-20% | 12 | 120 |
| Compute | 20-25% | 15 | 150 |
| Networking | 15-20% | 12 | 120 |
| Monitoring | 10-15% | 10 | 100 |
| **Total** | | | **~640** |

## Execução

### Pré-requisitos

- Python 3.11+
- OpenAI API key ou Azure OpenAI
- PostgreSQL rodando

### Comandos

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves de API

# 3. Gerar questões para um skill específico
python generate.py --skill ig-01 --count 15

# 4. Gerar questões para todos os skills
python generate.py --all --count 10

# 5. Validar questões geradas
python validate.py --status draft

# 6. Exportar questões aprovadas
python export.py --status approved --format json
```

## Critérios de Aprovação

Uma questão é aprovada quando:

- [ ] Resposta correta está verificada na documentação
- [ ] Explicação está precisa e completa
- [ ] Opções incorretas são plausíveis mas claramente erradas
- [ ] Questão testa conhecimento prático, não apenas memorização
- [ ] Dificuldade está adequada ao nível declarado
- [ ] Terminologia está atualizada (Microsoft Entra ID, não Azure AD)
