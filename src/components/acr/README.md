# ACR Design System

> **Custom component library built on shadcn/ui for ACR Automotive**

## Overview

The ACR Design System is a custom component library built specifically for ACR Automotive, extending shadcn/ui with our own design tokens, patterns, and business requirements. We follow the principle of **component ownership** - copying and customizing components rather than importing external dependencies.

## Design Principles

### 1. Component Ownership Philosophy
- **Copy, don't import**: We own all UI components in our codebase
- **Customizable**: Full control over styling, behavior, and functionality
- **Maintainable**: No external dependencies for core UI components
- **Consistent**: Unified design language across the application

### 2. Mobile-First Responsive Design
- **Touch-friendly**: 44px minimum touch targets
- **Responsive**: Mobile-first with desktop enhancements
- **Accessible**: Proper contrast ratios and keyboard navigation
- **Performance**: Optimized for tablet use at parts counters

### 3. ACR Branding Integration
- **Color System**: ACR red primary, professional gray palette
- **Typography**: Clear hierarchy with proper spacing
- **Mexican Market**: Designed for Spanish-speaking users
- **B2B Interface**: Professional styling for business use

## Component Architecture

### Base Components

#### AcrButton
- **Variants**: `primary`, `secondary`, `destructive`, `outline`, `ghost`
- **Sizes**: `sm`, `default`, `lg`
- **States**: Normal, hover, focus, disabled, loading
- **Usage**: All clickable actions throughout the application

```tsx
<AcrButton variant="primary" size="default">
  Save Changes
</AcrButton>
```

#### AcrInput
- **Variants**: `default`, `error`, `disabled`
- **Features**: Built-in validation states, proper focus management
- **Accessibility**: Label association, error announcements
- **Usage**: All text input fields

```tsx
<AcrInput
  placeholder="Search by ACR SKU..."
  value={searchTerm}
  onChange={setSearchTerm}
/>
```

#### AcrCard System
- **Components**: `AcrCard`, `AcrCardHeader`, `AcrCardContent`
- **Variants**: `default`, `elevated`
- **Padding**: `none`, `sm`, `default`, `lg`
- **Usage**: Content containers, forms, data display

```tsx
<AcrCard variant="default" padding="none">
  <AcrCardHeader>
    <h2>Part Details</h2>
  </AcrCardHeader>
  <AcrCardContent>
    <p>Content goes here</p>
  </AcrCardContent>
</AcrCard>
```

### Form Components

#### AcrSelect
- **Components**: `Root`, `Trigger`, `Content`, `Item`, `Value`
- **Variants**: `default`, `disabled`
- **Features**: Keyboard navigation, search functionality
- **Usage**: Dropdown selections, filters

#### AcrTextarea
- **Features**: Auto-resize, character counting, validation states
- **Usage**: Notes, descriptions, multi-line input

#### AcrLabel
- **Features**: Proper association with form controls
- **Accessibility**: Screen reader support
- **Usage**: All form field labels

## Color System

### Primary Colors
- **ACR Red**: `acr-red-50` to `acr-red-900`
- **Primary**: `#DC2626` (acr-red-600)
- **Usage**: Primary actions, branding, active states

### Neutral Colors
- **ACR Gray**: `acr-gray-50` to `acr-gray-900`
- **Background**: `acr-gray-100` (page backgrounds)
- **Text**: `acr-gray-900` (primary text), `acr-gray-600` (secondary)
- **Borders**: `acr-gray-200` (subtle), `acr-gray-300` (defined)

### Status Colors
- **Success**: Green palette for confirmations
- **Warning**: Yellow/orange palette for alerts
- **Error**: Red palette for errors
- **Info**: Blue palette for information

### Component-Specific Colors
- **Stats Icons**: Colored backgrounds for visual hierarchy
  - Green: Applications (MapPin icon)
  - Purple: Cross References (Shield icon)
  - Blue: Position (Zap icon)
  - Orange: ABS (Settings icon)
  - Yellow: Drive (Wrench icon)
  - Cyan: Bolt Pattern (Settings icon)

## Layout Patterns

### Responsive Grid System
- **Mobile**: Single column, stacked layouts
- **Tablet**: 2-3 column grids with appropriate breakpoints
- **Desktop**: Up to 6 column layouts for data display

### Card Layouts
- **Header**: Title, icons, action buttons
- **Content**: Form fields, data display, lists
- **Footer**: Actions, metadata, navigation

### Navigation Patterns
- **Breadcrumbs**: Hierarchical navigation
- **Back buttons**: Clear navigation paths
- **Pagination**: Responsive with page info

## Component Guidelines

### Naming Conventions
- **Prefix**: All components start with `Acr`
- **Pascal Case**: `AcrButton`, `AcrCardHeader`
- **Descriptive**: Clear purpose from name

### File Structure
```
src/components/acr/
├── Button.tsx          # AcrButton component
├── Card.tsx           # AcrCard system
├── Input.tsx          # AcrInput component
├── Select.tsx         # AcrSelect system
├── Textarea.tsx       # AcrTextarea component
├── Label.tsx          # AcrLabel component
├── index.ts           # Export all components
└── README.md          # This documentation
```

### Import Pattern
```tsx
// Preferred: Named imports from acr folder
import { AcrButton, AcrCard, AcrInput } from "@/components/acr";

// Individual imports when needed
import { AcrButton } from "@/components/acr/Button";
```

## Usage Examples

### Part Details Header
```tsx
<AcrCard variant="default" padding="none">
  <div className="bg-white px-4 py-4 border-b border-acr-gray-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-acr-red-100 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-acr-red-600" />
        </div>
        <h1 className="text-xl font-bold text-acr-gray-900">
          {acrSku}
        </h1>
      </div>
      <AcrButton variant="primary" size="default">
        Save Changes
      </AcrButton>
    </div>
  </div>
</AcrCard>
```

### Form Layout
```tsx
<AcrCard variant="default">
  <AcrCardHeader>
    <h2>Basic Information</h2>
  </AcrCardHeader>
  <AcrCardContent>
    <div className="space-y-4">
      <div>
        <AcrLabel htmlFor="sku">ACR SKU</AcrLabel>
        <AcrInput
          id="sku"
          value={data.acr_sku}
          readOnly
          className="bg-acr-gray-50"
        />
      </div>
      <div>
        <AcrLabel htmlFor="type">Part Type</AcrLabel>
        <AcrSelect.Root value={data.part_type}>
          <AcrSelect.Trigger>
            <AcrSelect.Value />
          </AcrSelect.Trigger>
          <AcrSelect.Content>
            <AcrSelect.Item value="maza">MAZA</AcrSelect.Item>
            <AcrSelect.Item value="disco">Disco de Freno</AcrSelect.Item>
          </AcrSelect.Content>
        </AcrSelect.Root>
      </div>
    </div>
  </AcrCardContent>
</AcrCard>
```

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical focus flow
- **Enter/Space**: Activate buttons and controls
- **Arrow Keys**: Navigate select options
- **Escape**: Close modals and dropdowns

### Screen Reader Support
- **Labels**: Proper association with form controls
- **ARIA**: Appropriate roles and states
- **Announcements**: Status changes and errors
- **Landmarks**: Semantic HTML structure

### Visual Accessibility
- **Contrast**: WCAG AA compliant color ratios
- **Focus Indicators**: Clear visual focus states
- **Touch Targets**: Minimum 44px for mobile
- **Text Scaling**: Responsive to user font size preferences

## Development Guidelines

### Component Creation
1. **Start with shadcn/ui**: Use as base when applicable
2. **Customize for ACR**: Apply our design tokens and patterns
3. **Document variants**: Clear API documentation
4. **Test responsiveness**: Mobile-first validation
5. **Accessibility audit**: Screen reader and keyboard testing

### Design Token Usage
- **Use CSS classes**: Prefer Tailwind utilities over inline styles
- **Consistent spacing**: Use spacing scale (4px, 8px, 12px, 16px, 24px, 32px)
- **Color tokens**: Always use ACR color variables
- **Typography**: Consistent font sizes and line heights

### Performance Considerations
- **Tree shaking**: Export only used components
- **Bundle size**: Monitor component weight
- **Runtime performance**: Avoid unnecessary re-renders
- **Loading states**: Provide feedback for async operations

## Translation Integration

### Text Handling
- **No hardcoded text**: All text uses translation keys
- **Context aware**: Proper namespace organization
- **Format support**: Number, date, and currency formatting
- **Fallbacks**: Graceful degradation for missing translations

### Example Usage
```tsx
const { t } = useLocale();

<AcrButton variant="primary">
  {t("common.actions.save")}
</AcrButton>
```

## Browser Support

### Target Browsers
- **Chrome**: 90+ (primary)
- **Safari**: 14+ (iOS/macOS)
- **Edge**: 90+ (Windows)
- **Firefox**: 88+ (fallback)

### Mobile Support
- **iOS Safari**: 14+
- **Chrome Mobile**: 90+
- **Android WebView**: 90+

## Maintenance

### Regular Tasks
- **Design token updates**: Color and spacing refinements
- **Accessibility audits**: Quarterly WCAG compliance checks
- **Performance monitoring**: Bundle size and runtime metrics
- **User feedback**: Incorporate usability improvements

### Version Management
- **Breaking changes**: Major version updates
- **New components**: Minor version updates
- **Bug fixes**: Patch version updates
- **Documentation**: Always updated with changes

---

## Getting Started

1. **Import components**: Use named imports from `@/components/acr`
2. **Follow patterns**: Reference existing component usage
3. **Test responsiveness**: Verify mobile and desktop layouts
4. **Check accessibility**: Validate keyboard and screen reader support
5. **Review with team**: Ensure consistency with design system

For questions or contributions to the ACR Design System, refer to the project documentation or reach out to the development team.