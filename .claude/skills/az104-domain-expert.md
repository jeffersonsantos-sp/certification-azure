# AZ-104 Domain Expert Skill

## Purpose
Deep expertise in Azure AZ-104 certification domains and skills.

## Domain Knowledge

### 1. Identity & Governance (20-25%)
**Skills:**
- ig-01: Manage Microsoft Entra users and groups
- ig-02: Manage access to Azure resources
- ig-03: Manage Azure subscriptions and governance

**Key Topics:**
- Microsoft Entra ID (formerly Azure AD)
- User and group management
- RBAC and role assignments
- Azure Policy and Initiative
- Management groups
- Cost management and budgets
- Resource locks and tags

### 2. Storage (15-20%)
**Skills:**
- st-01: Configure access to storage
- st-02: Configure and manage storage accounts
- st-03: Configure Azure Files and Azure Blob Storage

**Key Topics:**
- Storage accounts and redundancy
- Blob Storage tiers and lifecycle
- SAS tokens and shared access policies
- Azure Files and file shares
- Storage firewalls and virtual networks
- Data migration tools

### 3. Compute (20-25%)
**Skills:**
- cm-01: Automate deployment with ARM/Bicep
- cm-02: Create and configure virtual machines
- cm-03: Provision and manage containers
- cm-04: Create and configure Azure App Service

**Key Topics:**
- ARM templates and Bicep
- Virtual machines and scale sets
- Availability zones and sets
- Azure Container Instances/Apps
- App Service plans and deployment slots
- VM extensions and automation

### 4. Networking (15-20%)
**Skills:**
- vn-01: Configure and manage virtual networks
- vn-02: Configure secure access to VNets
- vn-03: Configure name resolution and load balancing

**Key Topics:**
- Virtual networks and subnets
- NSGs and application security groups
- Azure Bastion and private endpoints
- Load balancers and application gateway
- Azure DNS and private DNS
- VNet peering

### 5. Monitoring (10-15%)
**Skills:**
- mn-01: Monitor resources in Azure
- mn-02: Implement backup and recovery

**Key Topics:**
- Azure Monitor metrics and logs
- Log Analytics workspaces
- Alert rules and action groups
- Azure Backup and Recovery Services vaults
- Azure Site Recovery
- Network Watcher

## Translation Terminology (EN → PT-BR)

When translating questions for the PT-BR question language, keep in English:

- Azure product and service names (Azure Monitor, Azure Bastion, Azure Front Door)
- Azure resource type names with canonical casing (Virtual Networks, Virtual Machines,
  Storage Accounts, Resource Groups, Load Balancers, Key Vaults)
- SKUs and tiers (Standard, Premium, LRS, ZRS, GRS, GZRS)
- Cmdlets and CLI commands (`New-AzVM`, `az group create`)
- Acronyms and protocol names (RBAC, NSG, ASG, UDR, VNet, DNS, TLS, SSO, PIM, RPO, RTO)
- API names, ARM template keywords, and resource provider namespaces

Translate:

- The question scenario and natural-language instructions
- Option descriptions
- Explanations and teaching content
- Difficulty labels (Easy → Fácil, Intermediate → Intermediário, Advanced → Avançado)

Do not translate common-noun resource names to Portuguese. For example, keep
"virtual networks" as "Virtual Networks", not "redes virtuais".

Never change option labels, `correct_answer`, `difficulty`, or `tags` during translation.

## Question Formats

Use the format that best tests the skill. Do not force every objective into a single-choice question.

| Format | Best for | Correct answer |
|--------|----------|----------------|
| `single_choice` | Selecting one service, tier, or configuration | One label |
| `multiple_choice` | Selecting a set of required features or steps | Array of labels |
| `case_study` | Applying multiple requirements to a scenario | One label |
| `drag_drop` | Ordering CLI commands or migration steps | Ordered array of every label |
| `hotspot` | Locating a component in a diagram | Region ID |

Format-specific rules:

- Multiple-choice questions need at least two correct options and plausible distractors.
- Case studies need realistic requirements in `question_data.scenario` and clear instructions.
- Drag-and-drop questions must preserve exact CLI syntax; never translate commands.
- Hotspot questions need a valid image URL and percentage-based regions that match the image.
- Keep `question_data` JSON-serializable and avoid embedding the correct answer in it.

## Usage
When generating questions or explanations, ensure:
1. Use current terminology (Microsoft Entra ID, not Azure AD)
2. Reference official Microsoft documentation
3. Include real-world scenarios
4. Test practical knowledge, not just memorization
5. Write the English source clearly so it can be translated to PT-BR without ambiguity
6. Choose the question format that best measures the target skill
7. Preserve commands, labels, and region IDs exactly
