# AI Prompts - AZ-104 Trainer

## Prompt de Geração de Questões

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
8. Use current terminology (Microsoft Entra ID, not Azure AD)

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
1. Translate question_text, every options[].text, and explanation
2. Preserve the JSON structure, option labels, correct_answer, difficulty, and tags
3. Keep Azure product names, SKUs, cmdlets, CLI commands, API names, and acronyms in English
   (for example: Microsoft Entra ID, Azure RBAC, NSG, VNet, PowerShell, Azure CLI, ARM template)
4. Use natural Brazilian Portuguese, not literal machine translation
5. Preserve code snippets, placeholders, URLs, and command syntax exactly
6. Do not add, remove, or reorder questions or options
7. Do not include comments or markdown fences in the response

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
4. Are option letters, correct_answer, difficulty, and tags unchanged?
5. Is the JSON structure identical to the source?

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
2. Security vulnerabilities
3. Performance issues
4. Best practices adherence
5. Error handling completeness

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

Return pytest tests with proper fixtures and mocking.
```
