# Lab Author Skill

## Purpose

Create and review bilingual AZ-104 Trainer labs in `labs/*.yaml`.

## Instructions

1. Use the slug pattern `<domain>-<topic>`.
2. Use resource group names `rg-az104-lab-<topic>`.
3. Provide both `en` and `pt-BR` for every localized field.
4. Provide both `commands` (Azure CLI) and `portal_steps` (Portal do Azure) for every step.
5. Keep Portal and CLI paths functionally identical.
6. Use deterministic step/check keys; never reuse a key with different meaning.
7. Use only supported check types from `.claude/skills/azure-labs-expert.md`.
8. Prefer low-cost resources and include cleanup.
9. Keep Azure names, SKUs, cmdlets and CLI syntax in English.
10. Validate YAML before finishing: `python3 -c "import yaml,pathlib; yaml.safe_load(pathlib.Path('labs/<slug>.yaml').read_text())"`.

## Workflow

```bash
# 1. Create the YAML file in labs/
# 2. Import into the running backend
docker compose exec backend python scripts/import_labs.py

# 3. Validate via API or UI
# 4. Check lint/build
docker compose exec backend ruff check app
cd frontend && npm run build
```

## Output expectations

When asked to generate a lab, return only valid YAML unless the user explicitly asks for explanation.

When asked to review a lab, report:

```json
{
  "approved": true,
  "issues": [],
  "suggested_fixes": []
}
```
