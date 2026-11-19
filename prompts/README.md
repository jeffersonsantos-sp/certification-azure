# AI Prompts - AZ-104 Trainer

The question bank supports five formats: `single_choice`, `multiple_choice`, `case_study`, `drag_drop`, and `hotspot`.

## Prompt de Geração de Questões

```
You are a Microsoft Azure certification expert creating practice questions
for the AZ-104 exam.

Generate {count} single-choice questions for the following skill:

Domain: {domain_name}
Skill: {skill_name}
Specific items: {skill_items}

Requirements:
1. Set `question_type` to `single_choice`
2. Each question must have exactly 4 options (A, B, C, D)
3. Only ONE correct answer per question
4. Questions should vary in difficulty (easy, intermediate, advanced)
5. Include real-world scenarios when possible
6. Explanations must reference Azure documentation
7. Do NOT use "All of the above" or "None of the above" as options
8. Avoid absolute terms like "always", "never", "only"
9. Use current terminology (Microsoft Entra ID, not Azure AD)

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

---

## Geração avançada em escala

O gerador suporta os cinco formatos e pode gerar todos os formatos avançados por skill:

```bash
# Ver plano sem consumir créditos
python3 scripts/generate.py --all-formats --all --count 2 --dry-run

# Gerar lotes avançados para todos os skills
python3 scripts/generate.py --all-formats --all --count 2 --batch-size 4

# Validar todos os drafts
python3 scripts/validate.py review --dir questions/drafts

# Aplicar a distribuição equilibrada ao banco
docker compose exec backend python scripts/rebalance_questions.py
```

Regras obrigatórias do gerador/validador para formatos avançados:

- `multiple_choice`: quatro opções e pelo menos duas respostas corretas.
- `case_study`: `question_data.scenario` obrigatório.
- `drag_drop`: `correct_answer` lista todos os rótulos exatamente uma vez.
- `hotspot`: `image_url` e regiões com `id`, `label`, `x`, `y`, `width`, `height`.
- Todos os formatos avançados exigem `reference_url` oficial da Microsoft Learn.

## Prompt de Geração de Formatos Avançados

```
You are a Microsoft Azure certification expert creating advanced-format
practice questions for the AZ-104 exam.

Generate {count} questions for the following skill:

Domain: {domain_name}
Skill: {skill_name}
Specific items: {skill_items}
Allowed formats: {question_types}

Requirements:
1. Use only `multiple_choice`, `case_study`, `drag_drop`, or `hotspot`
2. Include a clear `explanation`, `difficulty`, `tags`, and `reference_url`
3. Test practical administration decisions, not trivia
4. Do NOT use "All of the above" or "None of the above"
5. Avoid absolute terms like "always", "never", "only"
6. Use current terminology (Microsoft Entra ID, not Azure AD)
7. Preserve Azure product names, CLI commands, cmdlets, and code snippets exactly

Format rules:
- `multiple_choice`: 4 options; at least two options have `is_correct: true`;
  `correct_answer` is an array of correct labels
- `case_study`: 4 options; put the scenario in `question_data.scenario` and
  instructions in `question_data.instructions`; `correct_answer` is one label
- `drag_drop`: at least 2 options; `correct_answer` lists every option label
  exactly once in the correct order
- `hotspot`: no options; provide `question_data.image_url` and
  `question_data.regions`; `correct_answer` is a region ID

Return only valid JSON:
{
  "questions": [
    {
      "question_text": "...",
      "question_type": "multiple_choice",
      "question_data": {},
      "options": [
        {"label": "A", "text": "...", "is_correct": true},
        {"label": "B", "text": "...", "is_correct": false},
        {"label": "C", "text": "...", "is_correct": true},
        {"label": "D", "text": "...", "is_correct": false}
      ],
      "correct_answer": ["A", "C"],
      "explanation": "...",
      "difficulty": "intermediate",
      "tags": ["..."],
      "reference_url": "https://learn.microsoft.com/..."
    }
  ]
}
```

---

## Prompt de Validação de Questões

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
6. Is the terminology current (Microsoft Entra ID, not Azure AD)?
7. Does `correct_answer` match the `question_type` shape?
8. For `multiple_choice`, are all correct labels included and no incorrect label included?
9. For `drag_drop`, does the answer list every option label exactly once?
10. For `hotspot`, does the correct region ID exist in `question_data.regions`?
11. For `case_study`, does the scenario contain enough information to choose one answer?

Return:
{
  "valid": true/false,
  "issues": ["..."],
  "suggested_fixes": ["..."],
  "confidence_score": 0.95
}
```

---

## Prompt de Explicação com IA

```
You are an Azure tutor explaining AZ-104 concepts to a student.

Question: {question}
Correct Answer: {correct_answer}
Student's Answer: {student_answer}
Was Correct: {is_correct}

Provide a clear, concise explanation that:
1. Explains WHY the correct answer is correct
2. Explains WHY each wrong answer is wrong
3. Relates to real-world Azure administration scenarios
4. References relevant Azure documentation
5. Provides tips for remembering the concept

Keep the explanation under 300 words.
Use simple language but maintain technical accuracy.
```

---

## Prompt de Recomendação de Estudo

```
Based on the student's performance data, create a personalized study plan.

Performance Data:
- Total questions answered: {total}
- Accuracy rate: {accuracy}%
- Weakest domains: {weak_domains}
- Strongest domains: {strong_domains}
- Recent performance trend: {trend}

Generate a study plan that:
1. Prioritizes weak areas
2. Balances review of strong areas
3. Includes specific Azure topics to study
4. Suggests practice question counts per domain
5. Provides a realistic timeline

Return in this format:
{
  "priority_areas": [
    {"domain": "...", "topics": ["..."], "practice_count": 20}
  ],
  "review_areas": [...],
  "estimated_study_hours": 20,
  "recommended_resources": ["..."]
}
```

---

## Prompt de Análise de Performance

```
Analyze the student's mock exam results and provide insights.

Mock Exam Results:
- Score: {score}%
- Time taken: {time} minutes
- Questions answered: {answered}/{total}
- Correct by domain: {domain_scores}

Provide:
1. Overall assessment (Pass/Fail, readiness level)
2. Strengths and weaknesses by domain
3. Comparison to AZ-104 passing criteria
4. Specific areas to improve
5. Estimated exam readiness score

Return in this format:
{
  "passed": true/false,
  "readiness_score": 78,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "estimated_improvement_time": "2 weeks"
}
```

---

## Prompt de Tradução de Questões (EN → PT-BR)

```
You are a technical translator specializing in Microsoft Azure certification content.

Translate the following AZ-104 question from English to Brazilian Portuguese (pt-BR):

{question_json}

Requirements:
1. Translate question_text, every options[].text, explanation, and the natural-language
   fields inside question_data (scenario and instructions)
2. Preserve question_type, option labels, correct_answer, difficulty, tags, region IDs,
   percentages, image_url, and the JSON structure
3. Keep Azure product names, resource type names, SKUs, cmdlets, CLI commands, API names,
   and acronyms in English, using canonical Azure casing
   (for example: Microsoft Entra ID, Azure RBAC, Virtual Networks, Virtual Machines,
   Storage Accounts, Resource Groups, Load Balancers, Key Vaults, PowerShell, Azure CLI,
   ARM templates)
4. Do not translate resource type names even when they are common nouns
   (for example, keep "virtual networks" as "Virtual Networks", not "redes virtuais")
5. Use natural Brazilian Portuguese, not literal machine translation
6. Preserve code snippets, placeholders, URLs, and command syntax exactly
7. NEVER translate strings containing backticks or CLI commands such as `az group create`
8. Do not add, remove, or reorder questions or options
9. Do not include comments or markdown fences in the response

Example:
Source: "What are virtual networks in Azure?"
Translation: "O que são Virtual Networks no Azure?"

Return only valid JSON in the same shape as the input.
```

---

## Prompt de Revisão de Tradução

```
Review this English → Brazilian Portuguese translation of an AZ-104 question.

Source:
{source_json}

Translation:
{translated_json}

Check:
1. Is the technical meaning preserved?
2. Were Azure product names, cmdlets, CLI commands, and acronyms kept correctly?
3. Is the Portuguese natural and grammatically correct?
4. Are question_type, option letters, correct_answer, difficulty, tags, region IDs,
   percentages, and image_url unchanged?
5. Were backticked CLI commands and code snippets left untouched?
6. Were Azure resource names kept in English with canonical casing
   (for example: Virtual Networks, Virtual Machines, Storage Accounts, Resource Groups)?
7. Is the JSON structure identical to the source?

Return:
{
  "valid": true/false,
  "issues": ["..."],
  "suggested_fixes": ["..."],
  "confidence_score": 0.95
}
```

---

## Prompt de Revisão de Código

```
Review the following code for the AZ-104 Trainer project:

File: {filename}
Language: {language}

Code:
{code}

Check for:
1. Code quality and readability
2. Security vulnerabilities, including answer leakage in read endpoints
3. Performance issues
4. Best practices adherence
5. Error handling completeness
6. Correct handling of `single_choice`, `multiple_choice`, `case_study`, `drag_drop`, and `hotspot` answers

Return:
{
  "status": "approved" | "needs_changes" | "rejected",
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "line": 42,
      "description": "...",
      "fix": "..."
    }
  ],
  "score": 85
}
```

---

## Prompt de Documentação

```
Generate comprehensive documentation for the following code:

Code:
{code}

Include:
1. Function/method description
2. Parameters and return values
3. Usage examples
4. Edge cases and error handling
5. Related Azure concepts (if applicable)

Format as markdown with proper code blocks.
```

---

## Prompt de Testes

```
Generate unit tests for the following function:

Function: {function_name}
Code: {code}

Requirements:
1. Cover happy path scenarios
2. Cover error scenarios
3. Cover edge cases
4. Use appropriate assertions
5. Follow testing best practices
6. For question APIs, test sanitized reads, each question format, correct/incorrect scoring, and anonymous vs authenticated submissions

Return pytest tests with proper fixtures and mocking.
```

---

## Prompt de Autoria de Lab Azure

```
You are an Azure AZ-104 lab author.

Create a new bilingual lab definition in YAML for the AZ-104 Trainer.

Context:
- Domain: {domain_id}
- Skill: {skill_id}
- Lab slug: {slug}
- Resource group: {resource_group_name}
- Difficulty: {difficulty}
- Estimated minutes: {minutes}

Requirements:
1. Include `slug`, bilingual `title`, `description`, `objectives`, `prerequisites`,
   `cost_warning`, `cleanup_commands`, domain/skill, difficulty, estimated time,
   resource group, status `published` and `sort_order`.
2. Write every `steps[]` item with:
   - unique `key` and integer `position`
   - bilingual `title` and `instructions` (`en`, `pt-BR`)
   - `commands[]` with bilingual labels and valid Azure CLI commands
   - `portal_steps` with step-by-step Portal do Azure instructions in both languages
   - `validation_hint` when useful
3. Write `checks[]` using only supported check types:
   resource_exists, resource_count, property_equals, tag_equals,
   role_assignment_exists, group_role_assignment_exists, nsg_rule_exists,
   subnet_exists, policy_assignment_exists, resource_lock_exists,
   virtual_network_peering_exists, load_balancer_probe_exists,
   app_service_slot_exists, backup_protected_vm_exists, file_share_exists,
   route_exists, manual.
4. Use deterministic, descriptive keys for steps and checks.
5. Keep Azure product names, resource types, SKUs, cmdlets and commands in English.
6. Add cleanup via `az group delete --name <resource_group> --yes --no-wait`.
7. Prefer low-cost resources and avoid Bastion, VPN Gateway, Application Gateway,
   Premium SSD and high log ingestion.
8. Return only valid YAML with no markdown fences or comments.
```

---

## Prompt de Design de Check de Validação

```
Design validation checks for an AZ-104 Trainer lab.

Lab: {lab_slug}
Objective: {objective}
Expected final state: {expected_state}

Rules:
1. Prefer control-plane checks via Resource Graph for top-level resources.
2. Use ARM checks only for child resources or properties not available in Resource Graph.
3. Use `property_equals` with the exact JSON path seen by Resource Graph
   (for example `properties.minimumTlsVersion`, not the flattened CLI field).
4. Use `tag_equals` for tags.
5. Use `resource_count` with `min_count` when at least one matching resource is enough.
6. Use `manual` only for checks that cannot be verified read-only.
7. Mark critical checks as `required: true`; informational checks as `required: false`.
8. Never require write access, secret values, data-plane access, or network connectivity.

Return:
{
  "checks": [
    {
      "key": "...",
      "check_type": "...",
      "config": {},
      "required": true,
      "weight": 1,
      "reason": "..."
    }
  ]
}
```

---

## Prompt de Tradução de Labs (EN → PT-BR)

```
Translate an AZ-104 Trainer lab definition from English to Brazilian Portuguese.

Input YAML:
{lab_yaml}

Requirements:
1. Translate only natural-language fields: title, description, objectives,
   prerequisites, cost_warning, step titles, instructions, portal_steps,
   validation_hint, check names and descriptions.
2. Keep `slug`, keys, positions, resource group names, Azure resource names,
   resource types, SKUs, CLI commands, Portal blade names and JSON paths unchanged.
3. Keep Azure product names in canonical English, for example:
   Resource groups, Virtual Networks, Storage Accounts, Load Balancers,
   Recovery Services vaults, Application Insights, Microsoft Entra ID.
4. Preserve placeholders such as `<unique>` and variables such as `$WORKSPACE_ID`.
5. Do not add, remove or reorder steps/checks.
6. Return only valid YAML.
```

---

## Prompt de Revisão de Segurança de Labs

```
Review this AZ-104 Trainer lab for security and cost issues.

Lab YAML:
{lab_yaml}

Check:
1. No secrets, tokens, passwords, account keys or real tenant/client IDs.
2. Validation checks are read-only and use only control-plane data.
3. Resource group names follow the lab naming pattern.
4. Cleanup command deletes the lab resource group.
5. No expensive resources are required unless clearly warned.
6. Portal and CLI instructions do not ask the student to disable security controls
   except when the lab explicitly teaches that setting.
7. Azure RBAC steps use least privilege.
8. `correct_answer`-style sensitive data or internal secrets are never embedded.

Return:
{
  "approved": true/false,
  "issues": ["..."],
  "suggested_fixes": ["..."],
  "severity": "critical|warning|info"
}
```
