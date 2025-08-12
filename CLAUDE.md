# CLAUDE_RULES.md - ACR Automotive

> **Instructions for Claude Code**: Always read this file at the start of each conversation to understand project coding standards and patterns for ACR Automotive.

## 🔄 Project Awareness & Context

- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASKS.md`** before starting a new task. If the task isn't listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.
- **Remember the business context**: ACR Automotive is an auto parts cross-reference search website for Humberto's manufacturing business in Mexico.

## 🧱 Code Structure & Modularity

- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Follow Next.js App Router conventions** with proper file-based routing structure.
- **Use TypeScript strictly** - avoid `any` types, prefer proper type definitions.
- **Organize code into clearly separated modules**, grouped by feature or responsibility (excel, search, admin, parts).

## 🎨 React/Next.js Specific Rules

- **Use shadcn/ui component pattern** - copy components into our codebase, don't import from external libraries when possible.
- **Follow component ownership philosophy** - we own and can modify all UI components.
- **Use React Hook Form + Zod** for all form handling and validation.
- **Implement proper error boundaries** and loading states for better UX.
- **Use TanStack Query** for all server state management and API calls.

## 🗄️ Database & API Patterns (Supabase Focus)

- **Use Supabase client** for all database operations with proper type safety.
- **Implement Zod validation** on both client and server sides.
- **Follow REST conventions** for API routes with proper HTTP methods and status codes.
- **Use proper select/include** in Supabase queries for performance.
- **Never expose sensitive data** - use proper select statements and RLS policies.
- **Use Supabase Storage** for all file uploads (Excel files, part images).

## 🌍 Internationalization Rules

- **All UI text must be translatable** - use the custom i18n system from day 1.
- **Development language**: English for development and testing.
- **Production language**: Spanish for Mexican auto parts market.
- **Never hardcode text** - always use translation keys: `t('search.vehicle')` not "Search by Vehicle".
- **Technical terms**: Keep part names and technical specifications in their industry-standard form.

## 🧪 Testing & Reliability (Simplified for ACR)

- **Follow the testing strategy** outlined in `TESTING.md` - focus on core business logic only.
- **Always test Excel parsing functions** - data accuracy is business-critical.
- **Always test search functions** - cross-reference accuracy impacts credibility.
- **Use type-safe test factories** to ensure schema changes break tests appropriately.
- **Test behaviors, not implementations** - focus on what the code does for Humberto's business.
- **Skip UI testing for MVP** - focus on data integrity and search accuracy.

## ✅ Task Completion

- **Mark completed tasks in `TASKS.md`** immediately after finishing them.
- **Add new sub-tasks or TODOs** discovered during development to `TASKS.md` under the appropriate phase.
- **Update PLANNING.md** when architectural decisions change or new requirements emerge.

## 📎 Style & Conventions (ACR Specific)

- **Use TypeScript** with strict mode enabled.
- **Follow Next.js App Router patterns** - use proper layout.tsx, page.tsx, route.ts conventions.
- **Use Tailwind CSS** for styling with consistent utility classes.
- **Implement proper ESLint and Prettier** configurations.
- **Use consistent import patterns** - prefer absolute imports with `@/` prefix.
- **Spanish variable names for business concepts**: `parteSKU`, `marcaVehiculo` when appropriate.

## 🔐 Security & Environment (MVP Considerations)

- **Never hardcode secrets** - always use environment variables.
- **Use mock authentication** for MVP development - real auth comes post-MVP.
- **Validate all Excel input data** with Zod schemas - invalid data blocks import.
- **Use Supabase RLS policies** for data access control.
- **Hash any sensitive data** with proper algorithms when real auth is added.

## 📚 Documentation & Explainability

- **Update documentation** when adding new features or changing setup steps.
- **Comment complex Excel parsing logic** with clear explanations.
- **Use JSDoc comments** for utility functions and custom hooks.
- **Maintain consistent component prop interfaces** with proper TypeScript types.
- **Document business logic**: Explain why cross-reference mappings work the way they do.

### README.md Maintenance Standards

The README.md serves as the primary showcase for this project in professional interviews and public repositories. It must be maintained with high quality standards:

**Quality Requirements:**

- ✅ **Simple, clear language** - Accessible to both technical and business audiences
- ✅ **Professional presentation** - Proper formatting, badges, and structure
- ✅ **Concise but comprehensive** - Cover all key aspects without overwhelming detail
- ✅ **Interview-ready** - Demonstrates technical competency and business understanding

**Update Triggers (When README Must Be Updated):**

- **Major architecture changes** - Tech stack modifications, deployment changes
- **New core features** - Search functionality, admin capabilities, data management
- **Performance improvements** - Significant optimization achievements
- **Production deployment** - Live application URLs and usage instructions
- **Security enhancements** - Authentication implementation, data protection measures

**Maintenance Guidelines:**

- Keep technical accuracy current with actual implementation
- Update installation and setup instructions when dependencies change
- Refresh performance metrics when optimizations are implemented
- Maintain professional tone suitable for portfolio presentation
- Update business context if use case or target market evolves

**Review Schedule:**

- **End of each development phase** - Ensure README reflects completed features
- **Before production deployment** - Verify all setup instructions are accurate
- **When sharing publicly** - Confirm professional presentation standards are met

The README should always represent the current state of the application and serve as an effective introduction for potential employers, collaborators, or stakeholders.

## 🚗 Business Logic Rules (Auto Parts Specific)

- **SKU format validation**: Understand ACR vs competitor SKU patterns.
- **Cross-reference accuracy**: Competitor SKU → ACR part mapping must be perfect.
- **Vehicle compatibility**: Part must actually fit the specified vehicle make/model/year.
- **Part categorization**: Humberto specializes in MAZAS - validate part types accordingly.
- **Excel structure respect**: Always follow columns A-N mapping as specified.
- **Spanish market focus**: UI, terminology, and user experience for Mexican auto parts industry.

## 🧠 AI Behavior Rules

- **Never assume missing context** - ask questions if uncertain about auto parts requirements.
- **Only use verified packages** from the tech stack specification - don't hallucinate dependencies.
- **Always confirm file paths exist** before referencing them in code.
- **Follow the established patterns** from PLANNING.md for consistency.
- **Focus on one task at a time** for better code quality.
- **Never delete existing code** unless explicitly instructed or part of a defined task.
- **Understand the business**: This is B2B auto parts, not consumer e-commerce.

## 🚀 Deployment & Infrastructure (Supabase + Vercel)

- **Use Vercel** deployment patterns for Next.js applications.
- **Configure Supabase** for database, storage, and auth (when added post-MVP).
- **Configure proper environment variables** for different environments (local, dev, production).
- **Follow the established CI/CD workflow** with main branch deployments.
- **Use Supabase local development** for testing database operations.

## 📊 Data Management Rules

- **Excel is the source of truth** - database reflects Excel uploads.
- **Block imports on ANY errors** - data integrity is paramount.
- **Handle 2300+ parts efficiently** - optimize for Humberto's actual data size.
- **Preserve cross-reference relationships** - competitor SKU mappings are business-critical.
- **Image management via admin interface** - no Google Drive migration.
- **Monthly update cycle** - optimize for Humberto's workflow, not real-time changes.

## 🔍 Search & Performance Rules

- **Sub-300ms search response times** - counter staff need fast results.
- **Support fuzzy matching** - handle typos in SKU searches gracefully.
- **Vehicle search progression**: Make → Model → Year → Part Type dropdowns.
- **SKU prominence in results** - part numbers are primary identifiers.
- **Mobile tablet optimization** - interface used at parts counters.
- **Professional B2B design** - follow Baleros-Bisa reference patterns.

## 🌟 MVP Focus Rules

- **Skip authentication for now** - mock admin mode in development.
- **Core features first**: Excel parsing → Search → Admin upload.
- **No over-engineering**: Simple solutions that solve Humberto's immediate needs.
- **Three tables only**: parts, vehicle_applications, cross_references.
- **Post-MVP features clearly marked**: Don't implement until MVP is complete.

## 🚨 Critical Success Factors

- **Data accuracy**: Excel parsing must be 100% accurate.
- **Search reliability**: Cross-reference lookup must never fail.
- **Performance**: Fast search results for counter staff.
- **Usability**: Simple admin interface for monthly Excel uploads.
- **Spanish interface**: Production ready for Mexican market.

## 🔧 Development Priorities

1. **Database schema and Excel parsing** (Foundation)
2. **Search functionality** (Core value)
3. **Admin interface** (Business operations)
4. **Translation and polish** (Production ready)
5. **Authentication and advanced features** (Post-MVP)

---

## 📝 Quick Reference

### **Current Tech Stack**

- Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Supabase (Database + Storage)
- TanStack Query + Zustand
- Custom i18n (English dev, Spanish prod)

### **Business Context**

- Auto parts cross-reference search
- Mexican B2B market (distributors, counter staff)
- Humberto's manufacturing business (MAZAS specialty)
- Monthly Excel updates (~2,336 parts)
- Professional, tablet-friendly interface

### **Key Files to Reference**

- `PLANNING.md` - Complete project architecture
- `TASKS.md` - Development roadmap and priorities
- `TESTING.md` - Testing strategy for core features
- Excel analysis - Columns A-N mapping to database

---

_Following these rules ensures consistency with ACR Automotive's specific business needs and technical requirements. Always prioritize data accuracy and search reliability - these are the core business values._
