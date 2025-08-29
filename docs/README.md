# ACR Automotive Documentation

## Project Overview

ACR Automotive is an auto parts cross-reference search system for Humberto's manufacturing business in Mexico. This documentation covers the complete system architecture, implementation details, and development workflows.

## Documentation Structure

### 📁 `/architecture`
High-level system design and architectural decisions.

*Coming soon:*
- `SYSTEM_OVERVIEW.md` - Complete system architecture
- `SEARCH_ARCHITECTURE.md` - Search system design patterns
- `API_DESIGN.md` - API endpoint specifications

### 📁 `/database` 
Database schema, queries, and Supabase configuration.

- [`SUPABASE_SETUP.md`](./database/SUPABASE_SETUP.md) - Complete database setup guide
  - Schema design rationale
  - Performance optimization
  - Security policies
  - Deployment process

### 📁 `/excel-processing`
Excel file parsing, validation, and data import systems.

- [`EXCEL_DATA_STRUCTURE.md`](./excel-processing/EXCEL_DATA_STRUCTURE.md) - Excel file formats
- [`EXCEL_PARSING.md`](./excel-processing/EXCEL_PARSING.md) - Parser implementation
- [`EXCEL_VALIDATION.md`](./excel-processing/EXCEL_VALIDATION.md) - Data validation rules

*Coming soon:*
- `DATABASE_IMPORT.md` - Excel to database import workflow
- `CONFLICT_DETECTION.md` - Data integrity validation

### 📁 `/search`
Search functionality, algorithms, and performance optimization.

*Coming soon:*
- `SEARCH_IMPLEMENTATION.md` - Search system implementation
- `FUZZY_SEARCH.md` - Trigram search algorithms
- `PERFORMANCE_OPTIMIZATION.md` - Search performance tuning

### 📁 `/admin`
Admin interface, image management, and content management.

*Coming soon:*
- `ADMIN_INTERFACE.md` - Admin panel design
- `IMAGE_MANAGEMENT.md` - Part image upload system
- `CONTENT_MANAGEMENT.md` - Data management workflows

### 📁 `/deployment`
Deployment guides, environment configuration, and production setup.

*Coming soon:*
- `VERCEL_DEPLOYMENT.md` - Next.js deployment guide
- `ENVIRONMENT_CONFIG.md` - Environment variables guide
- `PRODUCTION_CHECKLIST.md` - Go-live checklist

## Quick Start Guide

### For Developers
1. **Read**: [`/database/SUPABASE_SETUP.md`](./database/SUPABASE_SETUP.md) - Understanding the database
2. **Read**: [`/excel-processing/EXCEL_PARSING.md`](./excel-processing/EXCEL_PARSING.md) - Data processing workflow
3. **Setup**: Follow environment configuration in deployment docs
4. **Develop**: Reference API documentation for endpoints

### For Business Users
1. **Overview**: Read project goals in PLANNING.md (root directory)
2. **Data**: Understand Excel file requirements in excel-processing docs
3. **Usage**: Admin interface documentation (coming soon)

## Development Phases

### ✅ Phase 1: Foundation (Complete)
- Database schema design and deployment
- Excel parsing system implementation
- Data validation and conflict detection

### 🔄 Phase 2: Core Features (In Progress)
- Database import functionality
- Search interface implementation
- Admin panel development

### 📋 Phase 3: Production (Planned)
- Performance optimization
- Spanish localization
- Production deployment

## Contributing Guidelines

### Documentation Standards
- **File naming**: Use UPPERCASE for main docs (e.g., `SUPABASE_SETUP.md`)
- **Folder structure**: Group by feature/system area
- **Content**: Include business context, technical details, and examples
- **Code samples**: Always include working code examples
- **Links**: Use relative links between documentation files

### Adding New Documentation
1. **Identify**: Which folder does this belong to?
2. **Create**: Follow naming conventions
3. **Link**: Update this README with new file references
4. **Review**: Ensure examples work with current codebase

## Current Status

### 🎯 **Completed Features**
- ✅ **Database Schema**: 3 tables deployed to Supabase
- ✅ **Excel Parsers**: PRECIOS (865 parts) + CATALOGACION (2,304 applications)
- ✅ **Search Functions**: Multi-fallback SKU search + vehicle search
- ✅ **Conflict Detection**: Data integrity validation
- ✅ **Performance Optimization**: Indexes + fuzzy search

### 🔄 **In Development**
- Database import workflow
- Admin interface for Excel uploads
- Search interface implementation

### 📊 **Real Data Results**
- **PRECIOS**: 865 parts, 7,530 cross-references processed
- **CATALOGACION**: 740 parts, 2,304 vehicle applications processed
- **Performance**: <200ms Excel processing target achieved
- **Database**: Deployed and tested with real data structure

## Support and Questions

- **Technical Issues**: Check troubleshooting sections in relevant docs
- **Business Questions**: Reference PLANNING.md and TASKS.md in project root
- **Development Setup**: Follow quick start guide above

---

*Last Updated: January 2025 - Phase 1 Foundation Complete*