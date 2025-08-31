# ACR Automotive

A professional auto parts cross-reference search platform built for Mexican B2B distributors. This application enables parts counter staff to quickly find equivalent parts using competitor SKUs or vehicle specifications.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## 🎯 Purpose

ACR Automotive solves a critical problem in the auto parts industry: **cross-reference part lookup**. When a customer comes to a parts counter with a competitor's part number, staff can instantly find the equivalent ACR part, complete with vehicle compatibility and technical specifications.

### Key Features

- **🔍 Dual Search System**: Search by vehicle (Make → Model → Year) or by competitor SKU
- **⚡ Fast Cross-Reference**: Competitor part numbers instantly mapped to ACR equivalents
- **📱 Mobile-First Design**: Optimized for tablets used at parts counters
- **🌍 Bilingual Support**: English development, Spanish production (Mexican market)
- **📊 Excel Integration**: Monthly data updates via Excel upload with conflict detection and validation
- **🖼️ Image Management**: Admin interface for product photos

## 🏗️ Technical Architecture

### Built With

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **Database**: Supabase with Row Level Security
- **Storage**: Supabase Storage for images and Excel files
- **State Management**: TanStack Query + Zustand
- **UI Components**: shadcn/ui (owned components, not external dependencies)
- **Deployment**: Vercel with Supabase integration

### Architecture Highlights

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │────│   API Routes    │────│   Supabase      │
│   (Frontend)    │    │   (Business     │    │   (Database +   │
│                 │    │    Logic)       │    │    Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────│  Admin Panel    │
                        │  (Excel Upload) │
                        └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd acr-automotive
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Add your Supabase URL and anon key
   ```

4. **Set up the database**

   ```bash
   # Run database migrations
   npm run db:setup
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📋 Available Scripts

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Start development server               |
| `npm run build`         | Build for production                   |
| `npm run start`         | Start production server                |
| `npm run lint`          | Run ESLint                             |
| `npm run type-check`    | Run TypeScript type checking           |
| `npm test`              | Run test suite                         |
| `npm run test:watch`    | Run tests in watch mode                |
| `npm run test:coverage` | Run tests with coverage                |
| `npm run test:full`     | TypeScript check + tests (recommended) |

## 🗄️ Database Schema

The application uses a streamlined 3-table design optimized for auto parts data:

```sql
-- Main parts catalog
parts (acr_sku, competitor_sku, part_type, position, specifications, image_url, ...)

-- Vehicle compatibility
vehicle_applications (part_id, make, model, year_range)

-- Cross-reference mapping
cross_references (acr_part_id, competitor_sku, competitor_brand)
```

### Key Design Decisions

- **No separate lookup tables**: Makes/models/categories extracted dynamically
- **Cross-reference focused**: Optimized for competitor SKU → ACR part mapping
- **Performance indexes**: Sub-300ms search response times
- **Row Level Security**: Public read access, admin-only writes

## 🔍 Search Functionality

### Vehicle Search

Multi-step dropdown progression matching industry standards:

```
Category → Make → Model → Year → Search Results
```

### SKU Cross-Reference Search

Intelligent SKU matching with multiple strategies:

1. **Exact ACR SKU match** - Direct product lookup
2. **Cross-reference match** - Competitor SKU → ACR equivalent
3. **Fuzzy match** - Handle typos and variations

## 📊 Data Management

### Excel Integration

- **Monthly uploads**: Complete data refresh cycle
- **Validation**: Block imports on any data errors
- **Preview**: Show changes before applying
- **Columns A-N mapping**: Structured data extraction

### Image Management

- **Admin upload interface**: Link images to parts
- **Supabase Storage**: CDN-distributed images
- **Optimized delivery**: WebP conversion and responsive sizing

## 📋 Excel Data Format Guidelines (For Humberto)

### ⚠️ IMPORTANT: Updated Data Structure (January 2025)

The system now requires **normalized Excel data** for optimal search performance. This change is **critical** for the search functionality to work correctly.

#### ❌ Previous Format (Problematic):
```
Row 75: ACR512332 | OEM: "4766719AA 3785A008 04766719AB 05105719AC 05105770AF 05105770AG"
```
*This format caused search failures and database errors.*

#### ✅ NEW Required Format (Normalized):
```
Row 75a: ACR512332 | OEM: "4766719AA"
Row 75b: ACR512332 | OEM: "3785A008"  
Row 75c: ACR512332 | OEM: "04766719AB"
Row 75d: ACR512332 | OEM: "05105719AC"
Row 75e: ACR512332 | OEM: "05105770AF"
Row 75f: ACR512332 | OEM: "05105770AG"
```

### 📋 Complete List of ACR SKUs That Need Normalization:

Based on the current Excel file analysis, these specific ACR SKUs contain multiple competitor SKUs that need to be split into separate rows:

#### **High Priority (Most Complex):**
- **ACR512332** - 6 OEM cross-references (shown above)
- **ACR513308** - 6 OEM cross-references in both OEM and OEM2 columns
- **ACR512305** - Multiple cross-references across OEM column
- **ACR518510** - Multiple cross-references in both OEM and OEM2 columns

#### **Medium Priority:**
- **ACR513105** - Multiple Honda cross-references in OEM2 column
- **ACR512169** - Multiple cross-references in both OEM columns

#### **Plus 103 other ACR SKUs** with similar issues in OEM/OEM2 columns

### 🎯 **Quick Identification Method:**

**To find all problematic rows in your Excel:**
1. **Search for spaces in OEM columns**: Look for cells in columns I & J (OEM/OEM2) that contain multiple part numbers separated by spaces
2. **Look for long entries**: Any cell with more than 20 characters probably contains multiple SKUs
3. **Check the ACR SKUs listed above**: These are confirmed to need splitting

**Time-Saving Tip**: Focus on the **High Priority** SKUs first - they represent the most complex cases and will give you the biggest improvement in search performance.

### 📝 Excel Formatting Rules:

1. **Multiple Rows for Multiple Cross-References**: 
   - If one ACR part has 6 competitor SKUs, create 6 separate rows
   - Each row should have the same ACR SKU but ONE competitor SKU per brand column

2. **One SKU Per Cell**:
   - Never put multiple part numbers in a single cell separated by spaces
   - Each competitor brand column should contain only ONE part number

3. **Empty Cells Are OK**:
   - Not every row needs to have all brand columns filled
   - Focus on creating separate rows for each actual cross-reference

### 💡 Example Conversion:

**Before (Multiple SKUs in one cell):**
| ACR | NATIONAL | TMK | OEM | 
|-----|----------|-----|-----|
| ACR512332 | NAT123 | TM456 | "4766719AA 3785A008 04766719AB" |

**After (Separate rows for each cross-reference):**
| ACR | NATIONAL | TMK | OEM | 
|-----|----------|-----|-----|
| ACR512332 | NAT123 | TM456 | 4766719AA |
| ACR512332 | | | 3785A008 |
| ACR512332 | | | 04766719AB |

### 🎯 Benefits of This Format:
- ⚡ **Faster searches**: Customers can find parts instantly
- 🔍 **Exact matches**: No search errors or missed results  
- 📊 **Better reporting**: Each cross-reference is tracked individually
- 🛡️ **Data integrity**: No database import failures
- 📈 **Performance**: Achieves sub-300ms search response times

### 🔧 **Step-by-Step Conversion Workflow:**

**For each problematic ACR SKU:**

1. **Find the row** with the ACR SKU (e.g., ACR512332)
2. **Look at OEM/OEM2 columns** (columns I & J) 
3. **Count the part numbers** separated by spaces
4. **Copy the row** that many times
5. **In each copied row**: 
   - Keep the same ACR SKU in column B
   - Put ONE competitor SKU in the OEM column  
   - Clear the other competitor columns for that row
6. **Delete the original row** with multiple SKUs

**Example for ACR512332:**
- Original: 1 row with "4766719AA 3785A008 04766719AB 05105719AC 05105770AF 05105770AG"
- Result: 6 rows, each with one of these SKUs in the OEM column

### 📊 **Progress Tracking:**

**Total Impact:** 109 ACR SKUs need normalization across ~7,530 cross-references
- **High Priority:** 6 ACR SKUs (most complex cases)
- **Medium Priority:** Plus remaining 103 ACR SKUs
- **Estimated time:** 2-3 hours for complete normalization

**You can test with just the High Priority SKUs first** to verify the system works, then complete the rest.

### 🚨 Critical Note:
This change is **essential** for the search functionality. The old format with concatenated SKUs will cause search failures and prevent the system from meeting its performance targets.

## 🌍 Internationalization

Built-in bilingual support using a custom i18n system:

```typescript
// English (development)
t("search.vehicle"); // "Search by Vehicle"

// Spanish (production)
t("search.vehicle"); // "Búsqueda por Vehículo"
```

All UI text is translatable from day one, ensuring seamless Mexican market deployment.

## 🧪 Testing Strategy

Focus on business-critical functionality:

- **Excel parsing accuracy** - Data integrity is paramount
- **Cross-reference lookup** - Core business value
- **Search performance** - Sub-300ms response times
- **Type-safe factories** - Schema changes break tests appropriately

```bash
# Run core business logic tests
npm test -- --testPathPattern="excel|search"

# Full test suite with type checking
npm run test:full
```

## 📁 Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (public)/           # Public search interface
│   ├── admin/              # Admin panel
│   └── api/                # Backend API routes
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── search/             # Search interface
│   ├── admin/              # Admin features
│   └── parts/              # Part display
├── lib/                    # Core utilities
│   ├── supabase/           # Database client
│   ├── excel/              # Excel parsing with conflict detection
│   ├── search/             # Search algorithms
│   └── i18n/               # Translation system
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript definitions
└── __tests__/              # Test files
```

## 🚀 Deployment

### Production Deployment (Vercel + Supabase)

1. **Deploy to Vercel**

   ```bash
   npm run build
   vercel --prod
   ```

2. **Configure environment variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Set `NODE_ENV=production`
   - Configure other environment variables from `.env.example`
     #   a c r - a u t o m o t i v e 
      
      
