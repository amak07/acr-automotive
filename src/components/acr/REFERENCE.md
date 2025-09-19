# ACR Components Quick Reference

> **Simple reference guide for ACR Design System components**

## Import Pattern
```tsx
import { AcrButton, AcrCard, AcrInput } from "@/components/acr";
```

## Components

### AcrButton
```tsx
// Variants: primary, secondary, destructive, outline, ghost
// Sizes: sm, default, lg

<AcrButton variant="primary" size="default">
  Save Changes
</AcrButton>

<AcrButton variant="secondary" size="sm" disabled>
  Cancel
</AcrButton>
```

### AcrCard System
```tsx
<AcrCard variant="default" padding="none">
  <AcrCardHeader className="px-6 pt-6">
    <h2>Card Title</h2>
  </AcrCardHeader>
  <AcrCardContent className="px-6 pb-6">
    <p>Card content goes here</p>
  </AcrCardContent>
</AcrCard>
```

### AcrInput
```tsx
<AcrInput
  placeholder="Search by ACR SKU..."
  value={value}
  onChange={setValue}
  className="bg-acr-gray-50"  // readonly styling
/>
```

### AcrSelect
```tsx
<AcrSelect.Root value={selectedValue} onValueChange={setSelectedValue}>
  <AcrSelect.Trigger variant="default">
    <AcrSelect.Value placeholder="Select option..." />
  </AcrSelect.Trigger>
  <AcrSelect.Content>
    <AcrSelect.Item value="option1">Option 1</AcrSelect.Item>
    <AcrSelect.Item value="option2">Option 2</AcrSelect.Item>
  </AcrSelect.Content>
</AcrSelect.Root>

// Disabled variant
<AcrSelect.Root value={value} disabled>
  <AcrSelect.Trigger variant="disabled">
    <AcrSelect.Value />
  </AcrSelect.Trigger>
</AcrSelect.Root>
```

### AcrTextarea
```tsx
<AcrTextarea
  rows={4}
  placeholder="Enter notes..."
  value={notes}
  onChange={setNotes}
  className="bg-acr-gray-50"  // readonly styling
/>
```

### AcrLabel
```tsx
<AcrLabel htmlFor="input-id">
  Field Label
</AcrLabel>
<AcrInput id="input-id" />
```

## Common Patterns

### Form Field
```tsx
<div>
  <AcrLabel htmlFor="sku">ACR SKU</AcrLabel>
  <AcrInput
    id="sku"
    value={data.acr_sku}
    readOnly
    className="bg-acr-gray-50"
  />
</div>
```

### Card with Icon Header
```tsx
<AcrCard variant="default" padding="none">
  <AcrCardHeader className="px-6 pt-6">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
        <Info className="w-4 h-4 text-white" />
      </div>
      <h2 className="text-lg font-semibold text-acr-gray-900">
        {t("section.title")}
      </h2>
    </div>
  </AcrCardHeader>
  <AcrCardContent className="px-6 pb-6">
    {/* Content */}
  </AcrCardContent>
</AcrCard>
```

### Button Group
```tsx
<div className="flex gap-3">
  <AcrButton variant="secondary" className="flex-1">
    Cancel
  </AcrButton>
  <AcrButton variant="primary" className="flex-1">
    Save
  </AcrButton>
</div>
```

### Loading Button
```tsx
<AcrButton
  variant="primary"
  disabled={isSaving}
  className="flex items-center gap-2"
>
  {isSaving ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {t("common.actions.saving")}
    </>
  ) : (
    <>
      <Save className="w-4 h-4" />
      {t("common.actions.save")}
    </>
  )}
</AcrButton>
```

## Color Classes

### Primary Colors
```css
/* ACR Red */
bg-acr-red-100  text-acr-red-600  /* Light backgrounds */
bg-acr-red-600  text-white        /* Primary buttons */

/* ACR Gray */
bg-acr-gray-50   text-acr-gray-900  /* Input backgrounds */
bg-acr-gray-100  text-acr-gray-900  /* Page backgrounds */
bg-acr-gray-200                     /* Borders */
text-acr-gray-500                   /* Secondary text */
text-acr-gray-600                   /* Labels */
```

### Status Colors
```css
/* Success */
bg-green-100  text-green-600

/* Warning */
bg-orange-100  text-orange-600

/* Error */
bg-red-100  text-red-600

/* Info */
bg-blue-100  text-blue-600
```

## Responsive Classes

### Layout
```css
/* Mobile-first responsive */
block lg:hidden          /* Mobile only */
hidden lg:block          /* Desktop only */
space-y-3 lg:space-y-0   /* Mobile stacked, desktop inline */

/* Grid patterns */
lg:grid lg:grid-cols-2   /* Desktop 2-column */
lg:grid-cols-3           /* Desktop 3-column */
lg:grid-cols-6           /* Desktop 6-column */
```

### Sizing
```css
/* Touch-friendly mobile */
w-full                   /* Full width on mobile */
px-4 lg:px-6            /* Responsive padding */
text-sm lg:text-base    /* Responsive text */
```

## Icon Patterns

### Header Icons
```tsx
<div className="w-8 h-8 bg-acr-red-100 rounded-lg flex items-center justify-center">
  <Settings className="w-4 h-4 text-acr-red-600" />
</div>
```

### Stats Icons (with colors)
```tsx
// Green - Applications
<div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
  <MapPin className="w-4 h-4 text-green-600" />
</div>

// Purple - Cross References
<div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
  <Shield className="w-4 h-4 text-purple-600" />
</div>

// Blue - Position
<div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
  <Zap className="w-4 h-4 text-blue-600" />
</div>
```

## Translation Integration
```tsx
const { t } = useLocale();

<AcrButton variant="primary">
  {t("common.actions.save")}
</AcrButton>

<AcrLabel htmlFor="sku">
  {t("partDetails.basicInfo.acrSku")}
</AcrLabel>
```

## Common Styling Patterns

### Readonly Fields
```css
className="bg-acr-gray-50"  /* Light gray background */
readOnly                    /* HTML attribute */
```

### Card Spacing
```css
className="px-4 py-4 lg:px-6"        /* Card padding */
className="px-4 pb-6 lg:px-6"        /* Card content */
className="mb-6"                     /* Card bottom margin */
```

### Form Layouts
```css
className="space-y-4"                /* Vertical form spacing */
className="lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0"  /* Responsive form grid */
```

### Button Groups
```css
className="flex gap-3"               /* Horizontal button spacing */
className="flex-1"                   /* Equal width buttons */
className="w-full"                   /* Full width button */
```

---

**Quick Tips:**
- Always use translation keys (`t()`) for text
- Prefer `lg:` breakpoint for desktop layouts
- Use `bg-acr-gray-50` for readonly inputs
- Include loading states for async actions
- Test on mobile first, then desktop