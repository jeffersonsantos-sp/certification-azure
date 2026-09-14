# Question Generator Skill

## Purpose
Generate high-quality AZ-104 certification practice questions using AI.

## When to Use
- When the user asks to generate new questions
- When expanding the question bank
- When creating practice sets for specific domains

## Instructions

1. **Understand the Domain**: Identify which AZ-104 domain the question should cover:
   - Identity & Governance (20-25%)
   - Storage (15-20%)
   - Compute (20-25%)
   - Networking (15-20%)
   - Monitoring (10-15%)

2. **Question Structure**: Each question must have:
   - Clear, scenario-based question text
   - 4 options (A, B, C, D) - never use "All of the above"
   - Only ONE correct answer
   - Detailed explanation referencing Azure documentation
   - Difficulty level (easy/intermediate/advanced)
   - Relevant tags for categorization

3. **Quality Standards**:
   - Test practical knowledge, not memorization
   - Use real-world scenarios
   - Avoid absolute terms (always, never, only)
   - Ensure distractors are plausible but clearly wrong
   - Reference current Azure services (Microsoft Entra ID, not Azure AD)

4. **Output Format**:
```json
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
  "tags": ["tag1", "tag2"]
}
```

## Validation Checklist
- [ ] Correct answer verified against Azure docs
- [ ] Explanation is accurate and complete
- [ ] Distractors are plausible but wrong
- [ ] Question tests practical knowledge
- [ ] Difficulty matches declared level
- [ ] terminology is current
