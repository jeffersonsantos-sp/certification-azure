# Azure Labs Expert Skill

## Purpose

Author, review and troubleshoot AZ-104 Trainer labs with Portal + Azure CLI instructions and read-only validation checks.

## When to Use

- Creating or editing files in `labs/*.yaml`
- Adding a new validation check type
- Reviewing lab instructions for correctness, cost and security
- Debugging why a lab validation fails

## Lab File Contract

Every lab YAML must contain:

```yaml
slug: unique-slug
title: { en: ..., pt-BR: ... }
description: { en: ..., pt-BR: ... }
objectives: { en: [...], pt-BR: [...] }
prerequisites: { en: [...], pt-BR: [...] }
cost_warning: { en: ..., pt-BR: ... }
cleanup_commands:
  - label: { en: ..., pt-BR: ... }
    language: bash
    command: az group delete --name rg-az104-lab-xxx --yes --no-wait
domain_id: identity-governance | storage | compute | networking | monitoring
skill_id: ig-01 | ig-02 | ig-03 | st-01 | st-02 | st-03 | cm-01 | cm-02 | cm-03 | cm-04 | vn-01 | vn-02 | vn-03 | mn-01 | mn-02
difficulty: easy | intermediate | advanced
estimated_minutes: 15
resource_group_name: rg-az104-lab-xxx
content_version: "1"
status: published
sort_order: 10
steps: [...]
checks: [...]
```

Each step must include bilingual `title`, `instructions`, `commands[]`, `portal_steps[]` and optional `validation_hint`.

Each check must include bilingual `name`/`description`, a supported `check_type`, a `config` object, `required` and `weight`.

## Supported Check Types

- Top-level resources: `resource_exists`, `resource_count`
- Properties/tags: `property_equals`, `tag_equals`
- Identity: `role_assignment_exists`, `group_role_assignment_exists`
- Networking: `subnet_exists`, `nsg_rule_exists`, `virtual_network_peering_exists`, `load_balancer_probe_exists`, `route_exists`
- Governance: `policy_assignment_exists`, `resource_lock_exists`
- Workloads: `app_service_slot_exists`, `backup_protected_vm_exists`, `file_share_exists`
- Non-automatable verification: `manual`

## Check Design Rules

1. Use Resource Graph for top-level resources.
2. Use ARM directly for child resources such as file shares, slots, routes and protected items.
3. Resource Graph property paths start with `properties.`; match the exact JSON shape.
4. Use `min_count` when "at least one" resource is acceptable.
5. Required checks must be objectively verifiable read-only.
6. Never require Azure write permissions during validation.
7. Never store tokens, subscription secrets or account keys in a lab file.

## Portal + CLI UX

- Portal steps are rendered first in the `Portal` tab.
- CLI commands are rendered in the `Azure CLI` tab.
- Keep both paths equivalent: same resource names, regions, SKUs and tags.
- Use canonical Azure names in Portuguese text: `Resource groups`, `Virtual Networks`, `Storage Accounts`, etc.
- Preserve placeholders such as `<unique>` and shell variables.

## Current Coverage

23 labs cover all 15 AZ-104 skills:

| Domain | Skills | Labs |
|---|---|---|
| Identity & Governance | ig-01, ig-02, ig-03 | 3 |
| Networking | vn-01, vn-02, vn-03 | 5 |
| Storage | st-01, st-02, st-03 | 4 |
| Compute | cm-01, cm-02, cm-03, cm-04 | 6 |
| Monitoring | mn-01, mn-02 | 4 |

## Validation Flow

```text
frontend (app JWT + Azure token)
  -> POST /api/v1/labs/{slug}/validate
  -> parse Azure claims (tid/oid/exp)
  -> enforce tenant/subscription allowlist
  -> AzureClient + LabValidator
  -> save LabValidationRun
  -> update LabProgress and mark steps complete when passed
```

## Common Failure Modes

| Symptom | Likely cause |
|---|---|
| Check finds no resource | Resource Graph indexing delay; retry after a few seconds |
| `503` from Azure endpoint | No tenant allowlist configured |
| `403` tenant not allowed | Token `tid` outside `AZURE_TENANT_ALLOWLIST` |
| `403` subscription not allowed | Subscription outside `AZURE_SUBSCRIPTION_ALLOWLIST` |
| `401` invalid/expired token | MSAL session expired; reconnect Azure |
| Storage child check fails | Wrong account prefix or container/share not created |
| RBAC check fails | Role assigned to wrong principal type or wrong scope |

## Related Files

- `backend/app/api/labs.py`
- `backend/app/services/azure.py`
- `backend/app/models/models.py`
- `scripts/import_labs.py`
- `scripts/migrate_lab_checks.py`
- `scripts/migrate_lab_portal_steps.py`
- `frontend/src/components/StepMethodTabs.tsx`
- `frontend/src/components/AzureValidationPanel.tsx`

## Troubleshooting and Capstone Labs

Troubleshooting labs should:

1. Build a small broken environment in early steps.
2. Include a diagnosis step with Portal inspection paths.
3. Include a fix step with both Portal and CLI instructions.
4. Validate only the final corrected state.
5. Use existing read-only checks whenever possible:
   - `route_exists` for incorrect UDR next hops.
   - `nsg_rule_exists` for blocked traffic.
   - `tag_equals` or `policy_assignment_exists` for policy failures.
   - `backup_policy_exists` for missing backup policies.

Capstone labs should combine multiple domains in one scenario. Prefer 6-10 steps,
one resource group, low-cost resources and checks from at least four domains.
Current capstone: `labs/capstone-contoso-foundations.yaml`.
