---
name: document-runbook
description: Document CI/CD, deployment, and operational procedures. Use when creating runbooks, documenting deployment processes, or writing operational guides.
---

# Runbook Documentation Skill

## Instructions

When documenting operational procedures:

1. **Identify the process** (deploy, rollback, migration, etc.)
2. **Follow runbook template** structure
3. **Include actual commands** that can be copy-pasted
4. **Document failure scenarios** and recovery steps
5. **Output to** `/docs/runbooks/[process-name].md`

## Runbook Template

````markdown
---
title: [Process Name] Runbook
description: Step-by-step guide for [brief description]
---

# [Process Name] Runbook

## Overview

- **Purpose**: What this runbook accomplishes
- **When to use**: Triggers for this procedure
- **Prerequisites**: Required access, tools, permissions
- **Estimated time**: How long this typically takes
- **Risk level**: Low | Medium | High

## Pre-flight Checklist

Before starting, verify:

- [ ] Prerequisite 1
- [ ] Prerequisite 2
- [ ] Access to required systems

## Procedure

### Step 1: [Step Name]

**What this does**: Brief explanation

```bash
# Commands to run
command --with-options
```
````

**Expected output**:

```
What you should see
```

**If this fails**: What to do if this step fails

---

### Step 2: [Step Name]

**What this does**: Brief explanation

```bash
# Commands to run
```

**Expected output**:

```
What you should see
```

---

## Verification

How to confirm the procedure succeeded:

1. Check X
2. Verify Y
3. Test Z

```bash
# Verification commands
```

## Rollback

If something goes wrong, follow these steps to undo:

### Immediate Rollback

```bash
# Emergency rollback commands
```

### Full Rollback

1. Step 1
2. Step 2

## Troubleshooting

| Symptom         | Likely Cause  | Solution                        |
| --------------- | ------------- | ------------------------------- |
| Error message X | Cause A       | Run command Y                   |
| Timeout         | Network issue | Retry after checking connection |

## Related Documentation

- [Link to architecture doc]
- [Link to relevant ADRs]
- [Link to external documentation]

## Changelog

| Date       | Change          | Author |
| ---------- | --------------- | ------ |
| YYYY-MM-DD | Initial version | Name   |

```

## Runbook Categories

Organize runbooks by category:

```

docs/runbooks/
├── deployment/
│ ├── deploy-to-production.md
│ ├── deploy-to-staging.md
│ └── rollback-deployment.md
├── database/
│ ├── database-migration.md
│ ├── backup-restore.md
│ └── seed-data.md
├── maintenance/
│ ├── dependency-updates.md
│ └── log-rotation.md
└── incident-response/
├── service-outage.md
└── data-corruption.md

```

## Command Standards

- All commands must be copy-paste ready
- Use environment variables for secrets: `$DATABASE_URL`
- Include `--dry-run` options where available
- Show both successful and error outputs

## Risk Levels

| Level | Definition | Review Required |
|-------|------------|-----------------|
| Low | No data loss risk, easily reversible | None |
| Medium | Potential service disruption | Team lead |
| High | Data loss risk, hard to reverse | Team approval |

## Quality Checklist

Before completing:
- [ ] All commands are copy-paste ready
- [ ] Expected outputs documented
- [ ] Failure scenarios covered
- [ ] Rollback procedure included
- [ ] Troubleshooting table complete
- [ ] Prerequisites clearly listed
- [ ] Time estimate provided

## Examples

- "Create a deployment runbook" -> Creates `/docs/runbooks/deployment/deploy-to-production.md`
- "Document the database migration process" -> Creates `/docs/runbooks/database/database-migration.md`
- "Write a runbook for resetting the local database" -> Creates `/docs/runbooks/database/reset-local-database.md`
```
