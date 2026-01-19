# ACR Automotive

> **End-to-end auto parts cross-reference platform** built for Mexican B2B distributors. Solo-developed from database design to production deployment.

![Demo](docs/demo.gif)

[![CI](https://github.com/amak07/acr-automotive/actions/workflows/ci.yml/badge.svg)](https://github.com/amak07/acr-automotive/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

**🚀 Live:** [Production Deployment](https://acr-automotive.vercel.app) | **📊 Status:** Production-ready with 9,600+ parts catalog

---

## 🎯 The Problem

Auto parts distributors face a critical challenge: when customers arrive with a competitor's part number (e.g., "MAZA 512345"), staff must quickly find the equivalent product in their own catalog. Manual lookups are slow and error-prone, costing time and sales.

## 💡 The Solution

A fast, mobile-optimized search platform that **instantly cross-references competitor SKUs to ACR parts**, complete with vehicle compatibility and technical specs. Built for tablet-wielding parts counter staff in the Mexican B2B market.

### Key Features

- **⚡ Dual Search Engine**: Vehicle-based (Make → Model → Year) or competitor SKU lookup
- **🔄 Cross-Reference Database**: 7,530+ competitor SKU mappings to ACR equivalents
- **📱 Mobile-First UI**: Tablet-optimized for parts counter operations
- **⚙️ Full Admin CRUD**: Complete parts management system with bulk import/export
- **🌍 Bilingual**: Spanish production deployment, English development workflow
- **📊 Performance**: Sub-300ms search response times maintained

---

## 🏗️ Technical Implementation

### Architecture

**Full-stack TypeScript application** with modern React patterns and PostgreSQL database.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Search UI     │────│   API Routes    │────│   Supabase      │
│   (Public)      │    │   (Business     │    │   (PostgreSQL + │
│                 │    │    Logic)       │    │    Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────│  Admin Portal   │
                        │  (Parts Mgmt)   │
                        └─────────────────┘
```

### Tech Stack

**Frontend**

- Next.js 15 (App Router) + React 19 + TypeScript 5.8
- TanStack Query 5.0 for server state management
- shadcn/ui + custom ACR design system
- Tailwind CSS with design tokens

**Backend**

- Next.js API Routes for business logic
- Supabase PostgreSQL with Row Level Security
- Zod schemas for runtime validation
- React Hook Form for complex forms

**Infrastructure**

- Vercel deployment with automatic CI/CD
- Supabase Cloud (managed PostgreSQL + Storage)
- Docker-based local development environment

### Database Design

Optimized 8-table schema focused on cross-reference performance:

```sql
-- Core tables
parts                  -- 865+ ACR parts catalog
cross_references       -- 7,530+ competitor SKU mappings
vehicle_applications   -- 2,304+ vehicle compatibility records
part_images           -- Product photography
part_360_frames       -- 360° product views
site_settings         -- Dynamic configuration
tenants               -- Multi-tenant support
import_history        -- Data lineage tracking
```

**Performance optimizations:**

- Indexed cross-reference lookups (sub-300ms)
- Denormalized makes/models (no join overhead)
- Strategic use of JSONB for flexible specifications

---

## 🚀 Development Highlights

### Solo Development Journey

**End-to-end ownership** of a production B2B platform:

1. ✅ Database schema design and migration system
2. ✅ Excel import pipeline (3,169 parts bootstrapped from spreadsheets)
3. ✅ Admin CRUD interface with validation and error handling
4. ✅ Public search engine with fuzzy matching
5. ✅ Production deployment and monitoring
6. ✅ Internationalization for Mexican market

### Technical Challenges Solved

**Challenge 1: Excel Data Import**

- **Problem**: Bootstrap 9,600+ parts from inconsistent Excel files
- **Solution**: Built type-safe parser with Zod validation, deduplication logic, and error recovery
- **Result**: Clean import of 865 parts + 7,530 cross-references + 2,304 vehicle applications

**Challenge 2: Search Performance**

- **Problem**: Complex queries (cross-reference + vehicle compatibility) risked slow responses
- **Solution**: Strategic indexing, denormalization, and TanStack Query caching
- **Result**: Maintained sub-300ms response times under production load

**Challenge 3: Admin UX for Non-Technical Users**

- **Problem**: Parts counter staff need to manage catalog without technical knowledge
- **Solution**: Mobile-first design, inline validation, progressive disclosure patterns
- **Result**: Intuitive interface enabling self-service parts management

---

## 📊 Project Scope

- **Lines of Code**: ~15,000+ TypeScript (excluding tests and config)
- **Components**: 80+ React components with custom design system
- **API Routes**: 25+ REST endpoints with validation middleware
- **Database**: 8 tables with 15+ indexes, RLS policies, triggers
- **Tests**: Core business logic coverage (Excel parsing, search, validation)
- **Documentation**: 12+ markdown files covering architecture, features, workflows

---

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop (for local Supabase)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd acr-automotive
npm install

# Start local database
npm run supabase:start

# Start dev server
npm run dev
# Open http://localhost:3000
```

**Detailed setup, environment configuration, and deployment instructions:** See [SETUP.md](docs/SETUP.md)

---

## 📚 Documentation

**Core Documentation**

- [SETUP.md](docs/SETUP.md) - Complete installation and environment setup
- [PLANNING.md](docs/PLANNING.md) - Technical architecture and implementation strategy
- [DATABASE.md](docs/database/DATABASE.md) - Schema reference and workflows
- [SCRIPTS.md](SCRIPTS.md) - NPM scripts organized by workflow

**Architecture Deep Dives**

- [Architecture Overview](docs/architecture/OVERVIEW.md) - System design patterns
- [API Design](docs/architecture/API_DESIGN.md) - RESTful conventions
- [State Management](docs/architecture/STATE_MANAGEMENT.md) - TanStack Query patterns
- [Component Architecture](docs/architecture/COMPONENT_ARCHITECTURE.md) - Design system

**Feature Documentation**

- [Excel Export](docs/features/data-management/EXCEL_EXPORT.md) - Bulk export with pagination bypass
- [Bulk Operations](docs/features/data-management/BULK_OPERATIONS.md) - Batch CRUD APIs

---

## 🎯 Current Status

**Phase**: ✅ Production Deployment Complete

- ✅ Database foundation and migration system
- ✅ Excel import pipeline (bootstrap complete)
- ✅ Admin CRUD interface (full parts management)
- ✅ Public search (vehicle + SKU cross-reference)
- ✅ Production deployment on Vercel
- 🎯 Spanish translation (in progress)

**Next Steps**: Final polish for Mexican market deployment

---

## 🤝 Development Notes

This project demonstrates:

- **Full-stack TypeScript expertise** (Next.js, React, PostgreSQL)
- **Production-ready code quality** (strict TypeScript, Zod validation, error handling)
- **Performance optimization** (sub-300ms API responses, strategic caching)
- **Database design** (normalized schema, indexing strategy, migrations)
- **Solo ownership** (requirements → design → development → deployment)
- **B2B domain knowledge** (auto parts industry, cross-reference workflows)

---

**Built for the Mexican auto parts market** • **Production-ready deployment** • **Solo full-stack development**
