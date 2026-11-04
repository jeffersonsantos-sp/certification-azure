# Question Generator Skill

## Purpose
Generate high-quality AZ-104 certification practice questions using AI.

## When to Use
- When the user asks to generate new questions
- When expanding the question bank
- When creating practice sets for specific domains
- When converting single-choice questions into advanced formats

## Supported Question Formats

| `question_type` | Use when | `correct_answer` |
|-----------------|----------|------------------|
| `single_choice` | One correct answer among four options | String label (`"B"`) |
| `multiple_choice` | Two or more correct answers | Array of labels (`["A", "D"]`) |
| `case_study` | A scenario plus one decision | String label (`"C"`) |
| `drag_drop` | Ordered steps, commands, or sequence | Array listing every option label in order (`["B", "D", "A", "C"]`) |
| `hotspot` | Identify a region in a diagram | Region ID from `question_data.regions` |

## Instructions

1. **Understand the Domain**: Identify which AZ-104 domain the question should cover:
   - Identity & Governance (20-25%)
   - Storage (15-20%)
   - Compute (20-25%)
   - Networking (15-20%)
   - Monitoring (10-15%)

2. **Question Structure**: Each question must have:
   - Clear, scenario-based question text
   - A valid `question_type`
   - Four options (A, B, C, D) for single-choice, multiple-choice, and case study
   - Two or more options for drag-and-drop
   - No options for hotspot questions; define clickable regions instead
   - Detailed explanation referencing Azure documentation
   - Difficulty level (easy/intermediate/advanced)
   - Relevant tags and a reference URL

3. **Format Rules**:
   - `multiple_choice`: mark every correct option with `"is_correct": true`; the API also validates `correct_answer`
   - `case_study`: put the scenario in `question_data.scenario` and instructions in `question_data.instructions`
   - `drag_drop`: options are items to order; `correct_answer` must contain every label exactly once
   - `hotspot`: provide `question_data.image_url` and `question_data.regions`; each region needs `id`, `label`, `x`, `y`, `width`, and `height` percentages
   - Never use "All of the above" or "None of the above"
   - Only one correct answer for `single_choice` and `case_study`
   - Avoid absolute terms (always, never, only)

4. **Quality Standards**:
   - Test practical knowledge, not memorization
   - Use real-world scenarios
   - Ensure distractors are plausible but clearly wrong
   - Reference current Azure services (Microsoft Entra ID, not Azure AD)
   - Keep CLI commands, cmdlets, and code snippets exactly as they should be executed

5. **Output Format**:
```json
{
  "questions": [
    {
      "question_text": "...",
      "question_type": "multiple_choice",
      "question_data": {},
      "options": [
        {"label": "A", "text": "..."},
        {"label": "B", "text": "..."},
        {"label": "C", "text": "..."},
        {"label": "D", "text": "..."}
      ],
      "correct_answer": ["A", "C"],
      "explanation": "...",
      "difficulty": "intermediate",
      "tags": ["tag1", "tag2"],
      "reference_url": "https://learn.microsoft.com/..."
    }
  ]
}
```

### Case Study Example

```json
{
  "question_type": "case_study",
  "question_data": {
    "scenario": "Contoso needs cross-region read access if the primary region fails.",
    "instructions": "Select the best storage redundancy option."
  },
  "correct_answer": "A"
}
```

### Drag-and-Drop Example

```json
{
  "question_type": "drag_drop",
  "options": [
    {"label": "A", "text": "`az vm open-port --port 80`"},
    {"label": "B", "text": "`az group create --name RG1 --location eastus`"},
    {"label": "C", "text": "`az vm show --name VM1`"},
    {"label": "D", "text": "`az vm create --name VM1 --image Ubuntu2204`"}
  ],
  "correct_answer": ["B", "D", "A", "C"]
}
```

### Hotspot Example

```json
{
  "question_type": "hotspot",
  "question_data": {
    "image_url": "/hotspot-storage.svg",
    "regions": [
      {"id": "private-endpoint", "label": "Private endpoint", "x": 37.5, "y": 47.62, "width": 25, "height": 14.29}
    ]
  },
  "options": [],
  "correct_answer": "private-endpoint"
}
```

## Validation Checklist
- [ ] Correct answer verified against Azure docs
- [ ] Explanation is accurate and complete
- [ ] Distractors are plausible but wrong
- [ ] Question tests practical knowledge
- [ ] Difficulty matches declared level
- [ ] Terminology is current
- [ ] `correct_answer` shape matches `question_type`
- [ ] Drag-and-drop lists every option label exactly once
- [ ] Hotspot regions are valid and the correct ID exists
