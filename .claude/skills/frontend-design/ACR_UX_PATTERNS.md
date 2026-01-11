# ACR Automotive UX Design Patterns (Desktop)

> **Project-Specific UX Guidance**: Established patterns and conventions for ACR Automotive's auto parts platform. This document ensures consistency across all new features and pages.

## Design Philosophy

**Professional • Clean • Coca-Cola Inspired • Performance-First**

ACR Automotive's UX follows a professional, business-focused aesthetic with subtle brand touches. The design is inspired by Coca-Cola's bold use of red with clean, modern layouts optimized for parts counter staff.

### Core Principles

- **Professional First**: Business tool for auto parts professionals, not consumer-facing
- **Red as Accent**: ACR red (#ED1C24) used strategically for CTAs and highlights, not overwhelming
- **Performance Matters**: Sub-300ms interactions, smooth animations, efficient loading
- **Tablet-Optimized**: Primary use case is parts counter workstations (desktop patterns documented here)
- **Accessible**: WCAG AA compliant, keyboard navigation throughout

---

## Color System

### Brand Colors

```
ACR Red (Primary):    #ED1C24 (acr-red-500)
ACR Red Hover:        #D91920 (acr-red-600)
ACR Red Active:       #B91C1C (acr-red-700)
```

### Gray Scale (Professional Neutrals)

```
Background:           #F8F9FA (acr-gray-50)
Light Background:     #F3F4F6 (acr-gray-100)
Borders:              #E5E7EB (acr-gray-200)
Muted Borders:        #D1D5DB (acr-gray-300)
Text Secondary:       #6B7280 (acr-gray-500)
Text Primary:         #111827 (acr-gray-900)
```

### Usage Rules

1. **White Backgrounds**: All content cards use `bg-white` for clean separation
2. **Page Backgrounds**: Use `acr-page-bg-pattern` class for subtle dot grid texture
3. **Borders**: Default to `border-acr-gray-200` for cards, `border-acr-gray-300` for interactive elements
4. **Red Sparingly**: Only for primary CTAs, active states, and strategic highlights
5. **No Dark Mode**: Light mode only (business context, professional consistency)

---

## Typography

### Font Stack

- **Body**: Noto Sans (clean, professional, excellent for auto parts terminology)
- **Headings**: Exo 2 (brand font, use `.acr-brand-heading` utilities)
- **Monospace**: System mono fonts for SKUs and technical data

### Type Scale

```css
/* Use pre-defined utility classes */
.acr-heading-1      /* text-4xl md:text-6xl - Page titles */
.acr-heading-2      /* text-3xl md:text-5xl - Section titles */
.acr-heading-3      /* text-2xl md:text-4xl - Card headers */
.acr-body-large     /* text-lg - Emphasized body text */
.acr-body           /* text-base - Default body text */
.acr-body-small     /* text-sm - Helper text, labels */
.acr-caption        /* text-xs - Captions, metadata */
```

### Typography Rules

1. **Headings**: Always use Exo 2 brand font with `.acr-brand-heading-*` classes
2. **SKUs**: Use `font-mono` + `font-bold` + `tracking-wide` for part numbers
3. **Body Text**: Default Noto Sans, `text-acr-gray-700` for body, `text-acr-gray-900` for emphasis
4. **Line Height**: Tight for headings (`leading-tight`), normal for body (`leading-normal`)

---

## Layout Patterns

### Page Structure

```
┌─────────────────────────────────────┐
│ AppHeader (sticky)                   │
│ - variant="public" or "admin"        │
│ - Unified 3-dot menu                 │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Main Container                       │
│ - px-4 py-6 lg:px-8                 │
│ - mx-auto lg:max-w-6xl (public)     │
│ - mx-auto lg:max-w-7xl (admin)      │
│                                      │
│ [Page Content]                       │
└─────────────────────────────────────┘
```

### Container Widths

- **Public Search**: `lg:max-w-6xl` - Focused, consumer-friendly
- **Admin Dashboard**: `lg:max-w-7xl` - More data, wider workspace
- **Full Width**: Banner carousels, header (no container)

### Responsive Grid Patterns

```jsx
// 3-column product grid (public search results)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

// 2-column split (detail pages)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Dashboard cards (stats)
<div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
```

---

## Component Patterns

### Cards

**Standard Card (AcrCard)**

```jsx
<AcrCard variant="default" padding="compact" className="acr-animate-fade-up">
  <AcrCardHeader>
    <h2 className="acr-brand-heading-xl">Card Title</h2>
  </AcrCardHeader>
  <AcrCardContent>{/* Content */}</AcrCardContent>
</AcrCard>
```

**Variants:**

- `default`: Standard card with subtle shadow (`border-acr-gray-200 shadow-sm`)
- `elevated`: More prominent (`shadow-lg`)
- `interactive`: Clickable cards with red hover (`hover:border-acr-red-300` + red shadow)
- `featured`: Red accent border for special content (`border-acr-red-200`)

**Rules:**

- Always use white background (`bg-white`)
- Rounded corners: `rounded-xl` (12px)
- Consistent padding: `padding="compact"` (p-3 lg:p-4) for dense UIs, `padding="default"` for spacious
- Add entrance animations: `acr-animate-fade-up` with stagger classes

### Buttons

**Primary CTA (Gradient Red)**

```jsx
<AcrButton variant="primary">Save Changes</AcrButton>
```

**Secondary Actions**

```jsx
<AcrButton variant="secondary">Cancel</AcrButton>
```

**Variants:**

- `primary`: Red gradient with shadow (main actions)
- `secondary`: Black outline (cancel, secondary actions)
- `destructive`: Red destructive actions (delete)
- `ghost`: Subtle hover (tertiary actions)
- `link`: Underline text links

**Rules:**

- Primary: Only one per viewport section (clear hierarchy)
- Rounded: `rounded-xl` (12px)
- Height: `h-11` default, `h-12` on mobile for touch
- Icons: 16px (w-4 h-4), positioned with gap-2

### Search & Filters

**Tabbed Search Pattern (Public)**

```jsx
<AcrTabs value={activeTab} onValueChange={setActiveTab}>
  <AcrTabsList>
    <AcrTabsTrigger value="vehicle">
      <Car className="w-4 h-4 mr-1.5 hidden lg:inline" />
      Vehicle Search
    </AcrTabsTrigger>
    <AcrTabsTrigger value="sku">
      <Package className="w-4 h-4 mr-1.5 hidden lg:inline" />
      SKU Search
    </AcrTabsTrigger>
  </AcrTabsList>
  <AcrTabsContent value="vehicle">{/* Search inputs */}</AcrTabsContent>
</AcrTabs>
```

**Admin Search Pattern**

```jsx
<div className="bg-white rounded-lg border border-acr-gray-200 p-3 lg:p-4">
  <div className="flex gap-3">
    <AcrSearchInput placeholder="Search..." className="flex-[3]" />
    <AcrButton variant="secondary">
      <Filter className="w-4 h-4" />
      Filters
    </AcrButton>
  </div>
</div>
```

**Rules:**

- White card backgrounds with `border-acr-gray-200`
- Responsive: Stacked on mobile, horizontal on desktop
- Search ready state: Add `acr-pulse-ready` class to CTA when form is valid
- Icons: Always 16px (w-4 h-4)

### Data Display

**Product Cards (Public Search Results)**

```jsx
<Link
  href={`/parts/${part.sku}`}
  className={cn(
    "acr-animate-fade-up",
    staggerClass,
    "bg-white border border-acr-gray-300 rounded-xl",
    "shadow-md hover:border-acr-red-300 hover:shadow-lg",
    "hover:shadow-[0_8px_30px_-12px_rgba(237,28,36,0.15)]",
    "cursor-pointer active:scale-[0.99]",
    "group"
  )}
>
  {/* Image with skeleton */}
  {/* SKU + Part Type */}
  {/* Brand badge */}
</Link>
```

**Admin Table (Desktop)**

```jsx
<AcrTable columns={columns} data={data} isLoading={isLoading} />
```

**Admin Cards (Mobile)**

- Clickable cards with red hover
- Stats prominently displayed
- Keyboard accessible (tabIndex={0})

**Rules:**

- Grid: 3 columns on desktop (lg:grid-cols-3)
- Image aspect: Contained, 192px height (h-48)
- Hover: Scale 105% on image, red border + shadow on card
- Always show loading skeletons during data fetch

### Dashboard Stats

**Desktop: Individual Cards**

```jsx
<div className="grid grid-cols-3 gap-4">
  <AcrCard padding="compact" className="acr-animate-fade-up">
    <div className="w-8 h-8 rounded-lg bg-acr-gray-100">
      <Bolt className="w-4 h-4" />
    </div>
    <div className="text-2xl font-bold">{count}</div>
    <div className="text-xs text-acr-gray-500">{label}</div>
  </AcrCard>
</div>
```

**Mobile: Combined Card**

- Single card with horizontal layout
- Primary stat (parts) gets red accent
- Secondary stats use gray

**Rules:**

- Icons: 32px container (w-8 h-8 rounded-lg), 16px icon inside
- Primary stat: Red accent (`bg-acr-red-100 text-acr-red-600`)
- Secondary: Gray accent (`bg-acr-gray-100 text-acr-gray-600`)
- Numbers: `text-2xl font-bold` on desktop

---

## Loading States & Animations

### Full-Page Preloader

**Pattern:**

```jsx
<Preloader
  isLoading={isInitialLoad}
  animationSrc="/animations/gear-loader.lottie"
/>
```

**Rules:**

- Shows on initial page load only (not subsequent data fetches)
- Minimum 600ms display time for smooth UX
- Covers entire viewport (fixed inset-0 z-50)
- Uses Lottie animation + ACR logo
- Fades out with 200ms transition

**When to Use:**

- Initial page mount with critical data loading
- Suspense fallback for route changes
- Settings + initial data both loading

**When NOT to Use:**

- Pagination (show inline spinner instead)
- Filter changes (show skeleton in content area)
- Secondary data loads (use skeleton states)

### Skeleton Loading States

**Comprehensive Skeleton System:**

- `<SkeletonPartCard />` - Product cards
- `<SkeletonPartsGrid />` - Grid of product cards
- `<SkeletonDashboardCards />` - Dashboard stats
- `<SkeletonAdminPartsList />` - Admin table
- `<SkeletonSearchFilters />` - Search UI

**Rules:**

- Use ACR red for skeleton background: `bg-acr-red-100`
- Animate with Tailwind: `animate-pulse`
- Match exact layout dimensions of real content
- Show during data refetch, not initial load (use Preloader)

### Inline Spinners (Standard Component)

**Use AcrSpinner for all inline loading states:**

```jsx
import { AcrSpinner } from "@/components/acr/Spinner";

// Default usage (medium, red)
<div className="flex items-center justify-center py-16">
  <AcrSpinner size="md" color="primary" />
</div>

// Large spinner for page-level loading
<AcrSpinner size="lg" color="primary" />

// Small spinner for compact areas
<AcrSpinner size="sm" color="primary" />
```

**Available Props:**

- `size`: "xs" | "sm" | "md" | "lg" | "xl" (default: "md")
- `color`: "primary" (red) | "secondary" (blue) | "white" | "gray" (default: "primary")
- `type`: "border" (spinning circle) | "icon" (Loader2) (default: "border")
- `inline`: boolean - removes centering (default: false)
- `aria-label`: string (default: "Loading...")

**When to Use:**

- Search results loading (after initial page load)
- Pagination changes
- Filter updates
- Form submission states
- Secondary content loading

**❌ DON'T create custom spinners** - always use `AcrSpinner` for consistency and accessibility.

### Entrance Animations

**Animation Classes (defined in globals.css):**

```css
.acr-animate-fade-up      /* Fade + slide up (12px) */
.acr-animate-fade-in      /* Simple fade */
.acr-animate-scale-in     /* Fade + scale (96% → 100%) */
.acr-animate-slide-up     /* Fade + slide up (20px) */
```

**Timing System:**

```
Base Delay: 0.7s (accounts for preloader)
Duration: 0.3-0.45s (fast but noticeable)
Easing: ease-out (natural deceleration)
```

**Stagger Utilities (ALWAYS USE THESE):**

```jsx
import { getStaggerClass, getStaggerDelay } from "@/lib/animations";

// Class-based approach (preferred)
{
  items.map((item, index) => (
    <div
      key={item.id}
      className={cn("acr-animate-fade-up", getStaggerClass(index))}
    >
      {/* content */}
    </div>
  ));
}

// Inline style approach (when className composition is complex)
{
  items.map((item, index) => (
    <div
      className="acr-animate-fade-up"
      style={{ animationDelay: getStaggerDelay(index) }}
    >
      {/* content */}
    </div>
  ));
}
```

**Utility Functions:**

- `getStaggerClass(index)` - Returns class names (e.g., "acr-stagger-1")
- `getStaggerDelay(index, baseDelay?, increment?)` - Returns delay strings (e.g., "0.75s")

**❌ DON'T manually calculate stagger delays** - always use utilities from `@/lib/animations` for consistency.

**Stagger Details:**

- Cycles through 12 delay classes (.75s to 1.3s)
- Increments by 50ms per item
- Automatically wraps after 12 items (uses modulo)

**Stagger Delays:**

- `.acr-stagger-1` → 0.75s
- `.acr-stagger-2` → 0.8s
- ...up to `.acr-stagger-12` → 1.3s
- Wraps after 12 items (use modulo: `index % 12`)

**Animation Rules:**

1. **Page sections**: Use `.acr-animate-fade-up` on major sections
2. **Grid items**: Add stagger classes for cascading entrance
3. **Cards**: Individual cards get `.acr-animate-fade-up`
4. **Modals**: Use `.acr-animate-scale-in` for pop-in effect
5. **Inline content**: Use `.acr-animate-fade-in` for subtle appearance

**Manual Delay Override:**

```jsx
<div
  className="acr-animate-fade-up"
  style={{ animationDelay: "0.85s" }}
>
```

### Interactive Animations

**Search Ready Pulse:**

```jsx
<AcrButton className={cn("w-full", isReady && "acr-pulse-ready")}>
  Search
</AcrButton>
```

- Pulses red shadow when form is valid
- 2s duration, infinite loop
- Subtle attention-grabbing

**Hover Effects:**

- Cards: `hover:shadow-lg hover:shadow-[0_8px_30px_-12px_rgba(237,28,36,0.15)]`
- Buttons: Built into variant styles (gradient shift)
- Images: `group-hover:scale-105` (5% scale on parent hover)
- Duration: `transition-all duration-300` (smooth but responsive)

**Active States:**

- Cards: `active:scale-[0.99]` (subtle press feedback)
- Buttons: Darker gradient on click (defined in variants)

---

## Error States

### Error Component Hierarchy

**CardError** (Most Common)

```jsx
<CardError
  title={t("error.title")}
  message={t("error.message")}
  className="mt-8"
/>
```

- White card with red border
- AlertTriangle icon
- Used for: API errors, search failures, data load errors

**InlineError** (Compact Spaces)

```jsx
<InlineError title="Error" message="Failed to load" onRetry={() => refetch()} />
```

- Minimal spacing (py-6)
- Optional retry button
- Used for: Dashboard card errors, form errors

**PageError** (Full Page)

```jsx
<PageError
  title="Part Not Found"
  message="The part you're looking for doesn't exist"
  backLink="/"
  backText="Back to Search"
/>
```

- Centered, spacious
- Optional back navigation
- Used for: 404s, critical page errors

**BannerError** (Non-Blocking)

```jsx
<BannerError
  title="Warning"
  message="Some features unavailable"
  dismissible={true}
  onDismiss={() => {}}
/>
```

- Red banner at top of content
- Dismissible X button
- Used for: Form validation, non-critical warnings

### Error State Rules

1. **Always show context**: What failed and why
2. **Provide actions**: Retry button, back link, or next steps
3. **Use translations**: All error text via i18n
4. **Match container**: Use CardError inside cards, PageError on pages

---

## Forms & Inputs

### Input Pattern

```jsx
<div className="space-y-2">
  <AcrLabel htmlFor="sku">SKU</AcrLabel>
  <AcrInput id="sku" type="text" placeholder="Enter SKU" className="h-12" />
</div>
```

### Search Input

```jsx
<AcrSearchInput
  placeholder="Search parts..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  size="default"
  className="w-full h-11"
/>
```

### Select / Dropdown

```jsx
<AcrSelect
  value={selectedValue}
  onValueChange={setSelectedValue}
  options={options}
  placeholder="Select option"
/>
```

### ComboBox (Searchable Select)

```jsx
<AcrComboBox
  value={selectedMake}
  onValueChange={setSelectedMake}
  options={makes.map((m) => ({ label: m, value: m }))}
  placeholder="Select Make"
  searchPlaceholder="Search makes..."
  allowCustomValue={false}
  isLoading={isLoading}
  className="w-full h-12"
/>
```

### Form Rules

1. **Input Heights**: Mobile `h-12`, desktop `h-11` default
2. **Labels**: Always use `AcrLabel` with `htmlFor`
3. **Spacing**: `space-y-2` between label and input
4. **Validation**: Show errors below input with `text-red-600 text-sm`
5. **Disabled State**: Use built-in `disabled` prop (opacity-50)

---

## Navigation & Pagination

### AppHeader Pattern

```jsx
<AppHeader variant="public" /> // or variant="admin"
```

**Variants:**

- `public`: Shows "Professional Parts Catalog" tagline
- `admin`: Shows "Admin" indicator

**Features:**

- Unified 3-dot menu with all navigation
- Language toggle (EN/ES)
- Responsive: Collapses on mobile
- Sticky: Stays at top during scroll

### Pagination

```jsx
<AcrPagination
  currentPage={currentPage}
  totalPages={totalPages}
  total={total}
  limit={limit}
  onPageChange={handlePageChange}
/>
```

**Rules:**

- Show when `total > limit`
- Always display total count
- Scroll to top on page change: `window.scrollTo({ top: 0, behavior: "instant" })`
- Desktop: Show page numbers
- Mobile: Simplified prev/next only

---

## Accessibility Patterns

### Keyboard Navigation

```jsx
<div
  tabIndex={0}
  role="button"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

### Focus States

- All interactive elements: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acr-red-500 focus-visible:ring-offset-2`
- Links: `focus-visible:ring-black` for better contrast
- Buttons: Built into variant styles

### ARIA Labels

```jsx
<div role="progressbar" aria-label="Loading">
  {/* Preloader */}
</div>

<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>
```

### Rules

1. **All clickable cards**: Add `tabIndex={0}` + `role="button"` + keyboard handlers
2. **Icons without text**: Always add `aria-label`
3. **Loading states**: Use `role="progressbar"` + `aria-label`
4. **Modals**: Auto-focus trap, ESC to close
5. **Images**: Always provide meaningful `alt` text

---

## Mobile vs Desktop Patterns

### Layout Shifts

```jsx
// Stacked on mobile, horizontal on desktop
<div className="flex flex-col gap-2 lg:flex-row lg:gap-3">

// Hidden on mobile, visible on desktop
<span className="hidden lg:inline">Full Label</span>
<span className="lg:hidden">Short</span>

// Different grid columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Component Adaptations

**Mobile:**

- Cards: Full-width, stacked
- Tables: Switch to card view (no actual table)
- Pagination: Simplified prev/next
- Touch targets: Minimum 44px (h-12)

**Desktop:**

- Tables: Use `AcrTable` component
- Pagination: Show page numbers
- Compact spacing: Use `lg:p-4` vs `p-3`
- Icons visible: Show icons in tabs, buttons

---

## Code Quality: Resolved & Remaining Issues

### ✅ Resolved (Now Standardized)

**Loading States** - ✅ COMPLETE

- All inline spinners in public search & admin dashboard now use `AcrSpinner`
- Component: `src/components/acr/Spinner.tsx`
- No more custom spinner implementations in main UX hierarchies

**Stagger Animation Logic** - ✅ COMPLETE

- All stagger delays now use utilities from `src/lib/animations.ts`
- Functions: `getStaggerClass(index)` and `getStaggerDelay(index)`
- No more manual `index % 12` calculations in main UX hierarchies

**Error State Usage** - ✅ COMPLETE (in main UX scope)

- Public search and admin dashboard all use centralized error components
- Components: `src/components/ui/error-states.tsx`
- Hierarchy: PageError → CardError → InlineError → BannerError

---

## Key Takeaways for New Features

When building new pages or features, follow these patterns:

1. **Start with Layout**: `acr-page-bg-pattern` → container with max-width → white cards
2. **Loading**:
   - Initial load: `<Preloader />` with Lottie animation
   - Refetch: `<Skeleton.../>` components matching layout
   - Inline: `<AcrSpinner size="md" color="primary" />`
3. **Animations**:
   - Use `.acr-animate-fade-up` on sections
   - Import `getStaggerClass` from `@/lib/animations`
   - Apply stagger on grids: `className={cn("acr-animate-fade-up", getStaggerClass(index))}`
4. **Error States**:
   - Import from `@/components/ui/error-states`
   - Page-level: `<PageError />`
   - Card-level: `<CardError />`
   - Inline: `<InlineError />`
5. **Colors**: White cards, gray borders, red sparingly for CTAs
6. **Typography**: Exo 2 for headings, Noto Sans for body, monospace for SKUs
7. **Interactions**: Red hover hints on clickable cards, subtle active states
8. **Spacing**: Compact on mobile (p-3), spacious on desktop (lg:p-4)

**Critical: NEVER create custom implementations for:**

- ❌ Loading spinners (use `AcrSpinner`)
- ❌ Stagger calculations (use `getStaggerClass` / `getStaggerDelay`)
- ❌ Error displays (use `PageError` / `CardError` / `InlineError` / `BannerError`)

8. **Errors**: Use error-states components, always provide context + action
9. **Accessibility**: Keyboard nav, focus rings, ARIA labels, semantic HTML

---

## Design System Reference

**Component Library**: `src/components/acr/`
**Design Tokens**: `src/app/globals.css`
**Skeleton States**: `src/components/ui/skeleton.tsx`
**Error States**: `src/components/ui/error-states.tsx`
**Documentation**: `src/components/acr/README.md`
