---
name: document-feature
description: Generate standardized feature documentation using Good Docs templates. Use when documenting a feature, creating feature docs, or writing technical documentation for a specific capability.
---

# Feature Documentation Skill

## Instructions

When documenting a feature:

1. **Explore the codebase** to find all related files for this feature
2. **Read the template** at `/docs/templates/FEATURE.md`
3. **Generate Mermaid diagrams** for architecture (C4 style)
4. **Include real code examples** from the codebase (not hypothetical)
5. **Check for existing ADRs** in `/docs/decisions/` related to this feature
6. **Output to** `/docs/features/[feature-name].md`

## Template Structure (Good Docs Project - Concept + How-to + Reference)

The feature doc MUST include these sections in order:

```markdown
# Feature: [Feature Name]

## Overview

- **Purpose**: One-sentence description
- **User Story**: As a [user], I want to [action] so that [benefit]
- **Status**: Complete | In Progress | Planned
- **Location**: `/path/to/feature`

## Architecture

### System Context (C4 Level 1)

[Mermaid diagram showing feature in system context]

### Components (C4 Level 3)

[Mermaid diagram showing internal components]

### Data Flow

[Sequence diagram of primary use case]

## API Reference

| Endpoint   | Method | Purpose |
| ---------- | ------ | ------- |
| `/api/...` | GET    | ...     |

### Request/Response Examples

[Code blocks with real examples]

## How-To Guides

### How to [common task 1]

### How to [common task 2]

## Technical Decisions (ADRs)

### Decision: [Title]

- **Context**: Why this decision was needed
- **Decision**: What was chosen
- **Consequences**: Trade-offs accepted

## Testing

- Unit tests: `path/to/tests`
- How to run: `npm test -- feature-name`

## Related Documentation

- [Link to related feature]
- [Link to architecture doc]
```

## Diagram Standards

- Use Mermaid for all diagrams
- C4-style naming: System, Container, Component
- Sequence diagrams for data flows
- Include legends for complex diagrams

## Quality Checklist

Before completing:

- [ ] All template sections included
- [ ] At least one architecture diagram
- [ ] Real code examples from codebase
- [ ] File paths verified to exist
- [ ] Links to related docs work

## Examples

- "Document the public search feature" -> Creates `/docs/features/search/PUBLIC_SEARCH.md`
- "Create feature documentation for Excel import" -> Creates `/docs/features/data-management/EXCEL_IMPORT.md`
