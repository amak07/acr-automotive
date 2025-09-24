# CLAUDE.md - ACR Automotive Context

> **Claude Code Initialization**: Read this file to understand project structure and development patterns.

## 🔄 Session Setup

**Before starting any work:**

1. **Read `docs/PLANNING.md`** - Technical architecture, tech stack, and implementation strategy
2. **Check `docs/TASKS.md`** - Current development priorities and session state

## 📁 Key File Locations

### Documentation

- `docs/PLANNING.md` - Architecture & tech stack
- `docs/TASKS.md` - Development roadmap
- `docs/ENHANCEMENTS.md` - Future improvements
- `docs/TESTING.md` - Testing strategy
- `README.md` - Project overview & setup

### Technical References

- `src/lib/supabase/schema.sql` - Complete database schema
- `src/components/acr/README.md` - Design system documentation
- `scripts/` - Database bootstrap and utility scripts

## 🎯 Project Context

**ACR Automotive**: Production-ready auto parts cross-reference search platform
**Status**: ✅ Deployed to production with complete parts catalog
**Current Phase**: Spanish translation and final polish

## 🧱 Core Development Standards

### Code Quality

- **File size limit**: 500 lines max - split into modules if exceeded
- **TypeScript strict**: No `any` types, prefer proper type definitions
- **Component ownership**: Use shadcn/ui pattern - copy components, don't import externally

### Architecture Patterns

- **Next.js App Router**: Follow proper layout.tsx, page.tsx, route.ts conventions
- **Database**: Supabase with type-safe operations and Zod validation
- **State Management**: TanStack Query + React Context (no Zustand)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS + ACR design system (`src/components/acr/`)

### Development Workflow

- **Task tracking**: Update `docs/TASKS.md` when starting/completing work
- **Documentation**: Update relevant docs when making architectural changes
- **Testing**: Focus on core business logic (Excel parsing, search, data integrity)
- **Internationalization**: All UI text must use translation keys

## 🔧 Technical Notes

- **Database**: 3-table design (parts, vehicle_applications, cross_references)
- **Performance target**: Sub-300ms search response times
- **Mobile focus**: Tablet-optimized for parts counter staff
- **Authentication**: MVP password protection (production upgrade planned)

## 🚨 Critical Rules

- **Never assume context** - ask questions if uncertain about requirements
- **Verify file paths** before referencing them in code
- **Follow established patterns** from PLANNING.md
- **One task at a time** for better code quality
- **Data integrity first** - validate all inputs with Zod schemas

---

_For detailed information, always reference the specific documentation files listed above. This file provides context structure, not implementation details._
