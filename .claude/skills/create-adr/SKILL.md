---
name: create-adr
description: Create MADR-format Architecture Decision Record. Use when recording an architectural decision, documenting a technical choice, or creating an ADR.
---

# ADR Creation Skill

## Instructions

When creating an ADR:

1. **Find the next ADR number** by checking `/docs/decisions/`
2. **Follow MADR template** exactly
3. **Output to** `/docs/decisions/NNNN-[kebab-case-title].md`

## MADR Template

```markdown
---
title: [Short Title]
description: [Brief description of the decision]
---

# [ADR Number]. [Title]

Date: [YYYY-MM-DD]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-NNNN]

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive

- Benefit 1
- Benefit 2

### Negative

- Drawback 1
- Trade-off accepted

### Neutral

- Neither good nor bad, but notable

## Options Considered

### Option 1: [Name]

Description of the option.

**Pros:**

- Pro 1
- Pro 2

**Cons:**

- Con 1
- Con 2

### Option 2: [Name]

Description of the option.

**Pros:**

- Pro 1

**Cons:**

- Con 1

## Related

- [Link to related ADR]
- [Link to relevant documentation]
- [Link to GitHub issue/discussion]
```

## ADR Naming Convention

Format: `NNNN-kebab-case-title.md`

Examples:

- `0001-use-supabase-for-database.md`
- `0002-tanstack-query-for-state.md`
- `0003-fumadocs-for-documentation.md`

## Status Definitions

| Status     | Meaning                                 |
| ---------- | --------------------------------------- |
| Proposed   | Under discussion, not yet decided       |
| Accepted   | Decision has been made and applies      |
| Deprecated | No longer applies, but kept for history |
| Superseded | Replaced by another ADR (link to it)    |

## When to Create an ADR

Create an ADR when:

- Choosing between technologies/libraries
- Defining architectural patterns
- Making decisions that affect multiple parts of the system
- Making decisions that are hard to reverse
- Team needs to understand "why" something was done

## Quality Checklist

Before completing:

- [ ] ADR number is sequential (check existing ADRs)
- [ ] Title is clear and descriptive
- [ ] Context explains the problem, not the solution
- [ ] Decision is stated clearly
- [ ] Consequences cover positive, negative, and neutral
- [ ] At least 2 options were considered
- [ ] Related links are included
- [ ] YAML frontmatter has title and description

## Examples

- "Create an ADR for choosing Supabase" -> Creates `/docs/decisions/0001-use-supabase-for-database.md`
- "Record the decision to use TanStack Query" -> Creates `/docs/decisions/0002-use-tanstack-query-for-state-management.md`
- "Document why we chose Fumadocs" -> Creates `/docs/decisions/0003-use-fumadocs-for-documentation.md`
