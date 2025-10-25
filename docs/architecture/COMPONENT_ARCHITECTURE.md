# Component Architecture

> **Purpose**: ACR Design System patterns, component structure, and usage guidelines
>
> **Last Updated**: 2025-10-25
> **Status**: Production

## Table of Contents

- [Design System Overview](#design-system-overview)
- [Component Philosophy](#component-philosophy)
- [Component Structure](#component-structure)
- [Core Components](#core-components)
- [Styling Strategy](#styling-strategy)
- [Accessibility Patterns](#accessibility-patterns)
- [Usage Examples](#usage-examples)

---

## Design System Overview

**ACR Design System**: Custom component library built specifically for ACR Automotive's auto parts management interface.

**Built On**: shadcn/ui principles (copy, don't import)

**Purpose**:
- Consistent UI across admin and public interfaces
- Mexican B2B market focus (Spanish-first)
- Tablet-optimized for parts counter workstations
- Professional auto parts industry styling

---

## Component Philosophy

### Copy, Don't Import

**Pattern**: Own all component code in codebase.

**Why**:
- **Full control**: Maximum customization for business needs
- **No breaking changes**: No dependencies on external library updates
- **Business alignment**: Components tailored for auto parts workflows
- **Maintenance freedom**: Modify without upstream constraints

**How It Works**:
```
shadcn/ui (inspiration) → Copy pattern → Customize for ACR → Own component
```

**Example**:
```typescript
// ❌ Don't import external component library
import { Button } from "@radix-ui/react-button";

// ✅ Use ACR-owned component
import { AcrButton } from "@/components/acr/Button";
```

**See**: [src/components/acr/README.md](../../src/components/acr/README.md)

---

### Mobile-First Design

**Primary Use Case**: Tablet interfaces at parts counter workstations.

**Design Priorities**:
1. **Touch targets**: Minimum 44px for reliable finger interaction
2. **Responsive**: Mobile-optimized with desktop enhancements
3. **Performance**: Fast loading for business-critical operations
4. **Scannable**: Easy to quickly find relevant information

**Breakpoint Strategy**:
```typescript
// Mobile-first approach
className="
  w-full              // Mobile: Full width
  lg:w-1/2            // Desktop: Half width
"
```

**Touch Target Sizes**:
```typescript
size: {
  sm: "h-9 px-4",      // 36px (for tight spaces)
  default: "h-11 px-6", // 44px (primary touch target)
  lg: "h-13 px-8",     // 52px (important actions)
}
```

---

### Mexican B2B Market Focus

**Language**: Spanish-first with English development support.

**Cultural Considerations**:
- Professional styling for Mexican business culture
- Auto parts industry terminology
- Distributor/parts counter staff as primary users

**Implementation**:
```typescript
// All UI text uses translation keys
<AcrButton>{t("common.actions.save")}</AcrButton>
// "Guardar" in production, "Save" in development
```

---

## Component Structure

### File Organization

```
src/components/acr/
├── Button.tsx          # Core interaction component
├── Card.tsx            # Content container system
├── Input.tsx           # Form input components
├── Select.tsx          # Dropdown selection system
├── FormField.tsx       # Form field wrapper
├── Table.tsx           # Data table component
├── Pagination.tsx      # Pagination controls
├── SearchInput.tsx     # Search-specific input
├── ComboBox.tsx        # Autocomplete selection
├── DirtyIndicator.tsx  # Form change indicator
├── Spinner.tsx         # Loading indicator
├── Alert.tsx           # Alert messages
├── Modal.tsx           # Modal dialogs
├── ConfirmDialog.tsx   # Confirmation dialogs
├── Tooltip.tsx         # Tooltip component
├── Label.tsx           # Form label
├── Textarea.tsx        # Multi-line input
├── NavLink.tsx         # Navigation links
├── Header.tsx          # Page header
├── LanguageToggle.tsx  # Locale switcher
├── ImageUpload.tsx     # Image upload widget
├── Tabs.tsx            # Tab navigation
├── index.ts            # Central export
└── README.md           # Documentation
```

**Naming Convention**: All components prefixed with `Acr` for clarity.

---

### Component Pattern

**Standard Structure**:

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

// 1. Props interface
export interface AcrComponentProps {
  // Standard HTML props
  className?: string;
  children?: React.ReactNode;

  // Component-specific props
  variant?: "primary" | "secondary";
  size?: "sm" | "default" | "lg";

  // Business logic props
  isDirty?: boolean;
  error?: string;
}

// 2. Component implementation
export const AcrComponent = React.forwardRef<
  HTMLElement,
  AcrComponentProps
>(({ className, variant, ...props }, ref) => {
  return (
    <element
      ref={ref}
      className={cn("base-classes", className)}
      {...props}
    />
  );
});

// 3. Display name (for React DevTools)
AcrComponent.displayName = "AcrComponent";
```

---

### Variant Pattern

**Using CVA (Class Variance Authority)**:

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const acrButtonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center gap-2 rounded-xl transition-all",
  {
    variants: {
      variant: {
        primary: "bg-acr-red-500 text-white hover:bg-acr-red-600",
        secondary: "border-2 border-black bg-white text-black",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "h-9 px-4",
        default: "h-11 px-6",
        lg: "h-13 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

// Type inference from variants
export interface AcrButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof acrButtonVariants> {}
```

**Usage**:
```typescript
<AcrButton variant="primary" size="lg">Save</AcrButton>
<AcrButton variant="secondary">Cancel</AcrButton>
<AcrButton variant="destructive" size="sm">Delete</AcrButton>
```

---

## Core Components

### AcrButton

**File**: [src/components/acr/Button.tsx](../../src/components/acr/Button.tsx)

**Purpose**: Primary interaction element with brand-specific styling.

**Variants**:
- `primary`: ACR red gradient (Coca-Cola inspired)
- `secondary`: Outlined black border
- `destructive`: Red gradient for dangerous actions
- `ghost`: Subtle hover for tertiary actions
- `link`: Underlined text link
- `success`: Green gradient for positive actions

**Sizes**:
- `sm`: 36px height (tight spaces)
- `default`: 44px height (primary touch target)
- `lg`: 52px height (important actions)
- `icon`: 44x44px square (icon buttons)

**Example**:
```typescript
import { AcrButton } from "@/components/acr/Button";

<AcrButton variant="primary" size="default">
  {t("common.actions.save")}
</AcrButton>

<AcrButton variant="secondary" onClick={onCancel}>
  {t("common.actions.cancel")}
</AcrButton>

<AcrButton variant="destructive" size="sm" onClick={onDelete}>
  {t("common.actions.delete")}
</AcrButton>
```

**Design Notes**:
- Gradient backgrounds for depth (Coca-Cola inspired)
- 2px border on secondary for strong visual contrast
- Focus ring for accessibility
- Shadow states for tactile feedback

---

### AcrFormField

**File**: [src/components/acr/FormField.tsx](../../src/components/acr/FormField.tsx)

**Purpose**: Consistent form field wrapper with label, error, and dirty indicator.

**Props**:
- `label`: Field label text
- `required`: Show red asterisk
- `isDirty`: Show dirty indicator (unsaved changes)
- `error`: Error message (red text)
- `helperText`: Helper text (gray text)
- `labelSuffix`: Additional content next to label (e.g., tooltip)

**Example**:
```typescript
import { AcrFormField } from "@/components/acr/FormField";
import { AcrInput } from "@/components/acr/Input";

<AcrFormField
  label={t("admin.parts.sku")}
  required
  isDirty={formState.isDirty}
  error={errors.sku_number?.message}
  htmlFor="sku"
>
  <AcrInput
    id="sku"
    {...register("sku_number")}
  />
</AcrFormField>
```

**Visual Elements**:
```
┌─────────────────────────────────────┐
│ SKU * 🔴                            │ ← Label + Required + Dirty indicator
│ ┌─────────────────────────────────┐ │
│ │ ACR-BR-001                      │ │ ← Input field
│ └─────────────────────────────────┘ │
│ This field is required              │ ← Error or helper text
└─────────────────────────────────────┘
```

---

### AcrInput

**File**: [src/components/acr/Input.tsx](../../src/components/acr/Input.tsx)

**Purpose**: Text input with validation states.

**Variants**:
- `default`: Standard input
- `error`: Red border for validation errors

**States**:
- Focus: Blue border
- Error: Red border
- Disabled: Gray background, no interaction
- Readonly: White background, no interaction

**Example**:
```typescript
import { AcrInput } from "@/components/acr/Input";

<AcrInput
  type="text"
  placeholder={t("admin.search.placeholder")}
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

<AcrInput
  type="number"
  min={0}
  max={100}
  step={1}
  value={quantity}
  onChange={(e) => setQuantity(Number(e.target.value))}
/>
```

---

### AcrCard

**File**: [src/components/acr/Card.tsx](../../src/components/acr/Card.tsx)

**Purpose**: Content container with consistent spacing and hierarchy.

**Sub-components**:
- `AcrCard`: Container
- `AcrCardHeader`: Header section
- `AcrCardTitle`: Title text
- `AcrCardDescription`: Description text
- `AcrCardContent`: Main content area
- `AcrCardFooter`: Footer section (actions)

**Example**:
```typescript
import {
  AcrCard,
  AcrCardHeader,
  AcrCardTitle,
  AcrCardDescription,
  AcrCardContent,
  AcrCardFooter,
} from "@/components/acr/Card";

<AcrCard>
  <AcrCardHeader>
    <AcrCardTitle>{t("admin.parts.details")}</AcrCardTitle>
    <AcrCardDescription>
      {t("admin.parts.specifications")}
    </AcrCardDescription>
  </AcrCardHeader>

  <AcrCardContent>
    {/* Form fields, data, etc. */}
  </AcrCardContent>

  <AcrCardFooter>
    <AcrButton variant="secondary">{t("common.actions.cancel")}</AcrButton>
    <AcrButton variant="primary">{t("common.actions.save")}</AcrButton>
  </AcrCardFooter>
</AcrCard>
```

---

### AcrTable

**File**: [src/components/acr/Table.tsx](../../src/components/acr/Table.tsx)

**Purpose**: Data table with responsive design.

**Sub-components**:
- `AcrTable`: Container
- `AcrTableHeader`: Header row group
- `AcrTableBody`: Body rows
- `AcrTableRow`: Table row
- `AcrTableHead`: Header cell
- `AcrTableCell`: Data cell

**Example**:
```typescript
import {
  AcrTable,
  AcrTableHeader,
  AcrTableBody,
  AcrTableRow,
  AcrTableHead,
  AcrTableCell,
} from "@/components/acr/Table";

<AcrTable>
  <AcrTableHeader>
    <AcrTableRow>
      <AcrTableHead>{t("admin.parts.sku")}</AcrTableHead>
      <AcrTableHead>{t("admin.search.partType")}</AcrTableHead>
      <AcrTableHead>{t("admin.parts.actions")}</AcrTableHead>
    </AcrTableRow>
  </AcrTableHeader>

  <AcrTableBody>
    {parts.map((part) => (
      <AcrTableRow key={part.id}>
        <AcrTableCell>{part.acr_sku}</AcrTableCell>
        <AcrTableCell>{part.part_type}</AcrTableCell>
        <AcrTableCell>
          <AcrButton size="sm">{t("common.actions.edit")}</AcrButton>
        </AcrTableCell>
      </AcrTableRow>
    ))}
  </AcrTableBody>
</AcrTable>
```

---

### AcrComboBox

**File**: [src/components/acr/ComboBox.tsx](../../src/components/acr/ComboBox.tsx)

**Purpose**: Autocomplete selection with "add new value" support.

**Features**:
- Search/filter items
- Keyboard navigation
- Add custom values (when `allowCustom={true}`)
- i18n support for "no results" message

**Example**:
```typescript
import { AcrComboBox } from "@/components/acr/ComboBox";

const [partType, setPartType] = useState("");

<AcrComboBox
  value={partType}
  onValueChange={setPartType}
  items={partTypeOptions}
  placeholder={t("admin.search.partType")}
  allowCustom={true}
  noResultsMessage={t("comboBox.noResults")}
/>
```

**Use Cases**:
- Part type selection (with ability to add new types)
- Vehicle make/model selection
- Any field with predefined options + custom input

---

### AcrPagination

**File**: [src/components/acr/Pagination.tsx](../../src/components/acr/Pagination.tsx)

**Purpose**: Pagination controls for large lists.

**Props**:
- `offset`: Current offset
- `limit`: Items per page
- `total`: Total item count
- `onPageChange`: Callback when page changes

**Example**:
```typescript
import { AcrPagination } from "@/components/acr/Pagination";

<AcrPagination
  offset={0}
  limit={50}
  total={9593}
  onPageChange={(newOffset) => setOffset(newOffset)}
/>

// Shows: "1-50 of 9,593" with Previous/Next buttons
```

---

### AcrDirtyIndicator

**File**: [src/components/acr/DirtyIndicator.tsx](../../src/components/acr/DirtyIndicator.tsx)

**Purpose**: Visual indicator for unsaved form changes.

**Variants**:
- `dot`: Small red dot (🔴)
- `badge`: "Unsaved" badge

**Example**:
```typescript
import { AcrDirtyIndicator } from "@/components/acr/DirtyIndicator";

<AcrDirtyIndicator
  show={formState.isDirty}
  variant="dot"
/>
```

**Use Case**: Show users which fields have unsaved changes.

---

### AcrConfirmDialog

**File**: [src/components/acr/ConfirmDialog.tsx](../../src/components/acr/ConfirmDialog.tsx)

**Purpose**: Confirmation dialog for destructive actions.

**Props**:
- `open`: Dialog open state
- `onOpenChange`: Open state change callback
- `title`: Dialog title
- `description`: Dialog description
- `onConfirm`: Confirm button callback
- `confirmText`: Confirm button text
- `cancelText`: Cancel button text
- `variant`: "destructive" or "default"

**Example**:
```typescript
import { AcrConfirmDialog } from "@/components/acr/ConfirmDialog";

const [showDeleteDialog, setShowDeleteDialog] = useState(false);

<AcrConfirmDialog
  open={showDeleteDialog}
  onOpenChange={setShowDeleteDialog}
  title={t("common.confirm.delete.title")}
  description={t("common.confirm.delete.description")}
  onConfirm={handleDelete}
  confirmText={t("common.actions.delete")}
  cancelText={t("common.actions.cancel")}
  variant="destructive"
/>
```

---

## Styling Strategy

### Tailwind CSS Utilities

**Philosophy**: Utility-first styling with Tailwind CSS.

**Benefits**:
- Fast development
- Consistent spacing/sizing
- No CSS file maintenance
- Tree-shaking (unused styles removed)

**Example**:
```typescript
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  {/* content */}
</div>
```

---

### Custom CSS Classes

**Pattern**: Custom classes for typography and brand colors.

**Typography Classes** (in `globals.css`):
```css
.acr-action-text {
  @apply text-sm font-semibold tracking-wide;
}

.acr-caption {
  @apply text-xs text-gray-500;
}
```

**Usage**:
```typescript
<p className="acr-action-text">Button Text</p>
<p className="acr-caption">Helper text</p>
```

---

### Brand Colors

**Tailwind Config** (extended colors):
```javascript
theme: {
  extend: {
    colors: {
      "acr-red": {
        500: "#E13629", // Primary brand red
        600: "#C42E23",
        700: "#A7261D",
      },
      "acr-gray": {
        100: "#F5F5F5",
        500: "#737373",
        700: "#404040",
        900: "#171717",
      },
    },
  },
}
```

**Usage**:
```typescript
<button className="bg-acr-red-500 hover:bg-acr-red-600">
  Save
</button>
```

---

### `cn()` Utility

**Purpose**: Merge Tailwind classes safely (handles conflicts).

**Implementation**:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage**:
```typescript
<div className={cn(
  "base-class",
  variant === "primary" && "variant-class",
  className // User-provided override
)}>
  {/* content */}
</div>
```

**Why**:
- Resolves conflicts: `cn("p-4", "p-6")` → `"p-6"` (not both)
- Conditional classes: `cn("base", isActive && "active")`
- User overrides: `className` prop takes precedence

---

## Accessibility Patterns

### Keyboard Navigation

**Focus Management**:
```typescript
<button
  className="focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
>
  Click me
</button>
```

**Tab Order**: Logical flow through interactive elements.

**Keyboard Shortcuts**:
- Enter/Space: Activate buttons
- Escape: Close modals/dialogs
- Arrow keys: Navigate combobox/select options

---

### Screen Reader Support

**Label Association**:
```typescript
<AcrLabel htmlFor="sku">SKU</AcrLabel>
<AcrInput id="sku" {...register("sku_number")} />
```

**ARIA Attributes**:
```typescript
<button aria-label={t("common.actions.delete")}>
  <TrashIcon />
</button>

<div role="alert" aria-live="polite">
  {error && <p>{error.message}</p>}
</div>
```

---

### Color Contrast

**WCAG AA Compliance**:
- Text on background: 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Example**:
```typescript
// ✅ Good contrast
<p className="text-black bg-white">High contrast</p>

// ❌ Low contrast
<p className="text-gray-400 bg-gray-300">Hard to read</p>
```

---

## Usage Examples

### Example 1: Create Part Form

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@/contexts/LocaleContext";
import { useCreatePart } from "@/hooks/admin/useCreatePart";
import { createPartSchema } from "@/lib/schemas/admin";
import {
  AcrCard,
  AcrCardHeader,
  AcrCardTitle,
  AcrCardContent,
  AcrCardFooter,
} from "@/components/acr/Card";
import { AcrFormField } from "@/components/acr/FormField";
import { AcrInput } from "@/components/acr/Input";
import { AcrButton } from "@/components/acr/Button";

export function CreatePartForm() {
  const { t } = useLocale();
  const createPart = useCreatePart();

  const form = useForm({
    resolver: zodResolver(createPartSchema),
  });

  async function onSubmit(data) {
    try {
      await createPart.mutateAsync(data);
      toast({ title: t("part_created_success") });
    } catch (error) {
      toast({ title: t("part_created_error"), variant: "destructive" });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <AcrCard>
        <AcrCardHeader>
          <AcrCardTitle>{t("common.actions.createPart")}</AcrCardTitle>
        </AcrCardHeader>

        <AcrCardContent className="space-y-4">
          <AcrFormField
            label={t("admin.parts.sku")}
            required
            isDirty={form.formState.dirtyFields.sku_number}
            error={form.formState.errors.sku_number?.message}
            htmlFor="sku"
          >
            <AcrInput id="sku" {...form.register("sku_number")} />
          </AcrFormField>

          <AcrFormField
            label={t("admin.search.partType")}
            required
            isDirty={form.formState.dirtyFields.part_type}
            error={form.formState.errors.part_type?.message}
            htmlFor="partType"
          >
            <AcrInput id="partType" {...form.register("part_type")} />
          </AcrFormField>
        </AcrCardContent>

        <AcrCardFooter>
          <AcrButton type="button" variant="secondary" onClick={() => form.reset()}>
            {t("common.actions.cancel")}
          </AcrButton>
          <AcrButton type="submit" disabled={createPart.isPending}>
            {createPart.isPending ? t("common.actions.creating") : t("common.actions.createPart")}
          </AcrButton>
        </AcrCardFooter>
      </AcrCard>
    </form>
  );
}
```

---

### Example 2: Parts List Table

```typescript
"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useGetParts } from "@/hooks/admin/useGetParts";
import { AcrButton } from "@/components/acr/Button";
import { AcrSearchInput } from "@/components/acr/SearchInput";
import { AcrPagination } from "@/components/acr/Pagination";
import {
  AcrTable,
  AcrTableHeader,
  AcrTableBody,
  AcrTableRow,
  AcrTableHead,
  AcrTableCell,
} from "@/components/acr/Table";

export function PartsListTable() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data, isLoading } = useGetParts({
    search,
    offset,
    limit,
    sort_by: "acr_sku",
    sort_order: "asc",
  });

  if (isLoading) return <AcrSpinner />;

  return (
    <div className="space-y-4">
      <AcrSearchInput
        value={search}
        onChange={setSearch}
        placeholder={t("admin.search.placeholder")}
      />

      <AcrTable>
        <AcrTableHeader>
          <AcrTableRow>
            <AcrTableHead>{t("admin.parts.sku")}</AcrTableHead>
            <AcrTableHead>{t("admin.search.partType")}</AcrTableHead>
            <AcrTableHead>{t("admin.parts.actions")}</AcrTableHead>
          </AcrTableRow>
        </AcrTableHeader>

        <AcrTableBody>
          {data.data.map((part) => (
            <AcrTableRow key={part.id}>
              <AcrTableCell>{part.acr_sku}</AcrTableCell>
              <AcrTableCell>{part.part_type}</AcrTableCell>
              <AcrTableCell>
                <AcrButton
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/parts/${part.id}`)}
                >
                  {t("common.actions.view")}
                </AcrButton>
              </AcrTableCell>
            </AcrTableRow>
          ))}
        </AcrTableBody>
      </AcrTable>

      <AcrPagination
        offset={offset}
        limit={limit}
        total={data.count}
        onPageChange={setOffset}
      />
    </div>
  );
}
```

---

## Related Documentation

- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) - React hooks used with components
- [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md) - Translation system for component text
- [src/components/acr/README.md](../../src/components/acr/README.md) - Full design system documentation

---

**Complete**: This completes the architecture documentation series. See [OVERVIEW.md](OVERVIEW.md) for the 30,000-foot view.
