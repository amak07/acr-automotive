---
title: "ACR Automotive Documentation Index"
---

# ACR Automotive Documentation Index

> **Navigation guide** for all project documentation

## Quick Start

- [PLANNING.md](./PLANNING.md) - Technical architecture, tech stack, and implementation strategy
- [TASKS.md](./TASKS.md) - Current development roadmap and session tracking
- [TESTING.md](./TESTING.md) - Testing strategy and guidelines
- [ENHANCEMENTS.md](./ENHANCEMENTS.md) - Future improvements and feature ideas

## Feature Documentation

High-level feature documentation for RAG and developer reference.

### Data Management

- [Bulk Operations API](./features/data-management/BULK_OPERATIONS.md) - ✅ Batch create/update/delete operations for parts, vehicles, and cross-references
- [Excel Export](./features/data-management/EXCEL_EXPORT.md) - ✅ Excel generation with pagination bypass and hidden columns
- [Bulk Image Upload](./features/data-management/BULK_IMAGE_UPLOAD.md) - ✅ Folder-based image upload with SKU detection, 360° frame processing, and concurrent uploads

### Coming Soon

- **Authentication** - Admin auth and security (Phase 9)

## Developer Guides

Architecture-focused guides explaining core technical implementations and design decisions.

- **[Search System](./developer-guide/search/)** - ✅ 6-stage fallback algorithm with normalization and fuzzy matching
  - [Overview](./developer-guide/search/index.mdx) - Architecture deep-dive, RPC functions, design decisions
  - [Performance](./developer-guide/search/performance.mdx) - Optimization techniques, N+1 prevention, benchmarks

- **[Excel Data Processing](./developer-guide/excel-processing.mdx)** - ✅ Export-import lifecycle with ID-based change tracking
  - Multi-stage import workflow (validate → preview → execute)
  - Atomic transactions and snapshot-based rollback
  - Export pagination and hidden column implementation

## Architecture Documentation

Core system architecture and design decisions.

### System Architecture

- [Overview](./architecture/OVERVIEW.md) - ✅ 30,000-foot view of system architecture, layers, and design principles
- [API Design](./architecture/API_DESIGN.md) - ✅ RESTful patterns, error handling, and response formats
- [Validation](./architecture/VALIDATION.md) - ✅ Zod schema patterns and type inference
- [Service Layer](./architecture/SERVICE_LAYER.md) - ✅ When to use services, patterns, and examples
- [State Management](./architecture/STATE_MANAGEMENT.md) - ✅ TanStack Query and React Context patterns
- [Data Flow](./architecture/DATA_FLOW.md) - ✅ Request lifecycle, caching, and performance optimizations
- [Internationalization](./architecture/INTERNATIONALIZATION.md) - ✅ Custom i18n system architecture
- [Component Architecture](./architecture/COMPONENT_ARCHITECTURE.md) - ✅ ACR design system patterns and usage

### Database

- [Database Schema](./database/DATABASE.md) - Complete schema, relationships, and migration history

## Technical Plans

Implementation plans and phase documentation (work in progress).

Located in: [technical-plans/](./technical-plans/)

## Excel Documentation

Excel template specifications and import/export formats.

Located in: [excel/](./excel/)

---

## Documentation Standards

### Structure (Adapt as Needed)

Not all sections required - use what makes sense for the feature:

1. **Overview** - What it does, why it exists, real-world context
2. **Architecture** - How it works (diagrams, data flow, actual implementation)
3. **Code Examples** - Real code from codebase with file paths and line numbers
4. **API Reference** - Endpoints, parameters, responses (if applicable)
5. **Verification** - How to confirm it works (basic smoke tests)

### Writing Tone

- Clear and accessible language
- Explain concepts using "What it is / Why it matters / How it works" structure
- Provide real-world context and examples
- NO audience callouts ("for junior devs") or skill level labels

### Critical Rules

1. **Ground truth only** - Document what exists in code. No estimates, projections, or speculation.
2. **Clarity without meta-commentary** - Write clearly, don't announce audience or purpose.
3. **Real code only** - All examples reference actual files with paths (e.g., [src/app/api/route.ts:42](src/app/api/route.ts#L42)).
4. **Measured metrics only** - If metrics don't exist, omit the section. Don't estimate.
5. **Diagrams when helpful** - Use Mermaid to clarify architecture/flow, not for decoration.
6. **No operational content** - Troubleshooting → runbooks. Future plans → TASKS.md/ENHANCEMENTS.md.

### Full Principles

See [.claude/skills/DOCUMENTATION_PRINCIPLES.md](.claude/skills/DOCUMENTATION_PRINCIPLES.md) for complete guidance.

### For Technical Plans (in `technical-plans/`)

**Purpose**: Planning documents and work-in-progress specifications

**Structure**:

1. **Problem Statement**
2. **Solution Design**
3. **Implementation Steps**
4. **Testing Plan**
5. **Rollout Strategy**

**Lifecycle**: Move to feature docs when complete

---

**Last Updated**: October 25, 2025
