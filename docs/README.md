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

### Coming Soon
- **Search System** - Core search functionality and optimization strategies
- **Part Image Management** - 360° viewer, storage, and cleanup system
- **Authentication** - Admin auth and security (Phase 9)
- **Internationalization** - Translation system and language support

## Architecture Documentation

Core system architecture and design decisions.

### Database
- [Database Schema](./database/DATABASE.md) - Complete schema, relationships, and migration history

### Coming Soon
- **API Design** - REST conventions, error handling, and versioning
- **Service Layer** - Service pattern, dependency injection, and testing

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

**Last Updated**: October 23, 2025
