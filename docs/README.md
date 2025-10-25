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

### Coming Soon
- **Search System** - Core search functionality and optimization strategies
- **Part Image Management** - 360° viewer, storage, and cleanup system
- **Authentication** - Admin auth and security (Phase 9)

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

### For RAG-Ready Docs (in `features/` and `architecture/`)

**Purpose**: Comprehensive reference documentation for completed features

**Structure**:
1. **Overview** - What the feature does and why it exists
2. **Architecture** - How it works (diagrams, flow charts)
3. **API Reference** - Endpoints, parameters, responses
4. **Code Examples** - Real usage examples with context
5. **Error Handling** - Common issues and solutions
6. **Performance** - Benchmarks and optimization notes
7. **Testing** - How to test the feature
8. **Future Enhancements** - Planned improvements

**Style**:
- Include real code snippets from the codebase
- Add performance metrics from actual tests
- Cross-reference related docs
- Include troubleshooting sections
- Use clear headings for RAG searchability

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
