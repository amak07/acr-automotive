# State Management

> **Purpose**: TanStack Query and React Context patterns for client-side state
>
> **Last Updated**: 2025-10-25
> **Status**: Production

## Table of Contents

- [State Management Strategy](#state-management-strategy)
- [TanStack Query (Server State)](#tanstack-query-server-state)
- [React Context (UI State)](#react-context-ui-state)
- [Custom Hooks](#custom-hooks)
- [Cache Management](#cache-management)
- [Examples](#examples)

---

## State Management Strategy

### State Categories

**Server State** (data from API):
- Parts list
- Vehicle applications
- Cross references
- Site settings
- **Managed by**: TanStack Query

**UI State** (local to application):
- Current locale (en/es)
- Form state (inputs, validation)
- Modal open/closed
- **Managed by**: React Context + useState

**URL State** (shareable/bookmarkable):
- Search filters
- Pagination (offset, limit)
- Sort order
- **Managed by**: URL search params + custom hooks

---

### No Zustand/Redux

**Decision**: Use TanStack Query + Context instead of Zustand.

**Rationale**:
- **TanStack Query** handles 80% of state (server data)
- **React Context** handles remaining 20% (locale, UI)
- Avoid unnecessary dependencies
- Simpler mental model (fewer patterns to learn)

**See**: [docs/PLANNING.md](../PLANNING.md#state-management) for detailed comparison.

---

## TanStack Query (Server State)

### Why TanStack Query

**Problems It Solves**:
1. Caching (avoid refetching same data)
2. Background updates (keep data fresh)
3. Loading states (automatic loading/error/success)
4. Cache invalidation (refresh after mutations)
5. Optimistic updates (instant UI feedback)

**Alternative**: Manual `useState` + `useEffect` + `fetch` (error-prone, verbose).

---

### Query Pattern

**File**: [src/hooks/admin/useGetParts.ts](../../src/hooks/admin/useGetParts.ts)

```typescript
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/common/queryKeys";

export function useGetParts(queryParams: AdminPartsQueryParams) {
  return useQuery<{ data: PartSummary[]; count: number }>({
    // 1. Query key (for caching)
    queryKey: queryKeys.parts.list(queryParams),

    // 2. Query function (how to fetch)
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append("offset", queryParams.offset.toString());
      searchParams.append("limit", queryParams.limit.toString());
      // ... add other params

      const response = await fetch(`/api/admin/parts?${searchParams.toString()}`);
      if (!response.ok) throw new Error("failed to fetch parts list");

      const result = await response.json();
      return { data: result.data, count: result.count };
    },

    // 3. Cache options
    staleTime: 5 * 60 * 1000,  // 5 minutes (data considered fresh)
    gcTime: 10 * 60 * 1000,    // 10 minutes (cache kept in memory)
  });
}
```

**Usage in Component**:
```typescript
function PartsListPage() {
  const { data, isLoading, error } = useGetParts({
    offset: 0,
    limit: 50,
    sort_by: "acr_sku",
    sort_order: "asc",
  });

  if (isLoading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;

  return (
    <Table>
      {data.data.map((part) => (
        <TableRow key={part.id}>{part.acr_sku}</TableRow>
      ))}
    </Table>
  );
}
```

**Benefits**:
- **Automatic loading state**: No `useState` needed
- **Automatic caching**: Same query = no refetch
- **Automatic error handling**: No try-catch needed
- **Type-safe**: `data` has inferred type

---

### Mutation Pattern

**File**: [src/hooks/admin/useCreatePart.ts](../../src/hooks/admin/useCreatePart.ts)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/common/queryKeys";

export function useCreatePart() {
  const queryClient = useQueryClient();

  return useMutation<DatabasePartRow[], Error, CreatePartsParams>({
    // 1. Mutation function (how to mutate)
    mutationFn: async (params: CreatePartsParams) => {
      const response = await fetch(`/api/admin/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to create part: ${response.json()}`);
      }

      const result = await response.json();
      return result.data as DatabasePartRow[];
    },

    // 2. On success, invalidate cache
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.parts(),
      });
    },
  });
}
```

**Usage in Component**:
```typescript
function CreatePartForm() {
  const createPart = useCreatePart();

  async function onSubmit(data: CreatePartsParams) {
    try {
      await createPart.mutateAsync(data);
      toast({ title: "Part created successfully" });
    } catch (error) {
      toast({ title: "Failed to create part", variant: "destructive" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... */}
      <Button disabled={createPart.isPending}>
        {createPart.isPending ? "Creating..." : "Create Part"}
      </Button>
    </form>
  );
}
```

**Benefits**:
- **Automatic invalidation**: Parts list refreshes after creation
- **Loading state**: `isPending` for button disable
- **Error handling**: Try-catch for error toast

---

### Centralized Query Keys

**File**: [src/hooks/common/queryKeys.ts](../../src/hooks/common/queryKeys.ts)

**Problem**: Inconsistent query keys lead to cache bugs.

```typescript
// ❌ Bad: Inconsistent keys
useQuery({ queryKey: ["parts"] });
useQuery({ queryKey: ["part-list"] });
queryClient.invalidateQueries({ queryKey: ["parts-list"] }); // Won't work!
```

**Solution**: Centralized query key factory.

```typescript
export const queryKeys = {
  parts: {
    all: ["parts"] as const,
    lists: () => [...queryKeys.parts.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.parts.lists(), { filters }] as const,
    details: () => [...queryKeys.parts.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.parts.details(), { id }] as const,
  },

  vehicleApplications: {
    all: ["vehicle-applications"] as const,
    lists: () => [...queryKeys.vehicleApplications.all, "list"] as const,
    byPart: (partId: string) =>
      [...queryKeys.vehicleApplications.all, "by-part", { partId }] as const,
  },

  crossReferences: {
    all: ["cross-references"] as const,
    lists: () => [...queryKeys.crossReferences.all, "list"] as const,
    byPart: (partId: string) =>
      [...queryKeys.crossReferences.all, "by-part", { partId }] as const,
  },

  admin: {
    all: ["admin"] as const,
    parts: () => [...queryKeys.admin.all, "parts"] as const,
    stats: () => [...queryKeys.admin.all, "stats"] as const,
  },

  public: {
    all: ["public"] as const,
    parts: {
      all: () => [...queryKeys.public.all, "parts"] as const,
      list: (filters: Record<string, any>) =>
        [...queryKeys.public.parts.all(), "list", { filters }] as const,
    },
  },
};
```

**Query Key Hierarchy**:
```
["parts"]                          // All parts queries
["parts", "list"]                  // All parts list queries
["parts", "list", { filters }]     // Specific filtered list
["parts", "detail"]                // All parts detail queries
["parts", "detail", { id }]        // Specific part detail
```

**Invalidation Strategy**:
```typescript
// Invalidate ALL parts queries
queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });

// Invalidate ALL parts lists (keeps detail queries)
queryClient.invalidateQueries({ queryKey: queryKeys.parts.lists() });

// Invalidate specific filtered list
queryClient.invalidateQueries({
  queryKey: queryKeys.parts.list({ part_type: "Brake Rotor" }),
});
```

**Helper Function**:
```typescript
export const invalidatePartRelatedQueries = (queryClient: any, partId: string) => {
  // Invalidate the specific part
  queryClient.invalidateQueries({ queryKey: queryKeys.parts.detail(partId) });

  // Invalidate vehicle applications for this part
  queryClient.invalidateQueries({ queryKey: queryKeys.vehicleApplications.byPart(partId) });

  // Invalidate cross references for this part
  queryClient.invalidateQueries({ queryKey: queryKeys.crossReferences.byPart(partId) });

  // Invalidate parts list (counts may have changed)
  queryClient.invalidateQueries({ queryKey: queryKeys.parts.lists() });
};
```

---

## React Context (UI State)

### LocaleContext Pattern

**File**: [src/contexts/LocaleContext.tsx](../../src/contexts/LocaleContext.tsx)

**Purpose**: Manage current locale (en/es) and translation function.

```typescript
// 1. Define Context Type
interface LocaleContextType {
  locale: Locale;                          // "en" | "es"
  setLocale: (locale: Locale) => void;    // Change locale
  isDevMode: boolean;                      // Environment detection
  t: (key: keyof TranslationKeys) => string;  // Translation function
}

// 2. Create Context
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// 3. Create Provider
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const isDevMode = process.env.NODE_ENV === "development";

  // Initialize locale on mount
  useEffect(() => {
    if (isDevMode) {
      const saved = localStorage.getItem("acr-locale") as Locale;
      setLocale(saved === "en" || saved === "es" ? saved : "en");
    } else {
      setLocale("es"); // Production = Spanish only
    }
  }, [isDevMode]);

  // Save preference in dev
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    if (isDevMode) {
      localStorage.setItem("acr-locale", newLocale);
    }
  };

  // Translation function that uses current locale
  const t = (key: keyof TranslationKeys) => translateFn(key, locale);

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, isDevMode, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

// 4. Custom Hook
export function useLocale() {
  const context = useContext(LocaleContext);

  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return context;
}
```

**Usage**:
```typescript
// In root layout
export default function RootLayout({ children }) {
  return (
    <LocaleProvider>
      {children}
    </LocaleProvider>
  );
}

// In any component
function Header() {
  const { locale, setLocale, t } = useLocale();

  return (
    <header>
      <h1>{t("app_title")}</h1>
      <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>
        {locale === "en" ? "Español" : "English"}
      </button>
    </header>
  );
}
```

---

### When to Use Context

**Use Context For**:
- Global UI state (theme, locale, sidebar state)
- Infrequently changing data
- Avoiding prop drilling

**Don't Use Context For**:
- Server data (use TanStack Query)
- Frequently changing data (causes re-renders)
- Data with complex invalidation logic

---

## Custom Hooks

### URL State Hooks

**File**: [src/hooks/common/useURLState.ts](../../src/hooks/common/useURLState.ts)

**Purpose**: Sync component state with URL search params (shareable URLs).

**Pattern**:
```typescript
export function useURLState<T>(key: string, defaultValue: T) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get value from URL or use default
  const value = searchParams.get(key)
    ? (searchParams.get(key) as T)
    : defaultValue;

  // Update URL without full page reload
  const setValue = (newValue: T) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, String(newValue));
    router.push(`?${params.toString()}`);
  };

  return [value, setValue] as const;
}
```

**Usage**:
```typescript
function PartsListPage() {
  const [search, setSearch] = useURLState("search", "");
  const [partType, setPartType] = useURLState("part_type", "");

  // URL: /admin/parts?search=brake&part_type=Rotor

  return (
    <>
      <SearchInput value={search} onChange={setSearch} />
      <Select value={partType} onChange={setPartType}>
        {/* ... */}
      </Select>
    </>
  );
}
```

**Benefits**:
- Shareable URLs (`/admin/parts?search=brake`)
- Browser back/forward works
- Bookmark-able filtered views

---

### Preserve Search Params

**File**: [src/hooks/common/usePreserveSearchParams.ts](../../src/hooks/common/usePreserveSearchParams.ts)

**Purpose**: Preserve search params when navigating (e.g., back button keeps filters).

**Pattern**:
```typescript
export function usePreserveSearchParams() {
  const searchParams = useSearchParams();

  const getHref = (path: string) => {
    const params = searchParams.toString();
    return params ? `${path}?${params}` : path;
  };

  return { getHref };
}
```

**Usage**:
```typescript
function PartRow({ part }: { part: PartSummary }) {
  const { getHref } = usePreserveSearchParams();

  return (
    <TableRow>
      <TableCell>
        <Link href={getHref(`/admin/parts/${part.id}`)}>
          {part.acr_sku}
        </Link>
      </TableCell>
    </TableRow>
  );
}

// Clicking link goes to: /admin/parts/123?search=brake&part_type=Rotor
// Back button returns to: /admin/parts?search=brake&part_type=Rotor
```

---

## Cache Management

### Stale Time vs GC Time

**Stale Time**: How long data is considered fresh (no refetch).
**GC Time** (Garbage Collection): How long unused data stays in memory.

```typescript
useQuery({
  queryKey: ["parts"],
  queryFn: fetchParts,
  staleTime: 5 * 60 * 1000,   // 5 minutes (fresh)
  gcTime: 10 * 60 * 1000,     // 10 minutes (in memory)
});
```

**Timeline**:
```
0:00 - Query executes, data fetched
0:00 - 5:00  → Data is FRESH (no refetch on component remount)
5:00 - 10:00 → Data is STALE (refetch on component remount)
10:00+       → Data is GARBAGE COLLECTED (removed from memory)
```

**Recommended Values**:
- **Fast-changing data** (user activity): `staleTime: 30s, gcTime: 1min`
- **Medium data** (parts list): `staleTime: 5min, gcTime: 10min`
- **Slow-changing data** (site settings): `staleTime: 15min, gcTime: 30min`

---

### Manual Invalidation

**When**: After mutations (create, update, delete).

**Pattern**:
```typescript
const createPart = useMutation({
  mutationFn: async (data) => { /* ... */ },
  onSuccess: () => {
    // Invalidate all parts lists
    queryClient.invalidateQueries({
      queryKey: queryKeys.parts.lists(),
    });
  },
});
```

**Specific vs Broad Invalidation**:
```typescript
// ✅ Specific (efficient)
queryClient.invalidateQueries({
  queryKey: queryKeys.parts.detail(partId),
});

// ⚠️ Broad (simple but less efficient)
queryClient.invalidateQueries({
  queryKey: queryKeys.parts.all,
});
```

---

### Optimistic Updates

**Pattern**: Update UI immediately, revert if mutation fails.

```typescript
const updatePart = useMutation({
  mutationFn: async (data) => { /* ... */ },

  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({
      queryKey: queryKeys.parts.detail(newData.id),
    });

    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKeys.parts.detail(newData.id));

    // Optimistically update cache
    queryClient.setQueryData(queryKeys.parts.detail(newData.id), newData);

    // Return rollback function
    return { previous };
  },

  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(
      queryKeys.parts.detail(newData.id),
      context?.previous
    );
  },

  onSettled: () => {
    // Refetch to ensure sync
    queryClient.invalidateQueries({
      queryKey: queryKeys.parts.detail(newData.id),
    });
  },
});
```

**When to Use**:
- Frequent updates (toggle active status)
- User expects instant feedback
- Network is slow

---

## Examples

### Example 1: Query with Filters

**Component**: Parts list with search and filters.

```typescript
function PartsListPage() {
  const [search, setSearch] = useURLState("search", "");
  const [partType, setPartType] = useURLState("part_type", "");
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = useGetParts({
    search,
    part_type: partType,
    offset,
    limit: 50,
    sort_by: "acr_sku",
    sort_order: "asc",
  });

  if (isLoading) return <Spinner />;
  if (error) return <Alert>Error: {error.message}</Alert>;

  return (
    <>
      <SearchInput value={search} onChange={setSearch} />
      <Select value={partType} onChange={setPartType}>
        <option value="">All Types</option>
        <option value="Brake Rotor">Brake Rotor</option>
      </Select>

      <Table>
        {data.data.map((part) => (
          <TableRow key={part.id}>{part.acr_sku}</TableRow>
        ))}
      </Table>

      <Pagination
        offset={offset}
        limit={50}
        total={data.count}
        onPageChange={setOffset}
      />
    </>
  );
}
```

---

### Example 2: Create Mutation with Invalidation

**Component**: Create part form.

```typescript
function CreatePartForm() {
  const createPart = useCreatePart();
  const { t } = useLocale();

  const form = useForm<CreatePartParams>({
    resolver: zodResolver(createPartSchema),
  });

  async function onSubmit(data: CreatePartParams) {
    try {
      await createPart.mutateAsync(data);
      toast({ title: t("part_created_success") });
      form.reset();
    } catch (error) {
      toast({
        title: t("part_created_error"),
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField label={t("sku_number")} error={form.formState.errors.sku_number}>
        <Input {...form.register("sku_number")} />
      </FormField>

      <Button type="submit" disabled={createPart.isPending}>
        {createPart.isPending ? t("creating") : t("create_part")}
      </Button>
    </form>
  );
}
```

---

## Related Documentation

- [API_DESIGN.md](API_DESIGN.md) - API endpoints used by queries
- [VALIDATION.md](VALIDATION.md) - Zod schemas for mutations
- [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - UI components
- [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md) - Translation system

---

**Next**: Read [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md) to understand the i18n system architecture.
