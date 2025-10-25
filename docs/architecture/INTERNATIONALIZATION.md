# Internationalization (i18n) System

> **Purpose**: Custom i18n architecture for English/Spanish bilingual support
>
> **Last Updated**: 2025-10-25
> **Status**: Production

## Table of Contents

- [System Overview](#system-overview)
- [Why Custom i18n](#why-custom-i18n)
- [Architecture](#architecture)
- [Translation Keys](#translation-keys)
- [Usage Patterns](#usage-patterns)
- [Adding New Translations](#adding-new-translations)
- [Development vs Production](#development-vs-production)

---

## System Overview

**Purpose**: Bilingual support for ACR Automotive (English + Spanish).

**Key Features**:
- Type-safe translation keys
- Custom lightweight implementation
- Development toggle (English for dev, Spanish for production)
- Hierarchical key namespacing
- Context-based translation function

**Production Requirement**: Spanish-only (Mexican auto parts industry).

**Development Feature**: English toggle for developers.

---

## Why Custom i18n

### Custom vs next-intl/react-i18next

| Feature | Custom | next-intl | react-i18next |
|---------|--------|-----------|---------------|
| Bundle size | ✅ ~2KB | ⚠️ ~25KB | ❌ ~50KB |
| TypeScript safety | ✅ Excellent | ✅ Good | ⚠️ Limited |
| Learning curve | ✅ Minimal | ⚠️ Moderate | ❌ Steep |
| Server components | ✅ Native | ✅ Supported | ⚠️ Client-only |
| Our needs | ✅ Perfect fit | ⚠️ Overkill | ❌ Too complex |

**Decision Rationale**:
- Only 2 locales (en/es) - no need for complex i18n library
- TypeScript type safety is critical
- Minimal bundle size for performance
- Simple mental model for team

**See**: [docs/PLANNING.md](../PLANNING.md#internationalization)

---

## Architecture

### File Structure

```
src/lib/i18n/
├── index.ts              # Translation function (t), exports
├── translation-keys.ts   # TypeScript types for keys
└── translations.ts       # Translation dictionary (all text)

src/contexts/
└── LocaleContext.tsx     # Global locale state + t function
```

---

### Core Components

#### 1. Translation Keys (Type Definitions)

**File**: [src/lib/i18n/translation-keys.ts](../../src/lib/i18n/translation-keys.ts)

**Purpose**: Define ALL translation keys as TypeScript types.

```typescript
export type Locale = 'en' | 'es';

export interface TranslationKeys {
  // Admin Header
  'admin.header.title': string;
  'admin.header.admin': string;
  'admin.header.languageToggle': string;
  'admin.header.viewPublic': string;

  // Admin Dashboard
  'admin.dashboard.totalParts': string;
  'admin.dashboard.applications': string;

  // Common Actions
  'common.actions.view': string;
  'common.actions.edit': string;
  'common.actions.save': string;
  'common.actions.cancel': string;
  'common.actions.delete': string;

  // Part Types
  'parts.types.maza': string;
  'parts.types.disco': string;
  'parts.types.balero': string;

  // ... 100+ more keys
}
```

**Benefits**:
- TypeScript autocomplete for all keys
- Compile-time errors for typos
- Easy to find all translation usage (search for key)

---

#### 2. Translation Dictionary (Actual Text)

**File**: [src/lib/i18n/translations.ts](../../src/lib/i18n/translations.ts)

**Purpose**: Store actual translated text for each key.

```typescript
import { Locale, TranslationKeys } from "./translation-keys";

export const translations: Record<
  keyof TranslationKeys,
  Record<Locale, string>
> = {
  "admin.header.title": {
    en: "Admin Management",
    es: "Administración",
  },
  "admin.header.viewPublic": {
    en: "View Public Site",
    es: "Ver Sitio Público",
  },
  "common.actions.save": {
    en: "Save",
    es: "Guardar",
  },
  "parts.types.maza": {
    en: "Hub",
    es: "Maza",
  },
  // ... 100+ more translations
};
```

**Structure**:
```typescript
Record<KeyName, Record<Locale, TranslatedText>>
//     ↑              ↑          ↑
//  "admin.header"   "en"     "Admin Management"
//                   "es"     "Administración"
```

---

#### 3. Translation Function

**File**: [src/lib/i18n/index.ts](../../src/lib/i18n/index.ts)

**Purpose**: Get translated text for a key and locale.

```typescript
import { Locale, TranslationKeys } from "@/lib/i18n/translation-keys";
import { translations } from "@/lib/i18n/translations";

export function t(key: keyof TranslationKeys, locale: Locale = "en"): string {
  const translation = translations[key]?.[locale];

  if (!translation) {
    console.warn(`Missing translation for key: ${key} (locale: ${locale})`);
    return key; // Fallback to key itself
  }

  return translation;
}

// Re-exports
export type { Locale, TranslationKeys } from "@/lib/i18n/translation-keys";
export { translations } from "@/lib/i18n/translations";
```

**Usage (Direct)**:
```typescript
import { t } from "@/lib/i18n";

const title = t("admin.header.title", "es"); // "Administración"
const save = t("common.actions.save", "en"); // "Save"
```

---

#### 4. LocaleContext (Global State)

**File**: [src/contexts/LocaleContext.tsx](../../src/contexts/LocaleContext.tsx)

**Purpose**: Manage current locale and provide context-aware translation function.

```typescript
interface LocaleContextType {
  locale: Locale;                          // Current locale ("en" | "es")
  setLocale: (locale: Locale) => void;    // Change locale
  isDevMode: boolean;                      // Environment detection
  t: (key: keyof TranslationKeys) => string;  // Translation function (uses current locale)
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const isDevMode = process.env.NODE_ENV === "development";

  // Initialize locale on mount
  useEffect(() => {
    if (isDevMode) {
      // Development: Check localStorage
      const saved = localStorage.getItem("acr-locale") as Locale;
      setLocale(saved === "en" || saved === "es" ? saved : "en");
    } else {
      // Production: Always Spanish
      setLocale("es");
    }
  }, [isDevMode]);

  // Save preference in development
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    if (isDevMode) {
      localStorage.setItem("acr-locale", newLocale);
    }
  };

  // Context-aware translation function
  const t = (key: keyof TranslationKeys) => translateFn(key, locale);

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, isDevMode, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

// Custom hook
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
```

**Usage in Components**:
```typescript
function Header() {
  const { locale, setLocale, t } = useLocale();

  return (
    <header>
      <h1>{t("admin.header.title")}</h1>
      <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>
        {t("admin.header.languageToggle")}
      </button>
    </header>
  );
}
```

---

## Translation Keys

### Naming Convention

**Pattern**: `{scope}.{component}.{element}`

**Examples**:
```typescript
'admin.header.title'           // Admin scope → Header component → Title element
'admin.parts.newButton'        // Admin scope → Parts component → New button
'common.actions.save'          // Common scope → Actions group → Save action
'parts.types.maza'             // Parts scope → Types group → Hub part type
'common.error.generic'         // Common scope → Error group → Generic error
```

**Scopes**:
- `admin.*` - Admin interface
- `public.*` - Public catalog
- `common.*` - Shared across admin/public
- `parts.*` - Part-specific terminology
- `comboBox.*` - Component-specific

---

### Hierarchical Structure

**Benefits of Namespacing**:
1. **Autocomplete**: Type `admin.` → see all admin keys
2. **Grouping**: All header keys together
3. **Clarity**: `admin.parts.sku` is clearer than just `sku`
4. **Searchability**: Find all uses of `admin.header.*`

**Example Hierarchy**:
```
admin
├── header
│   ├── title
│   ├── admin
│   ├── languageToggle
│   └── viewPublic
├── parts
│   ├── newButton
│   ├── sku
│   ├── actions
│   └── specifications
└── dashboard
    ├── totalParts
    └── applications

common
├── actions
│   ├── save
│   ├── cancel
│   ├── edit
│   └── delete
└── error
    ├── generic
    └── tryAgain

parts
├── types
│   ├── maza (Hub)
│   ├── disco (Rotor)
│   └── balero (Bearing)
└── positions
    ├── delantera (Front)
    └── trasera (Rear)
```

---

## Usage Patterns

### Pattern 1: Server Components

**Problem**: Server components can't use React Context (no `useLocale`).

**Solution**: Use standalone `t()` function with hardcoded locale.

```typescript
import { t } from "@/lib/i18n";

// Server Component
export default function AdminPartsPage() {
  const locale = "es"; // Production is always Spanish

  return (
    <div>
      <h1>{t("admin.parts.catalogTitle", locale)}</h1>
      <p>{t("admin.dashboard.totalParts", locale)}</p>
    </div>
  );
}
```

**Note**: In production, always `"es"`. In development, could read from headers/cookies.

---

### Pattern 2: Client Components

**Best Practice**: Use `useLocale()` hook.

```typescript
"use client";

import { useLocale } from "@/contexts/LocaleContext";

export function PartForm() {
  const { t } = useLocale(); // Context-aware

  return (
    <form>
      <label>{t("admin.parts.sku")}</label>
      <input />

      <button type="submit">{t("common.actions.save")}</button>
      <button type="button">{t("common.actions.cancel")}</button>
    </form>
  );
}
```

**Benefits**:
- No need to pass `locale` parameter
- Automatically reactive to locale changes
- Cleaner code

---

### Pattern 3: Dynamic Text with Plurals

**Challenge**: Pluralization (e.g., "1 vehicle" vs "2 vehicles").

**Solution**: Separate keys for singular/plural.

```typescript
// Translation keys
'admin.parts.vehicle': string;   // "vehicle" / "vehículo"
'admin.parts.vehicles': string;  // "vehicles" / "vehículos"

// Usage
function VehicleCount({ count }: { count: number }) {
  const { t } = useLocale();

  const key = count === 1 ? "admin.parts.vehicle" : "admin.parts.vehicles";

  return <span>{count} {t(key)}</span>;
  // Output: "1 vehículo" or "2 vehículos"
}
```

---

### Pattern 4: Part Type Translations

**Challenge**: Mexican auto parts industry uses Spanish terms (maza, disco, birlos).

**Solution**: Translation keys for part types.

```typescript
// translations.ts
"parts.types.maza": {
  en: "Hub",
  es: "Maza",
},
"parts.types.disco": {
  en: "Rotor",
  es: "Disco de Freno",
},
"parts.types.birlos": {
  en: "Wheel Studs",
  es: "Birlos",
},

// Usage in component
function PartTypeLabel({ partType }: { partType: string }) {
  const { t, locale } = useLocale();

  // Try to find translation key
  const key = `parts.types.${partType.toLowerCase()}` as keyof TranslationKeys;

  // If translation exists, use it; otherwise use raw value
  try {
    return <span>{t(key)}</span>;
  } catch {
    return <span>{partType}</span>; // Fallback to raw value
  }
}
```

---

### Pattern 5: ComboBox No Results

**Component-Specific Translations**:

```typescript
// ComboBox component
function ComboBox({ items }: { items: string[] }) {
  const { t } = useLocale();

  if (items.length === 0) {
    return (
      <div>
        {t("comboBox.noResults")}
        {/* "No results found" / "No se encontraron resultados" */}
      </div>
    );
  }

  // ...
}
```

---

## Adding New Translations

### Step-by-Step Process

**1. Add TypeScript Type**

Edit [src/lib/i18n/translation-keys.ts](../../src/lib/i18n/translation-keys.ts):

```typescript
export interface TranslationKeys {
  // ... existing keys

  // NEW: Bulk operations
  'admin.bulk.uploadExcel': string;
  'admin.bulk.processing': string;
  'admin.bulk.successMessage': string;
}
```

**2. Add Translations**

Edit [src/lib/i18n/translations.ts](../../src/lib/i18n/translations.ts):

```typescript
export const translations = {
  // ... existing translations

  "admin.bulk.uploadExcel": {
    en: "Upload Excel File",
    es: "Subir Archivo Excel",
  },
  "admin.bulk.processing": {
    en: "Processing...",
    es: "Procesando...",
  },
  "admin.bulk.successMessage": {
    en: "Successfully imported {count} parts",
    es: "Importados {count} piezas exitosamente",
  },
};
```

**3. Use in Component**

```typescript
"use client";

import { useLocale } from "@/contexts/LocaleContext";

export function BulkUploadForm() {
  const { t } = useLocale();

  return (
    <div>
      <h2>{t("admin.bulk.uploadExcel")}</h2>
      <button>{t("common.actions.save")}</button>
    </div>
  );
}
```

**4. TypeScript Validates**

```typescript
// ✅ Valid - key exists
t("admin.bulk.uploadExcel")

// ❌ Compile error - typo
t("admin.bulk.uploadExcell")
//     ~~~~~~~~~~~~~~~~~~~~ Type error: Key does not exist
```

---

### Best Practices

**DO**:
- Use hierarchical keys (`admin.parts.sku`, not just `sku`)
- Add both English and Spanish translations
- Test both locales during development
- Keep translations close to where they're used (easy to verify)

**DON'T**:
- Hardcode UI text strings
- Use English text directly (always use translation key)
- Mix translation systems (always use custom i18n)
- Forget to add TypeScript type first (type-safety!)

---

## Development vs Production

### Environment Detection

**Pattern**: LocaleContext checks `process.env.NODE_ENV`.

```typescript
const isDevMode = process.env.NODE_ENV === "development";

useEffect(() => {
  if (isDevMode) {
    // Development: Allow locale toggle
    const saved = localStorage.getItem("acr-locale") as Locale;
    setLocale(saved || "en");
  } else {
    // Production: Force Spanish
    setLocale("es");
  }
}, [isDevMode]);
```

---

### Development Features

**1. Language Toggle**

```typescript
function LanguageToggle() {
  const { locale, setLocale, isDevMode } = useLocale();

  if (!isDevMode) return null; // Hide in production

  return (
    <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>
      {locale === "en" ? "Español" : "English"}
    </button>
  );
}
```

**2. localStorage Persistence**

Development saves preference:
```typescript
localStorage.setItem("acr-locale", "en"); // Persists across refreshes
```

Production ignores:
```typescript
// Production always uses "es", never reads localStorage
```

---

### Production Behavior

**Locked to Spanish**:
```typescript
// Production
const locale = "es"; // Always
const translations = t("admin.header.title", "es"); // "Administración"
```

**No Toggle UI**: Language toggle component hidden.

**No localStorage**: Locale not saved (always Spanish).

---

## Migration Path (Future)

If app needs more locales (e.g., Portuguese):

**1. Update Type**:
```typescript
export type Locale = 'en' | 'es' | 'pt';
```

**2. Add Translations**:
```typescript
"admin.header.title": {
  en: "Admin Management",
  es: "Administración",
  pt: "Gestão de Administração", // NEW
},
```

**3. Update Logic**:
```typescript
// LocaleContext: Support 3 locales
if (savedLocale === "en" || savedLocale === "es" || savedLocale === "pt") {
  setLocale(savedLocale);
}
```

**That's it!** Type system ensures all keys have all locales.

---

## Related Documentation

- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) - LocaleContext pattern
- [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - Using translations in components
- [docs/PLANNING.md](../PLANNING.md#internationalization) - i18n decision rationale

---

**Next**: Read [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) to understand the ACR design system and component patterns.
