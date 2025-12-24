---
title: Runbooks
description: Operational procedures and deployment guides
---

# Runbooks

This folder contains operational runbooks - step-by-step procedures for common tasks like deployment, database operations, and incident response.

## What is a Runbook?

A runbook is a documented procedure that can be followed to complete a specific operational task. Good runbooks:

- Have **copy-paste ready commands**
- Include **expected outputs** for each step
- Document **failure scenarios** and recovery
- Provide **rollback procedures**

## Categories

### Deployment

- Production deployments
- Staging deployments
- Rollback procedures

### Database

- Database migrations
- Backup and restore
- Seed data management

### Maintenance

- Dependency updates
- Log management
- Performance tuning

### Incident Response

- Service outage procedures
- Data recovery

## Creating a New Runbook

Use the `document-runbook` Claude Skill to generate a properly formatted runbook:

```
"Create a runbook for [process name]"
```

The skill will:

- Apply the runbook template
- Include all required sections
- Create the file at `/docs/runbooks/[category]/[process-name].md`

## Index

| Category | Runbook         | Risk Level |
| -------- | --------------- | ---------- |
| -        | No runbooks yet | -          |

_Runbooks will be listed here as they are created._
