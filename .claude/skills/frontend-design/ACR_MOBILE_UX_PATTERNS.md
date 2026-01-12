# ACR Automotive Mobile UX Design Patterns

> **Mobile-Specific UX Guidance**: Touch-optimized patterns for ACR Automotive's tablet and mobile interfaces. Primary use case is parts counter staff on tablets.

## Mobile Design Philosophy

**Touch-First • Progressive Disclosure • Simplified Layouts • Performance Critical**

ACR Automotive's mobile UX prioritizes efficiency for parts counter staff working on tablets during customer interactions. The design adapts desktop patterns to touch-friendly, scannable layouts.

### Core Mobile Principles

- **Tablet-Optimized**: Primary target is 10-13" tablets at parts counters (not phones)
- **Touch Targets**: Minimum 44px height for reliable finger interaction
- **Progressive Disclosure**: Show less info upfront, reveal details on demand
- **Stacked Layouts**: Vertical flow, one column, clear hierarchy
- **Fast Interactions**: Instant feedback, smooth 60fps animations
- **Reduced Complexity**: Fewer options visible, streamlined workflows

### Breakpoint Strategy

```css
/* Mobile-first approach */
Base (0-767px):     Mobile phones (edge case, but supported)
md: (768px+):       Tablets (PRIMARY TARGET)
lg: (1024px+):      Desktop (switch to desktop patterns)
```

**Key Pattern**: Use `md:hidden` to hide on desktop, `lg:hidden` to hide on desktop+

---

## Touch Interaction Patterns

### Minimum Touch Targets

**Critical Rule: All interactive elements MUST be at least 44px in height**

```jsx
// Mobile Buttons
<AcrButton className="w-full h-12">  {/* 48px - comfortable touch */}

// Mobile Inputs
<AcrInput className="h-12" />  {/* 48px - easy to tap */}

// Mobile ComboBox
<AcrComboBox className="w-full h-12" />

// Mobile Search
<AcrSearchInput className="w-full h-11" />  {/* 44px minimum */}
```

**Touch Target Sizes:**

- Buttons: `h-12` (48px) on mobile
- Inputs: `h-12` (48px) on mobile
- Cards: `p-4` (16px padding) for comfortable tap area
- Icons: `w-5 h-5` (20px) for tap targets, `w-4 h-4` (16px) for decorative only
- Filter chips: `h-8` (32px) minimum with padding

### Active/Pressed States

Mobile requires more pronounced feedback than desktop:

```jsx
// Cards: Scale feedback on tap
className = "active:scale-[0.98] transition-transform duration-150";

// Buttons: Built into AcrButton (gradient shift + shadow reduction)
```

**Rules:**

- Always provide visual feedback within 100ms of touch
- Use `active:` pseudo-class for tap state
- Scale down slightly (98-99%) for "pressed" feeling
- Avoid hover states on mobile (use `md:hover:` to limit to desktop)

### Swipe & Gesture Patterns

**Banner Carousel**: Horizontal swipe via Swiper.js for image galleries

**Standard Scroll**: Vertical scroll behavior for all lists and content

---

## Layout Adaptations

### Stacked vs Horizontal Layouts

**Mobile Pattern: Stack Everything**

```jsx
// Search Filters - Mobile
<div className="md:hidden space-y-3">
  <AcrComboBox className="w-full h-12" />  {/* Make */}
  <AcrComboBox className="w-full h-12" />  {/* Model */}
  <AcrComboBox className="w-full h-12" />  {/* Year */}
  <AcrButton className="w-full h-12">Search</AcrButton>
</div>

// Search Filters - Desktop
<div className="hidden md:flex md:items-center md:gap-4">
  <AcrComboBox className="flex-1" />  {/* Horizontal */}
  <AcrComboBox className="flex-1" />
  <AcrComboBox className="flex-1" />
  <AcrButton>Search</AcrButton>
</div>
```

**Stacking Rules:**

1. **Forms**: Always vertical on mobile (`space-y-3` or `space-y-4`)
2. **Buttons**: Full-width on mobile (`w-full`), auto-width on desktop
3. **Search + Actions**: Stacked on mobile, side-by-side on desktop
4. **Stats**: Horizontal layout on mobile (space-efficient), separate cards on desktop

### Grid Adaptations

**Product Grids:**

```jsx
// 1 column mobile → 2 columns tablet → 3 columns desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
```

**Dashboard Cards:**

```jsx
// Combined single card mobile → 3 separate cards desktop
<div className="lg:hidden">
  <AcrCard padding="compact">
    {/* All stats in one card */}
  </AcrCard>
</div>

<div className="hidden lg:grid grid-cols-3 gap-4">
  {/* Separate stat cards */}
</div>
```

**Admin Parts List:**

```jsx
// Card view mobile → Table view desktop
<div className="lg:hidden space-y-3">
  {/* Clickable cards */}
</div>

<div className="hidden lg:block">
  <AcrTable columns={columns} data={data} />
</div>
```

---

## Progressive Disclosure

### Combined vs Separate Components

**Pattern: Consolidate on Mobile, Separate on Desktop**

**Example 1: Dashboard Stats**

Mobile (Single Card):

```jsx
<AcrCard padding="compact">
  <div className="flex flex-col gap-3">
    {/* Total Parts */}
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-acr-red-100">
        <Bolt className="w-4 h-4" />
      </div>
      <div>
        <div className="text-sm font-bold text-acr-red-600">{count}</div>
        <div className="text-xs text-acr-gray-500">{label}</div>
      </div>
    </div>
    {/* Applications */}
    {/* Cross References */}
  </div>
</AcrCard>
```

Desktop (Separate Cards):

```jsx
<div className="grid grid-cols-3 gap-4">
  <AcrCard>{/* Total Parts */}</AcrCard>
  <AcrCard>{/* Applications */}</AcrCard>
  <AcrCard>{/* Cross References */}</AcrCard>
</div>
```

**Why?**

- Mobile: Limited screen space, users scan in one pass
- Desktop: More space, cards can breathe and draw individual attention

**Example 2: Admin Filter Panel**

Mobile:

```jsx
<AcrButton variant="secondary" className="w-full">
  <Filter className="w-4 h-4" />
  Filters
  {activeCount > 0 && <FilterBadge count={activeCount} />}
</AcrButton>;

{
  /* Modal with all filters */
}
<AcrModal isOpen={showFilters}>
  <FilterPanel />
</AcrModal>;
```

Desktop:

```jsx
// Same button + modal pattern (consistent across mobile and desktop)
```

### Truncation & Abbreviation

**Mobile Text Patterns:**

```jsx
// Tab Labels - Short on mobile, full on desktop
<AcrTabsTrigger value="vehicle">
  <Car className="w-4 h-4 mr-1.5 hidden lg:inline" />
  <span className="lg:hidden">Vehicle</span>
  <span className="hidden lg:inline">Vehicle Search</span>
</AcrTabsTrigger>

// Button Labels
<AcrButton variant="secondary">
  <Download className="w-4 h-4" />
  <span className="hidden sm:inline">Export Results ({total})</span>
  <span className="sm:hidden">{total}</span>
</AcrButton>

// Search Labels
<span className="block text-sm font-semibold lg:hidden">
  Search By
</span>
```

**Rules:**

- Show icons on desktop only when they enhance scannability
- Mobile: Shorter labels, rely on context (e.g., "Export" vs "Export All Results")
- Always preserve meaning - don't abbreviate to cryptic shorthand
- Use `hidden lg:inline` for full text, `lg:hidden` for short text

---

## Mobile-Specific Components

### Admin Parts Cards (Mobile Alternative to Table)

**Touch-Optimized Card Pattern:**

```jsx
<div
  onClick={handleNavigation}
  className={cn(
    "bg-white rounded-lg border border-acr-gray-200 p-4",
    "hover:border-acr-red-300 hover:shadow-[0_8px_30px_-12px_rgba(237,28,36,0.15)]",
    "transition-all duration-300 cursor-pointer active:scale-[0.98]",
    "acr-animate-fade-up",
    "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-2"
  )}
  tabIndex={0}
  role="button"
  onKeyDown={handleKeyDown}
>
  {/* Header Row: SKU + Part Type */}
  <div className="flex items-center justify-between mb-3">
    <span className="bg-acr-red-50 text-acr-red-700 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
      {sku}
    </span>
    <span className="text-xs text-acr-gray-600 font-medium">{partType}</span>
  </div>

  {/* Stats Row */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4 text-xs text-acr-gray-600">
      <span>
        <strong>{vehicleCount}</strong> vehicles
      </span>
      <span>
        <strong>{refCount}</strong> references
      </span>
    </div>

    {/* Chevron indicator (signals tappability) */}
    <ChevronRight className="w-5 h-5 text-acr-gray-400" />
  </div>

  {/* Optional: Specifications (if present) */}
  {hasSpecs && (
    <div className="mt-2 pt-2 border-t border-acr-gray-100">
      <div className="text-xs text-acr-gray-500">{specs.join(" • ")}</div>
    </div>
  )}
</div>
```

**Key Features:**

- **SKU Badge**: Red background, stands out visually
- **Stats**: Compact, numbers emphasized with `<strong>`
- **Chevron**: Visual affordance (indicates tappability)
- **Divider**: Separates optional specs
- **Animation**: Staggered entrance with other cards
- **Active State**: `active:scale-[0.98]` for press feedback

### Dashboard Stats (Mobile Combined Card)

**Horizontal Layout Inside Single Card:**

```jsx
<AcrCard variant="default" padding="compact">
  <div className="flex flex-col gap-3">
    {stats.map((stat) => (
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            stat.isPrimary
              ? "bg-acr-red-100 text-acr-red-600"
              : "bg-acr-gray-100 text-acr-gray-600"
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Number + Label */}
        <div className="flex-1">
          <div
            className={cn(
              "text-sm font-bold leading-none",
              stat.isPrimary ? "text-acr-red-600" : "text-acr-gray-800"
            )}
          >
            {count}
          </div>
          <div className="text-xs leading-tight mt-1 text-acr-gray-500 font-medium">
            {label}
          </div>
        </div>
      </div>
    ))}
  </div>
</AcrCard>
```

**Design Decisions:**

- **Smaller icons**: 32px container (vs 40px desktop) for density
- **Horizontal rows**: Scan top-to-bottom, efficient use of width
- **Primary highlight**: Red accent on most important stat (Total Parts)
- **Compact padding**: `padding="compact"` (p-3 vs p-6)

### Search Tabs Mobile Pattern

**"Search By" Label on Top:**

```jsx
<div className="space-y-2 mb-4 lg:space-y-0 lg:mb-0">
  {/* Mobile-only label */}
  <span className="block text-sm font-semibold text-acr-gray-900 lg:hidden">
    Search By
  </span>

  <AcrTabsList>
    <AcrTabsTrigger value="vehicle">
      <Car className="w-4 h-4 mr-1.5 hidden lg:inline" />
      <span className="lg:hidden">Vehicle</span>
      <span className="hidden lg:inline">Vehicle Search</span>
    </AcrTabsTrigger>
    <AcrTabsTrigger value="sku">
      <Package className="w-4 h-4 mr-1.5 hidden lg:inline" />
      <span className="lg:hidden">SKU</span>
      <span className="hidden lg:inline">SKU Search</span>
    </AcrTabsTrigger>
  </AcrTabsList>
</div>
```

**Why the label?**

- Provides context for users unfamiliar with tabbed interfaces
- Establishes clear hierarchy: "What am I doing?" → "How?"
- Desktop doesn't need it (tabs are self-explanatory in horizontal context)

---

## Spacing & Density

### Mobile Spacing Standards

**Container Padding:**

```css
Mobile:  px-3 py-5   (12px horizontal, 20px vertical)
Desktop: lg:px-8 lg:py-8  (32px both directions)
```

**Card Padding:**

```css
Mobile:  p-3   (12px all around) - for compact UIs like dashboard
         p-4   (16px) - for comfortable tapping on clickable cards
Desktop: lg:p-4  (16px compact)
         lg:p-6  (24px default)
```

**Stack Spacing:**

```css
Mobile:  space-y-3  (12px between stacked elements)
         space-y-4  (16px for more breathing room)
Desktop: lg:space-y-6  (24px - generous spacing)
```

**Grid Gaps:**

```css
Mobile:  gap-3  (12px between grid items)
         gap-4  (16px for larger cards)
Desktop: lg:gap-4, lg:gap-6  (16-24px depending on content)
```

### Why Tighter Spacing on Mobile?

1. **Screen Real Estate**: Show more content above the fold
2. **Scrolling**: Users are comfortable scrolling, less comfortable with excessive whitespace
3. **Touch Targets**: Padding on interactive elements provides sufficient tap area
4. **Density**: Parts counter staff need to see multiple options quickly

**Balance Point**: Tight enough to show content, spacious enough for comfortable touch interaction.

---

## Mobile Navigation

### Floating Action Buttons (FABs)

**Contact FABs (Public Pages Only):**

```jsx
<div className="fixed left-60 bottom-20 z-50 flex-col gap-3 hidden md:flex">
  {/* WhatsApp */}
  <a
    href={whatsappLink}
    className={cn(
      "flex h-14 w-14 items-center justify-center rounded-full",
      "bg-[#25D366] text-white shadow-lg",
      "hover:scale-110 hover:shadow-xl transition-all duration-200"
    )}
  >
    <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-[ping-small_2s_ease-in-out_infinite]" />
    <MessageCircle className="relative z-10 h-7 w-7" />
  </a>

  {/* Email */}
  <a href={emailLink} className="...">
    <Mail className="h-7 w-7" />
  </a>
</div>
```

**FAB Rules:**

- **Position**: `fixed left-60 bottom-20` (desktop only)
- **Hidden on mobile**: `hidden md:flex` (mobile already has smaller screens, less room)
- **Hide during preloader**: Delay 750ms to prevent flash
- **Pulse effect**: Subtle `ping-small` animation for attention
- **Tooltips**: Show on desktop hover
- **Only public pages**: Don't show in admin area

**Why desktop-only?**

- Mobile screens are smaller, FABs would obscure content
- Easier to include contact link in footer or header on mobile
- Desktop users less likely to have WhatsApp readily available (desktop app)

### AppHeader Mobile Adaptations

**Mobile Header Pattern:**

```jsx
<AcrHeader
  title={title} // Shorter on mobile via translation
  actions={[]} // No quick-access actions on mobile
  utilityActions={menuActions} // Everything in 3-dot menu
  locale={locale}
  onLocaleChange={setLocale}
  languageToggleLabel={t("admin.settings.language")}
  borderVariant={borderVariant}
/>
```

**Mobile Behavior:**

- **Unified menu**: All navigation in 3-dot menu (cleaner, less cluttered)
- **No quick actions**: Mobile screen too narrow for multiple buttons
- **Language toggle**: Always visible (important for Mexican market)
- **Responsive title**: Truncate if necessary

---

## Mobile Typography

### Font Sizes

**Mobile Scale (Smaller than desktop):**

```css
/* Headings - Use responsive classes */
.acr-heading-1  /* text-4xl (36px mobile) → md:text-6xl (60px desktop) */
.acr-heading-2  /* text-3xl (30px mobile) → md:text-5xl (48px desktop) */
.acr-heading-3  /* text-2xl (24px mobile) → md:text-4xl (36px desktop) */

/* Body Text */
text-base  /* 16px (both mobile and desktop) */
text-sm    /* 14px - helper text, labels (both) */
text-xs    /* 12px - captions, metadata (both) */

/* Dashboard Stats (Mobile vs Desktop) */
Mobile:  text-sm font-bold  /* 14px numbers */
Desktop: lg:text-2xl font-bold  /* 24px numbers */
```

**Typography Rules:**

1. **Mobile headings**: Start 1-2 sizes smaller, scale up on desktop
2. **Body text**: Same size mobile and desktop (16px is readable on both)
3. **Stats**: Significantly smaller on mobile (14px vs 24px) due to combined card layout
4. **Line height**: Use `leading-tight` more aggressively on mobile for density

### Text Truncation

**Long Text Handling:**

```jsx
// Product names, descriptions
className = "text-sm line-clamp-2"; // Show 2 lines, ellipsis after

// SKUs (never truncate!)
className = "font-mono text-xs"; // Always show full SKU

// Helper text
className = "text-xs text-acr-gray-500 truncate"; // Single line with ellipsis
```

**Rules:**

- **Never truncate**: SKUs, part numbers, critical identifiers
- **Truncate liberally**: Descriptions, notes, helper text
- **Use line-clamp-2**: For multi-line text (product descriptions)
- **Use truncate**: For single-line text (labels, titles)

---

## Mobile Loading States

### Preloader (Same as Desktop)

Mobile and desktop share the same preloader pattern:

```jsx
<Preloader
  isLoading={isInitialLoad}
  animationSrc="/animations/gear-loader.lottie"
/>
```

**Mobile Specifics:**

- **Smaller logo**: Uses responsive sizing (`h-28 md:h-32`)
- **Smaller animation**: `w-56 h-56 md:w-64 md:h-64`
- Same minimum 600ms display time

### Skeleton States

**Mobile Skeleton Adjustments:**

Most skeletons adapt automatically via responsive classes:

```jsx
<SkeletonDashboardCard />
// Automatically adjusts icon size: w-8 h-8 lg:w-10 lg:h-10
```

**Mobile-Specific Patterns:**

- Stacked skeleton inputs (match stacked form layout)
- Smaller stat cards (match combined mobile card)
- Single column product grid skeletons

### Inline Loading

**Mobile Loading Spinner:**

```jsx
// In parts list, centered spinner
{
  isLoading && (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-acr-gray-200 border-t-acr-red-500 rounded-full animate-spin" />
    </div>
  );
}
```

**Rules:**

- Use inline spinner for data refetch (not initial load)
- Larger spinner on mobile (w-8 h-8 vs w-6 h-6) for visibility
- Center in content area, generous padding

---

## Mobile Animations

### Entrance Animations (Same as Desktop)

Mobile uses the same animation timing as desktop:

```css
.acr-animate-fade-up  /* 0.4s ease-out, 0.7s delay */
.acr-stagger-1        /* 0.75s delay */
.acr-stagger-2        /* 0.8s delay */
/* etc. */
```

**Why same timing?**

- Preloader is same on mobile and desktop (600ms minimum)
- Users expect consistent behavior across devices
- Animations are already fast (300-450ms), no need to speed up further

### Touch Feedback Animations

**Active/Pressed States:**

```jsx
// Cards - Subtle scale down on tap
className = "active:scale-[0.98] transition-transform duration-150";

// Buttons - Built into AcrButton
// - Gradient shift (lighter to darker)
// - Shadow reduction (lg to md)
// - Happens within 150ms
```

**Rules:**

- **Fast feedback**: 100-150ms for active states (instant feel)
- **Scale down**: 98-99% feels like "pressing" the element
- **Avoid hover**: Mobile doesn't have hover, use `md:hover:` only
- **Always provide feedback**: Every tap should produce visual response

### Scroll Behavior

**Pagination Scroll:**

```jsx
// Instant scroll to top on page change (mobile)
window.scrollTo({ top: 0, behavior: "instant" });

// Desktop can use smooth, but instant on mobile is more responsive
```

**Why instant?**

- Mobile users expect immediate response to taps
- Smooth scroll can feel sluggish on older tablets
- Content shift is more important than smooth animation

---

## Mobile Forms

### Input Patterns

**Stacked Full-Width Inputs:**

```jsx
<div className="space-y-3">
  <div className="space-y-2">
    <AcrLabel htmlFor="make">Make</AcrLabel>
    <AcrComboBox
      id="make"
      className="w-full h-12"
      value={make}
      onValueChange={setMake}
    />
  </div>

  <div className="space-y-2">
    <AcrLabel htmlFor="model">Model</AcrLabel>
    <AcrComboBox
      id="model"
      className="w-full h-12"
      value={model}
      onValueChange={setModel}
    />
  </div>

  <AcrButton className="w-full h-12 mt-2">Search</AcrButton>
</div>
```

**Mobile Form Rules:**

1. **Always full-width**: `w-full` on all inputs and buttons
2. **Minimum 48px height**: `h-12` for comfortable touch
3. **Stack vertically**: `space-y-3` between fields
4. **Clear labels**: Always show labels, never hide them for "clean" look
5. **Large tap targets**: Buttons get `h-12`, inputs get `h-12`

### Input Types & Mobile Keyboards

**Optimize for mobile keyboards:**

```jsx
// Email
<AcrInput type="email" />  // Shows email keyboard with @ symbol

// Phone
<AcrInput type="tel" />  // Shows numeric keypad

// Numbers (part quantities)
<AcrInput type="number" inputMode="numeric" />  // Numeric keyboard

// Search
<AcrSearchInput />  // Shows search keyboard with "Go" button
```

### Error States on Mobile

**Mobile Error Pattern:**

```jsx
<div className="space-y-2">
  <AcrLabel htmlFor="sku">SKU</AcrLabel>
  <AcrInput
    id="sku"
    className={cn("w-full h-12", error && "border-red-500 focus:ring-red-500")}
    value={sku}
    onChange={handleChange}
  />
  {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
</div>
```

**Rules:**

- Show errors immediately below input (shorter distance to scan)
- Use red border + red text for visibility
- Keep error messages short (1 line if possible)
- Ensure error text is at least 14px (text-sm) for readability

---

## Mobile Error States

### Error Component Adaptations

**CardError (Mobile):**

```jsx
<CardError
  title="Error"
  message="Could not load parts"
  className="p-3 lg:p-4" // Tighter padding on mobile
/>
```

**InlineError (Mobile):**

```jsx
<InlineError
  title="Error"
  message="Try again"
  className="py-4" // Reduced padding on mobile vs desktop
/>
```

**BannerError (Mobile):**

```jsx
<BannerError
  title="Warning"
  message="Limited connectivity"
  dismissible={true}
  className="mx-3 mt-3" // Margin matches container padding
/>
```

---

## Mobile Accessibility

### Touch Accessibility

**Requirements:**

1. **Minimum 44px touch targets**: All interactive elements
2. **Sufficient spacing**: 8px minimum between adjacent touch targets
3. **Clear visual feedback**: Active states for all tap interactions
4. **No hover-only interactions**: Ensure alternatives for mobile

### Keyboard Navigation (Tablet with Keyboard)

Many tablets have attached keyboards, so maintain keyboard accessibility:

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
  className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-acr-red-500"
>
```

**Rules:**

- All clickable cards: Support Enter/Space keyboard activation
- Focus rings: Always visible on focus (don't hide for aesthetic)
- Tab order: Logical top-to-bottom, left-to-right flow

### Screen Reader Support

**Mobile Screen Reader Patterns:**

```jsx
// Loading state
<div role="progressbar" aria-label="Loading parts">

// Button without text (icon only)
<button aria-label="Close menu">
  <X className="w-5 h-5" />
</button>

// Clickable cards
<div
  role="button"
  tabIndex={0}
  aria-label={`View details for part ${sku}`}
>
```

**Rules:**

- Provide `aria-label` for icon-only buttons
- Use `role="button"` on clickable divs
- Loading states need `role="progressbar"`
- Complex interactions need `aria-describedby`

---

## Mobile Performance

### Performance Targets

**Mobile-Specific Targets:**

- **Tap to visual feedback**: < 100ms (instant feel)
- **API response to UI update**: < 300ms (feels fast)
- **Page transition**: < 200ms (smooth navigation)
- **Animation frame rate**: 60fps (smooth, no jank)

### Optimization Strategies

**Image Loading:**

```jsx
<Image
  src={src}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  loading="lazy" // Lazy load below fold
  quality={85} // Balance quality vs file size
/>
```

**Lazy Loading:**

- Product images: Lazy load (most are below fold)
- Banner carousel: Eager load first image, lazy load rest
- Avatars/icons: Eager load (small, critical)

**Bundle Size:**

- Mobile-specific code splitting (if needed)
- Defer non-critical JavaScript
- Inline critical CSS for faster first paint

---

## Mobile-Specific Anti-Patterns

### What NOT to Do

**❌ Hover-Dependent Interactions**

```jsx
// BAD: Requires hover to see action
<div className="group">
  <button className="hidden group-hover:block">Delete</button>
</div>

// GOOD: Always visible or use modal/menu
<div>
  <button className="block">Delete</button>
</div>
```

**❌ Tiny Touch Targets**

```jsx
// BAD: Too small to tap reliably
<button className="h-8 px-2">Save</button>  // 32px height

// GOOD: Comfortable touch target
<AcrButton className="h-12 px-4">Save</AcrButton>  // 48px height
```

**❌ Horizontal Scrolling (except carousels)**

```jsx
// BAD: Requires horizontal scroll in content area
<div className="flex overflow-x-auto">
  <Card /><Card /><Card />
</div>

// GOOD: Stack vertically or use proper grid
<div className="grid grid-cols-1 gap-3">
  <Card /><Card /><Card />
</div>
```

**❌ Desktop-Only Features Without Mobile Alternative**

```jsx
// BAD: Table with no mobile view
<table className="w-full">
  {/* Complex table */}
</table>

// GOOD: Cards on mobile, table on desktop
<div className="lg:hidden">
  {/* Card view */}
</div>
<div className="hidden lg:block">
  <table />
</div>
```

**❌ Cramming Desktop Layout on Mobile**

```jsx
// BAD: Forcing 3 columns on mobile
<div className="grid grid-cols-3 gap-2">

// GOOD: 1 column on mobile, scale up on larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
```

---

## Key Takeaways for Mobile Development

### Mobile Checklist

When building mobile layouts:

1. **Touch Targets**: All interactive elements ≥ 44px height
2. **Full Width**: Inputs and buttons should be `w-full` on mobile
3. **Stack Layouts**: Use `space-y-3` or `space-y-4`, avoid horizontal complexity
4. **Responsive Text**: Provide short labels for mobile, full text for desktop
5. **Progressive Disclosure**: Combine related info on mobile (separate on desktop)
6. **Active States**: Always provide `active:scale-[0.98]` feedback on cards
7. **Loading States**: Same preloader as desktop, appropriate skeletons
8. **Accessibility**: Maintain keyboard nav and ARIA labels
9. **No Hover**: Use `md:hover:` to limit hover effects to desktop
10. **Test on Device**: Emulators are helpful, but real tablets show the truth

### Common Mobile Patterns Summary

**Stacked Search:**

```jsx
<div className="md:hidden space-y-3">
  <AcrComboBox className="w-full h-12" />
  <AcrComboBox className="w-full h-12" />
  <AcrButton className="w-full h-12">Search</AcrButton>
</div>
```

**Combined Stats Card:**

```jsx
<div className="lg:hidden">
  <AcrCard padding="compact">
    <div className="flex flex-col gap-3">{/* Horizontal rows */}</div>
  </AcrCard>
</div>
```

**Mobile Card View (instead of table):**

```jsx
<div className="lg:hidden space-y-3">
  {items.map((item, i) => (
    <div
      className="bg-white rounded-lg border p-4 active:scale-[0.98]"
      onClick={handleClick}
      tabIndex={0}
      role="button"
    >
      {/* SKU badge + stats + chevron */}
    </div>
  ))}
</div>
```

**Responsive Truncation:**

```jsx
<span className="hidden lg:inline">Full Label Text</span>
<span className="lg:hidden">Short</span>
```

---

## Integration with Desktop Patterns

### Desktop Reference

Mobile patterns are designed to complement, not replace, desktop patterns. See `ACR_UX_PATTERNS.md` for:

- Desktop layout patterns (horizontal forms, multi-column grids)
- Complete component API (all variants and props)
- Animation system details (timing, stagger classes)
- Error state hierarchy (when to use which component)
- Color system and typography scale
- Accessibility standards

### Responsive Strategy

**Mobile-First, Desktop-Enhanced:**

1. Start with mobile layout (stacked, full-width, simplified)
2. Add `md:` breakpoint for tablet adjustments
3. Add `lg:` breakpoint for desktop transformation
4. Use `hidden lg:block` / `lg:hidden` for layout swaps
5. Test on real devices (tablets are primary target)

### Consistency Across Breakpoints

**Same Components, Different Layouts:**

- Use the same ACR components (`AcrButton`, `AcrCard`, etc.)
- Use the same color palette and typography
- Use the same animation timing and stagger system
- Use the same error states and loading patterns
- Only change: Layout, spacing, and density

This ensures a cohesive experience whether staff are on tablets at the parts counter or managers are on desktop workstations.

---

## Design System Reference

**Component Library**: `src/components/acr/`
**Desktop Patterns**: `ACR_UX_PATTERNS.md`
**Design Tokens**: `src/app/globals.css`
**Skeleton States**: `src/components/ui/skeleton.tsx`
**Error States**: `src/components/ui/error-states.tsx`
