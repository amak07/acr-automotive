# ACR Automotive

> **Custom digital catalog and search platform** built for ACR Automotive, a Mexican brake and hub assembly distributor. First web presence showcasing their complete product inventory with intelligent cross-reference search. Solo-developed from database design to production deployment.

![Demo](docs/demo.gif)

[![CI](https://github.com/amak07/acr-automotive/actions/workflows/ci.yml/badge.svg)](https://github.com/amak07/acr-automotive/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

**🚀 Live:** [Production Deployment](https://acr-automotive.vercel.app) | **📊 Status:** Production-ready with complete parts catalog

---

## 🎯 The Problem

ACR Automotive, a Mexican brake and hub assembly distributor, had no digital presence. The owner (Humberto) relied on printed catalogs when traveling or meeting with retailers. Retail counter staff selling ACR products couldn't quickly look up parts when customers arrived with competitor part numbers (e.g., "Timken TM512345"). Manual catalog searches were slow, error-prone, and hurt sales.

## 💡 The Solution

A custom web platform serving as **ACR's first digital catalog** with intelligent search capabilities. The platform enables three key user groups to instantly find parts:

1. **Humberto (Owner)**: Access complete catalog on-the-go during travel and client meetings
2. **ACR Staff**: Manage inventory and respond to retailer inquiries quickly
3. **Retail Counter Staff**: Cross-reference competitor SKUs to ACR equivalents when serving customers

### Key Features

- **🎨 First Digital Presence**: Professional branded catalog showcasing ACR's brake and hub assembly inventory
- **⚡ Intelligent Search**: Dual-mode system supporting vehicle lookup (Make → Model → Year) and competitor SKU cross-reference with 6-stage matching algorithm (exact match → normalized match → partial match → fuzzy matching)
- **📱 Mobile-Optimized**: Tablet-friendly interface for on-the-go access and retail counter use
- **⚙️ Complete Admin Portal**: Full inventory management with bulk import/export for ACR staff
- **🌍 Bilingual Ready**: English development, Spanish production deployment for Mexican market
- **📊 Fast Performance**: Sub-300ms search responses maintained

---

## 🏗️ Architecture

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

---

## 🚀 Technical Highlights

**Solo full-stack development** of a production B2B platform:

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.8, TanStack Query, shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL, Zod validation, React Hook Form
- **Infrastructure**: Vercel deployment, Supabase Cloud, Docker development environment

### Key Features Built

- **6-stage intelligent search**: Exact → normalized → partial → competitor → fuzzy SKU matching (sub-300ms)
- **Excel import pipeline**: Type-safe parser with Zod validation (bootstrapped complete catalog)
- **8-table PostgreSQL schema**: Optimized with indexes, triggers, and RLS policies
- **80+ React components**: Custom ACR design system
- **Mobile-first UX**: Cascading dropdowns, progressive disclosure for non-technical users

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

---

## 📚 Documentation

Complete technical documentation available in the [docs/](docs/) directory:

- **[Developer Guide](docs/developer-guide/)** - Search system implementation, Excel processing
- **[Admin Guide](docs/admin-guide/)** - Managing parts, images, and data imports
- **[Architecture](docs/architecture/)** - System design patterns and decisions
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation

---

**Built for ACR Automotive** • **Production-ready** • **Solo full-stack development**
