---
title: Architecture Decision Records
description: Records of significant architectural decisions made in the project
---

# Architecture Decision Records (ADRs)

This folder contains Architecture Decision Records (ADRs) that document significant technical decisions made during the development of ACR Automotive.

## What is an ADR?

An ADR is a document that captures an important architectural decision along with its context and consequences. ADRs help:

- **Document the "why"** behind technical choices
- **Onboard new team members** by explaining past decisions
- **Avoid revisiting** already-decided topics
- **Track evolution** of the architecture over time

## ADR Format

We use the [MADR (Markdown Any Decision Records)](https://adr.github.io/madr/) format:

1. **Status**: Proposed, Accepted, Deprecated, or Superseded
2. **Context**: What issue motivated this decision?
3. **Decision**: What change are we making?
4. **Consequences**: What becomes easier or harder?
5. **Options Considered**: What alternatives were evaluated?

## Creating a New ADR

Use the `create-adr` Claude Skill to generate a properly formatted ADR:

```
"Create an ADR for [decision topic]"
```

The skill will:

- Determine the next ADR number
- Apply the MADR template
- Create the file at `/docs/decisions/NNNN-title.md`

## Index

| Number | Title       | Status | Date |
| ------ | ----------- | ------ | ---- |
| -      | No ADRs yet | -      | -    |

_ADRs will be listed here as they are created._
