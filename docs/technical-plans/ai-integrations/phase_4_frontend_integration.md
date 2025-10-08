# Phase 4: Frontend Integration (UI)
## UI Components, User Experience, and React Implementation

---

## 🎯 **Overview**

Phase 5 implements the user-facing AI search interface, replacing ACR's current multi-input search system with a single intelligent universal search bar. This phase focuses on creating an intuitive, industry-standard product search experience where AI enhancement is invisible to users.

**Core Philosophy**: Users don't see "AI" vs "traditional" search - they just get smarter results through one unified interface.

---

## 🎨 **UX Design Decisions & Rationale**

### **Decision 1: Single Universal Search Bar (No Toggle)**

**What We're Building**:
```
ONE search input that handles everything:
✓ SKU lookup: "ACR-MAZA-001"
✓ Vehicle search: "rodamientos Honda Civic 2018"
✓ Cross-reference: "TM-12345"
✓ Natural language: "algo para el cubo delantero"
✓ Incomplete queries: "rodamientos Honda"
```

**Why This Decision**:
- ✅ **Industry Standard**: Amazon, Google Shopping, McMaster-Carr all use single universal search
- ✅ **Simpler UX**: No user decision fatigue ("which search should I use?")
- ✅ **Faster Workflow**: Counter staff type once, system routes intelligently
- ✅ **Mobile Friendly**: One large touch target vs multiple inputs
- ✅ **AI Invisible**: Users get better results without thinking about how

**What We Rejected**:
- ❌ Toggle between "AI Search" and "Traditional Search" (confusing, implies one is worse)
- ❌ Separate SKU and Vehicle inputs (cluttered, requires user to choose)
- ❌ ChatGPT-style conversation interface (wrong pattern for product search)

**Reference**: This matches Grainger (industrial B2B parts) and AutoZone (automotive B2B) patterns.

---

### **Decision 2: Progressive Disclosure, Not Conversation**

**What We're Building**:
```typescript
// Incomplete query handling
User: "rodamientos Honda"
↓
System: Shows ALL Honda parts (87 results)
Display: Filter chips to narrow down
  "Modelo: [Civic (23)] [Accord (15)] [CR-V (31)]"
↓
User: Clicks [Civic (23)]
↓
Results: Instantly filter to 23 Civic parts (client-side)
Display: New chips appear
  "Año: [2016 (5)] [2017 (4)] [2018 (6)]"
```

**Why This Decision**:
- ✅ **Industry Standard**: Google Shopping, Amazon, Perplexity Shopping all use progressive disclosure
- ✅ **Faster**: No waiting for AI clarification questions
- ✅ **Visual**: See all options at once, don't guess
- ✅ **Reversible**: Can unclick filters, change mind
- ✅ **Offline-Friendly**: Filter chips work instantly without API calls

**What We Rejected**:
- ❌ Multi-turn conversation ("¿Para qué modelo?" → wait for response → "¿Para qué año?")
- ❌ ChatGPT-style back-and-forth (wrong UX for product search)
- ❌ Forced sequential refinement (slower, more frustrating)

**Technical Reasoning**: Product search is about browsing and filtering, not conversation. Users want to see options and narrow down visually, not answer questions sequentially.

---

### **Decision 3: Dynamic Page Sizing Based on Query Type**

**What We're Building**:
```typescript
interface PageSizeStrategy {
  // Exact SKU lookup
  'sku_lookup': 1,              // Just fetch the one part
  
  // Complete vehicle search
  'complete_vehicle': 10,        // Standard pagination
  
  // Incomplete vehicle search
  'incomplete_vehicle': 999,     // Fetch ALL for instant filtering
  
  // Vague semantic search
  'semantic_vague': 50,          // Larger pages for browsing
  
  // Default
  'default': 20
}
```

**Why This Decision**:
- ✅ **Industry Standard**: Amazon adjusts page size (24-48) based on query specificity
- ✅ **Better UX**: No pagination when showing 20 results, instant filtering for incomplete queries
- ✅ **Performance**: ACR's 865 parts make fetching all Honda parts (87) fast (~174KB, <50ms)
- ✅ **Smart**: System adapts to user intent automatically

**Technical Reasoning**:
```typescript
// For incomplete queries like "honda":
Fetch all 87 Honda parts once (174KB)
Generate filter chips from results
User clicks chips → instant client-side filtering
No loading states, no pagination confusion

// For complete queries like "Honda Civic 2018":
Fetch just 6 matching parts (12KB)
Show all on one page
No pagination needed
```

**What We Rejected**:
- ❌ Fixed page size (10 always) - forces unnecessary pagination for small result sets
- ❌ Always fetch all 865 parts - wasteful for specific queries
- ❌ Always paginate at 10 - bad UX when only 6 results exist

---

### **Decision 4: Advanced Filters Panel (Preserve Current UX)**

**What We're Building**:
```
Primary Interface: Universal AI Search
  ↓
Secondary Interface: Advanced Filters (toggle)
  - Vehicle filters: Make, Model, Year (dropdowns)
  - Part filters: Position, ABS Type (checkboxes)
  - Direct SKU input (for users who prefer it)
```

**Current UX (Before)**:
```
Primary: Vehicle Search (dropdowns)
Toggle → Secondary: SKU Search (input)
```

**New UX (After)**:
```
Primary: Universal AI Search (one input)
Toggle → Secondary: Advanced Filters (dropdowns + checkboxes)
```

**Why This Decision**:
- ✅ Preserves familiar pattern for existing users
- ✅ Power users still have precise control
- ✅ Counter staff can use either workflow
- ✅ Mobile-friendly (filters in slide-out panel)

**Implementation**: Same UI pattern, just swapped what's primary vs secondary.

---

### **Decision 5: Voice Search Integration**

**What We're Building**:
```typescript
// Microphone button next to search input
[🔍 Buscar rodamientos...] [🎤]

// User clicks mic, speaks:
"rodamientos para Honda Civic dos mil dieciocho"
↓
Browser converts speech → text (Web Speech API)
↓
Text appears in search input: "rodamientos Honda Civic 2018"
↓
Normal AI search executes
```

**Why This Decision**:
- ✅ **Counter Staff Workflow**: Hands-free when busy with customers
- ✅ **No Backend Changes**: Browser-native speech recognition
- ✅ **Free**: No API costs, works offline after initial permission
- ✅ **Tablet-Friendly**: Common on modern tablets

**Technical Details**:
- Uses browser Web Speech API (webkitSpeechRecognition)
- Language: Spanish (Mexico) - "es-MX"
- Works in Chrome, Edge, Safari (not Firefox)
- Microphone permission requested on first use

**What We Rejected**:
- ❌ External speech API (Google Cloud Speech) - adds cost and complexity
- ❌ Server-side speech processing - adds latency
- ❌ Always-on listening - privacy concern, battery drain

---

### **Decision 6: Recent Searches with Local Storage**

**What We're Building**:
```
Below search input:
🕐 Búsquedas recientes:
[Honda Civic 2018] [ACR-MAZA-001] [Toyota Camry]

// Clicking chip = instant re-search
// Persists across browser sessions
// Automatic cleanup (30 days, max 10 searches)
```

**Why This Decision**:
- ✅ **Counter Workflow**: Staff often look up same parts multiple times per day
- ✅ **Fast Access**: One click vs retyping entire query
- ✅ **Persistent**: Survives browser close (local storage)
- ✅ **Privacy**: Stored locally, not on server

**Storage Choice: Local Storage (not Session Storage)**:
```typescript
// Local Storage: Persists days/weeks
✓ Counter staff closing browser at end of shift
✓ Recent searches available next morning
✓ Per-workstation (each computer has own history)

// Session Storage: Cleared when tab closes
✗ Lost at end of shift
✗ New tab = lost history
```

**Technical Reasoning**: Counter staff often close browsers between shifts. Recent searches should persist across sessions but remain per-workstation for privacy.

---

### **Decision 7: Loading States - Skeleton Loaders**

**What We're Building**:
```typescript
// While AI search executes (500-800ms)
[Search input with query visible]
[Skeleton table - animated placeholders]
  ▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭  (header row)
  ▭▭▭▭  ▭▭▭▭  ▭▭▭▭  (data row)
  ▭▭▭▭  ▭▭▭▭  ▭▭▭▭
  ▭▭▭▭  ▭▭▭▭  ▭▭▭▭
```

**Why This Decision**:
- ✅ **Industry Standard**: Amazon, Google, all modern sites use skeleton loaders
- ✅ **Perceived Performance**: Feels faster than spinners
- ✅ **Context Preservation**: User sees table structure while loading
- ✅ **No Surprise**: Table appears in expected location

**What We Rejected**:
- ❌ Spinner/loading circle - feels like "waiting"
- ❌ "AI is thinking..." message - unnecessary, focuses on tech not results
- ❌ Progress bar - adds anxiety ("how long will this take?")
- ❌ Blank screen - disorienting

---

### **Decision 8: Error Handling - Silent Fallback + Toast**

**What We're Building**:
```typescript
// If AI search fails:
1. Silently try traditional search
2. Show results (user barely notices)
3. Small dismissible toast: "Mostrando resultados estándar"

// User sees: Results (always)
// User knows: Different search method used (optional info)
```

**Why This Decision**:
- ✅ **Industry Standard**: Algolia, Amazon all use silent fallback
- ✅ **Always Functional**: Search never "fails" from user perspective
- ✅ **No Alarm**: User gets results without error anxiety
- ✅ **Transparent**: Toast informs but doesn't block

**What We Rejected**:
- ❌ Error modal blocking screen
- ❌ "Try again" button (fallback already tried)
- ❌ Red error message (too alarming)
- ❌ Completely silent (user might wonder why results differ)

---

## 🏗️ **Component Architecture**

### **Component Hierarchy**

```
app/page.tsx (Root)
├─ UniversalSearchInterface
│  ├─ SearchInput
│  │  ├─ VoiceSearchButton
│  │  └─ ClearButton
│  ├─ RecentSearches
│  ├─ SearchHelperText
│  └─ AdvancedFiltersToggle
├─ SearchResults
│  ├─ ResultsSummary
│  ├─ FilterChips (for incomplete queries)
│  ├─ PartsTable (existing component)
│  └─ Pagination (conditional)
└─ AdvancedFiltersPanel (slide-out)
   ├─ VehicleFilters
   ├─ PartSpecFilters
   └─ ApplyFiltersButton
```

---

## 🔧 **Core Components Implementation**

### **1. Universal Search Interface (Main Component)**

```typescript
// src/components/search/UniversalSearchInterface.tsx

'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { VoiceSearchButton } from './VoiceSearchButton'
import { RecentSearches } from './RecentSearches'
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel'
import { useUniversalSearch } from '@/hooks/useUniversalSearch'

export function UniversalSearchInterface() {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const { 
    results, 
    isLoading, 
    strategy,
    showFilterChips 
  } = useUniversalSearch(query)
  
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    // Search executes automatically via useUniversalSearch
  }
  
  const handleVoiceInput = (transcript: string) => {
    setQuery(transcript)
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Main Search Input */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="Buscar rodamientos..."
            className="pl-12 pr-24 h-14 text-lg"
            autoFocus
          />
          
          {/* Voice Search Button */}
          <div className="absolute right-2 top-2 flex gap-1">
            <VoiceSearchButton onTranscript={handleVoiceInput} />
            
            {/* Advanced Filters Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(true)}
              className="h-10 w-10"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Helper Text */}
        <p className="text-sm text-muted-foreground text-center">
          💡 Ejemplo: "rodamientos Honda Civic 2018" o "ACR-MAZA-001"
        </p>
        
        {/* Recent Searches */}
        <RecentSearches onSelectSearch={handleSearch} />
      </div>
      
      {/* Search Results */}
      {query && (
        <SearchResults
          query={query}
          results={results}
          isLoading={isLoading}
          strategy={strategy}
          showFilterChips={showFilterChips}
        />
      )}
      
      {/* Advanced Filters Panel (Slide-out) */}
      <AdvancedFiltersPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleSearch}
      />
    </div>
  )
}
```

---

### **2. Voice Search Button**

```typescript
// src/components/search/VoiceSearchButton.tsx

'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void
}

export function VoiceSearchButton({ onTranscript }: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  
  useEffect(() => {
    // Check browser support
    setIsSupported('webkitSpeechRecognition' in window)
  }, [])
  
  const startListening = () => {
    if (!isSupported) {
      toast.error('Búsqueda por voz no disponible en este navegador')
      return
    }
    
    // @ts-ignore - webkitSpeechRecognition not in TypeScript types
    const recognition = new webkitSpeechRecognition()
    recognition.lang = 'es-MX' // Mexican Spanish
    recognition.continuous = false
    recognition.interimResults = false
    
    recognition.onstart = () => {
      setIsListening(true)
    }
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setIsListening(false)
    }
    
    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error)
      setIsListening(false)
      
      if (event.error === 'no-speech') {
        toast.error('No se detectó voz. Intenta de nuevo.')
      } else if (event.error === 'not-allowed') {
        toast.error('Permiso de micrófono denegado')
      } else {
        toast.error('Error en búsqueda por voz')
      }
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    recognition.start()
  }
  
  if (!isSupported) {
    return null // Hide button if not supported
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={startListening}
      disabled={isListening}
      className={`h-10 w-10 ${isListening ? 'animate-pulse text-primary' : ''}`}
      title="Búsqueda por voz"
    >
      {isListening ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  )
}
```

---

### **3. Recent Searches Component**

```typescript
// src/components/search/RecentSearches.tsx

'use client'

import { useRecentSearches } from '@/hooks/useRecentSearches'
import { Clock } from 'lucide-react'

interface RecentSearchesProps {
  onSelectSearch: (query: string) => void
}

export function RecentSearches({ onSelectSearch }: RecentSearchesProps) {
  const { searches, addRecentSearch } = useRecentSearches()
  
  if (searches.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Búsquedas recientes:
      </p>
      <div className="flex flex-wrap gap-2">
        {searches.map((search) => (
          <button
            key={search.timestamp}
            onClick={() => {
              onSelectSearch(search.query)
              addRecentSearch(search.query) // Bump to top
            }}
            className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            {search.query}
          </button>
        ))}
      </div>
    </div>
  )
}

// Hook implementation
// src/hooks/useRecentSearches.ts

import { useState, useEffect } from 'react'

interface RecentSearch {
  query: string
  timestamp: number
}

const STORAGE_KEY = 'acr_recent_searches'
const MAX_SEARCHES = 10
const MAX_AGE_DAYS = 30

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([])
  
  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed: RecentSearch[] = JSON.parse(stored)
        const now = Date.now()
        const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000
        
        // Filter: remove old searches, keep max 10
        const filtered = parsed
          .filter(s => now - s.timestamp < maxAge)
          .slice(0, MAX_SEARCHES)
        
        setSearches(filtered)
        
        // Clean up localStorage if filtered
        if (filtered.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        }
      } catch (e) {
        console.error('Failed to parse recent searches:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])
  
  const addRecentSearch = (query: string) => {
    // Don't add if empty or very short
    if (query.trim().length < 2) return
    
    // Remove duplicates (case-insensitive)
    const filtered = searches.filter(
      s => s.query.toLowerCase() !== query.toLowerCase()
    )
    
    // Add to front
    const updated = [
      { query: query.trim(), timestamp: Date.now() },
      ...filtered
    ].slice(0, MAX_SEARCHES)
    
    setSearches(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }
  
  const clearRecentSearches = () => {
    setSearches([])
    localStorage.removeItem(STORAGE_KEY)
  }
  
  return {
    searches,
    addRecentSearch,
    clearRecentSearches
  }
}
```

---

### **4. Search Results Component**

```typescript
// src/components/search/SearchResults.tsx

'use client'

import { Part, SearchStrategy } from '@/types'
import { PartsTable } from '@/components/parts/PartsTable'
import { FilterChips } from './FilterChips'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface SearchResultsProps {
  query: string
  results: Part[] | undefined
  isLoading: boolean
  strategy: SearchStrategy | null
  showFilterChips: boolean
}

export function SearchResults({
  query,
  results,
  isLoading,
  strategy,
  showFilterChips
}: SearchResultsProps) {
  const [filteredResults, setFilteredResults] = useState<Part[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  
  // Use filtered results if filters applied, otherwise use all results
  const displayResults = Object.keys(activeFilters).length > 0 
    ? filteredResults 
    : results
  
  // Loading state - skeleton loader
  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-6 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }
  
  // No results
  if (!results || results.length === 0) {
    return (
      <div className="mt-8 text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No se encontraron resultados
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          No encontramos rodamientos para "{query}"
        </p>
        <p className="text-sm text-muted-foreground">
          Intenta con otros términos o usa filtros avanzados
        </p>
      </div>
    )
  }
  
  // Results found
  return (
    <div className="mt-8 space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            ✓ {displayResults?.length || results.length} resultados para "{query}"
          </p>
          {strategy?.searchMethod && (
            <p className="text-xs text-muted-foreground">
              {strategy.searchMethod === 'semantic' && '(búsqueda inteligente)'}
              {strategy.searchMethod === 'traditional' && '(búsqueda directa)'}
            </p>
          )}
        </div>
      </div>
      
      {/* Filter Chips (for incomplete queries) */}
      {showFilterChips && results.length > 10 && (
        <FilterChips
          results={results}
          onFilterChange={(filtered, filters) => {
            setFilteredResults(filtered)
            setActiveFilters(filters)
          }}
        />
      )}
      
      {/* Parts Table (existing component) */}
      <PartsTable data={displayResults || results} />
      
      {/* Pagination (only if not fetching all) */}
      {strategy && !strategy.shouldFetchAll && results.length > strategy.pageSize && (
        <Pagination
          currentPage={1}
          pageSize={strategy.pageSize}
          totalResults={results.length}
        />
      )}
    </div>
  )
}
```

---

### **5. Filter Chips Component**

```typescript
// src/components/search/FilterChips.tsx

'use client'

import { useState, useMemo } from 'react'
import { Part } from '@/types'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface FilterChipsProps {
  results: Part[]
  onFilterChange: (filtered: Part[], activeFilters: Record<string, any>) => void
}

export function FilterChips({ results, onFilterChange }: FilterChipsProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  
  // Generate filter options from results
  const filterOptions = useMemo(() => {
    const models = new Map<string, number>()
    const years = new Map<number, number>()
    
    results.forEach(part => {
      part.vehicle_applications?.forEach(va => {
        // Count models
        models.set(va.model, (models.get(va.model) || 0) + 1)
        
        // Count years (expand year range)
        for (let y = va.start_year; y <= va.end_year; y++) {
          years.set(y, (years.get(y) || 0) + 1)
        }
      })
    })
    
    return {
      models: Array.from(models.entries())
        .map(([model, count]) => ({ value: model, count }))
        .sort((a, b) => b.count - a.count), // Most common first
      years: Array.from(years.entries())
        .map(([year, count]) => ({ value: year, count }))
        .sort((a, b) => b.value - a.value) // Newest first
    }
  }, [results])
  
  // Apply filters
  const applyFilters = (model: string | null, year: number | null) => {
    let filtered = results
    
    if (model) {
      filtered = filtered.filter(part =>
        part.vehicle_applications?.some(va => va.model === model)
      )
    }
    
    if (year) {
      filtered = filtered.filter(part =>
        part.vehicle_applications?.some(va =>
          year >= va.start_year && year <= va.end_year
        )
      )
    }
    
    const activeFilters: Record<string, any> = {}
    if (model) activeFilters.model = model
    if (year) activeFilters.year = year
    
    onFilterChange(filtered, activeFilters)
  }
  
  const handleModelClick = (model: string) => {
    const newModel = selectedModel === model ? null : model
    setSelectedModel(newModel)
    applyFilters(newModel, selectedYear)
  }
  
  const handleYearClick = (year: number) => {
    const newYear = selectedYear === year ? null : year
    setSelectedYear(newYear)
    applyFilters(selectedModel, newYear)
  }
  
  const clearFilters = () => {
    setSelectedModel(null)
    setSelectedYear(null)
    onFilterChange(results, {})
  }
  
  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      {/* Model Filters */}
      {filterOptions.models.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Refina por modelo:</p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.models.map(({ value, count }) => (
              <Badge
                key={value}
                variant={selectedModel === value ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleModelClick(value)}
              >
                {value} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Year Filters (only show if model selected) */}
      {selectedModel && filterOptions.years.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Refina por año:</p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.years.map(({ value, count }) => (
              <Badge
                key={value}
                variant={selectedYear === value ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleYearClick(value)}
              >
                {value} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Clear Filters */}
      {(selectedModel || selectedYear) && (
        <button
          onClick={clearFilters}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
```

---

### **6. Advanced Filters Panel**

```typescript
// src/components/search/AdvancedFiltersPanel.tsx

'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface AdvancedFiltersPanelProps {
  open: boolean
  onClose: () => void
  onApplyFilters: (query: string) => void
}

export function AdvancedFiltersPanel({
  open,
  onClose,
  onApplyFilters
}: AdvancedFiltersPanelProps) {
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    year: '',
    position: [] as string[],
    abs: [] as string[]
  })
  
  const handleApply = () => {
    // Construct query from filters
    const parts: string[] = []
    
    if (filters.make) parts.push(filters.make)
    if (filters.model) parts.push(filters.model)
    if (filters.year) parts.push(filters.year)
    if (filters.position.length > 0) parts.push(filters.position.join(' '))
    
    const query = parts.join(' ')
    onApplyFilters(query)
    onClose()
  }
  
  const handleReset = () => {
    setFilters({
      make: '',
      model: '',
      year: '',
      position: [],
      abs: []
    })
  }
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros Avanzados</SheetTitle>
          <SheetDescription>
            Búsqueda precisa por especificaciones
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Vehicle Filters */}
          <div className="space-y-4">
            <h3 className="font-medium">Vehículo</h3>
            
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select
                value={filters.make}
                onValueChange={(value) => setFilters(prev => ({ ...prev, make: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Honda">Honda</SelectItem>
                  <SelectItem value="Toyota">Toyota</SelectItem>
                  <SelectItem value="Ford">Ford</SelectItem>
                  <SelectItem value="Nissan">Nissan</SelectItem>
                  <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select
                value={filters.model}
                onValueChange={(value) => setFilters(prev => ({ ...prev, model: value }))}
                disabled={!filters.make}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona modelo" />
                </SelectTrigger>
                <SelectContent>
                  {filters.make === 'Honda' && (
                    <>
                      <SelectItem value="Civic">Civic</SelectItem>
                      <SelectItem value="Accord">Accord</SelectItem>
                      <SelectItem value="CR-V">CR-V</SelectItem>
                      <SelectItem value="Pilot">Pilot</SelectItem>
                    </>
                  )}
                  {filters.make === 'Toyota' && (
                    <>
                      <SelectItem value="Camry">Camry</SelectItem>
                      <SelectItem value="Corolla">Corolla</SelectItem>
                      <SelectItem value="RAV4">RAV4</SelectItem>
                    </>
                  )}
                  {/* Add more models for other makes */}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Año</Label>
              <Select
                value={filters.year}
                onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
                disabled={!filters.model}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona año" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 16 }, (_, i) => 2025 - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Part Specifications */}
          <div className="space-y-4">
            <h3 className="font-medium">Especificaciones</h3>
            
            <div className="space-y-2">
              <Label>Posición</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="front"
                    checked={filters.position.includes('Delantero')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ 
                          ...prev, 
                          position: [...prev.position, 'Delantero'] 
                        }))
                      } else {
                        setFilters(prev => ({ 
                          ...prev, 
                          position: prev.position.filter(p => p !== 'Delantero') 
                        }))
                      }
                    }}
                  />
                  <label htmlFor="front" className="text-sm cursor-pointer">
                    Delantero
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rear"
                    checked={filters.position.includes('Trasero')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ 
                          ...prev, 
                          position: [...prev.position, 'Trasero'] 
                        }))
                      } else {
                        setFilters(prev => ({ 
                          ...prev, 
                          position: prev.position.filter(p => p !== 'Trasero') 
                        }))
                      }
                    }}
                  />
                  <label htmlFor="rear" className="text-sm cursor-pointer">
                    Trasero
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="left"
                    checked={filters.position.includes('Izquierdo')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ 
                          ...prev, 
                          position: [...prev.position, 'Izquierdo'] 
                        }))
                      } else {
                        setFilters(prev => ({ 
                          ...prev, 
                          position: prev.position.filter(p => p !== 'Izquierdo') 
                        }))
                      }
                    }}
                  />
                  <label htmlFor="left" className="text-sm cursor-pointer">
                    Izquierdo
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="right"
                    checked={filters.position.includes('Derecho')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ 
                          ...prev, 
                          position: [...prev.position, 'Derecho'] 
                        }))
                      } else {
                        setFilters(prev => ({ 
                          ...prev, 
                          position: prev.position.filter(p => p !== 'Derecho') 
                        }))
                      }
                    }}
                  />
                  <label htmlFor="right" className="text-sm cursor-pointer">
                    Derecho
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>ABS</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="with-abs"
                    checked={filters.abs.includes('Con ABS')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ 
                          ...prev, 
                          abs: [...prev.abs, 'Con ABS'] 
                        }))
                      } else {
                        setFilters(prev => ({ 
                          ...prev, 
                          abs: prev.abs.filter(a => a !== 'Con ABS') 
                        }))
                      }
                    }}
                  />
                  <label htmlFor="with-abs" className="text-sm cursor-pointer">
                    Con ABS
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="without-abs"
                    checked={filters.abs.includes('Sin ABS')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ 
                          ...prev, 
                          abs: [...prev.abs, 'Sin ABS'] 
                        }))
                      } else {
                        setFilters(prev => ({ 
                          ...prev, 
                          abs: prev.abs.filter(a => a !== 'Sin ABS') 
                        }))
                      }
                    }}
                  />
                  <label htmlFor="without-abs" className="text-sm cursor-pointer">
                    Sin ABS
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Limpiar
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1"
              disabled={!filters.make && !filters.model && !filters.year}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## 🔗 **State Management with TanStack Query**

### **7. Universal Search Hook**

```typescript
// src/hooks/useUniversalSearch.ts

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { determineSearchStrategy } from '@/lib/ai/search-strategy'
import { AISearchResponse, SearchStrategy } from '@/types'

export function useUniversalSearch(query: string) {
  const [strategy, setStrategy] = useState<SearchStrategy | null>(null)
  
  // Step 1: Execute AI search
  const { 
    data: searchResponse, 
    isLoading,
    error 
  } = useQuery<AISearchResponse>({
    queryKey: ['universal-search', query],
    queryFn: async () => {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      return response.json()
    },
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once on failure
    onError: (error) => {
      console.error('Search error:', error)
      // Error handling via fallback in component
    }
  })
  
  // Step 2: Determine display strategy based on response
  useEffect(() => {
    if (searchResponse) {
      const displayStrategy = determineSearchStrategy(
        searchResponse.searchMethod || 'traditional',
        searchResponse.totalResults || 0,
        searchResponse.confidence || 0
      )
      setStrategy(displayStrategy)
    }
  }, [searchResponse])
  
  return {
    results: searchResponse?.results,
    totalResults: searchResponse?.totalResults,
    aiMessage: searchResponse?.aiMessage,
    isLoading,
    error,
    strategy,
    showFilterChips: strategy?.showFilters || false,
    searchMethod: searchResponse?.searchMethod
  }
}
```

### **8. Search Strategy Determination**

```typescript
// src/lib/ai/search-strategy.ts

export interface SearchStrategy {
  pageSize: number
  shouldFetchAll: boolean
  showFilters: boolean
  paginationType: 'traditional' | 'show_all' | 'infinite'
  searchMethod: 'traditional' | 'semantic' | 'hybrid'
}

export function determineSearchStrategy(
  searchMethod: string,
  resultCount: number,
  confidence: number
): SearchStrategy {
  
  // Exact match (SKU lookup)
  if (searchMethod === 'sku_lookup' || resultCount === 1) {
    return {
      pageSize: 1,
      shouldFetchAll: true,
      showFilters: false,
      paginationType: 'traditional',
      searchMethod: 'traditional'
    }
  }
  
  // Complete vehicle search (precise results)
  if (searchMethod === 'vehicle_search' && confidence > 0.9) {
    return {
      pageSize: 10,
      shouldFetchAll: resultCount <= 20,
      showFilters: false,
      paginationType: 'traditional',
      searchMethod: 'traditional'
    }
  }
  
  // Incomplete search (needs filtering)
  if (resultCount > 20 && resultCount < 200) {
    return {
      pageSize: 999,
      shouldFetchAll: true,
      showFilters: true,
      paginationType: 'show_all',
      searchMethod: searchMethod as any
    }
  }
  
  // Vague semantic search (browsing mode)
  if (searchMethod === 'semantic' || confidence < 0.8) {
    return {
      pageSize: 50,
      shouldFetchAll: false,
      showFilters: true,
      paginationType: 'traditional',
      searchMethod: 'semantic'
    }
  }
  
  // Default strategy
  return {
    pageSize: 20,
    shouldFetchAll: false,
    showFilters: false,
    paginationType: 'traditional',
    searchMethod: 'traditional'
  }
}
```

---

## 📱 **Mobile/Tablet Optimizations**

### **Touch Target Sizes**

```typescript
// Mobile-specific styles
const mobileStyles = {
  searchInput: 'h-16 text-xl px-6', // Extra large for tablets
  voiceButton: 'h-12 w-12',          // Large touch target
  filterChip: 'px-4 py-2 text-base', // Finger-friendly
  tableRow: 'h-14'                   // Easy to tap rows
}

// Apply based on screen size
<Input
  className={cn(
    'pl-12 pr-24',
    isMobile ? mobileStyles.searchInput : 'h-14 text-lg'
  )}
/>
```

### **Recent Searches Mobile Layout**

```typescript
// Horizontal scroll for mobile
<div className="overflow-x-auto pb-2 -mx-4 px-4">
  <div className="flex gap-2 min-w-max">
    {searches.map(search => (
      <button className="flex-shrink-0 px-4 py-2 rounded-full">
        {search.query}
      </button>
    ))}
  </div>
</div>
```

### **Voice Search Prominence on Mobile**

```typescript
// Larger, more prominent on mobile
<VoiceSearchButton 
  className={isMobile ? 'h-14 w-14' : 'h-10 w-10'}
  showLabel={isMobile}
/>
```

---

## ⚡ **Performance Optimizations**

### **1. Debounced Search Input**

```typescript
// Prevent excessive API calls while typing
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export function UniversalSearchInterface() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300) // Wait 300ms after typing stops
  
  const { results } = useUniversalSearch(debouncedQuery)
  
  // User types: "honda civic 2018"
  // API calls only once, 300ms after they stop typing
}
```

### **2. Query Result Caching**

```typescript
// TanStack Query automatically caches results
useQuery({
  queryKey: ['universal-search', query],
  queryFn: fetchSearch,
  staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
})

// Same query within 5 minutes = instant result (no API call)
```

### **3. Optimistic UI for Filter Chips**

```typescript
// Filter chips work instantly (client-side)
const handleFilterClick = (filterValue: string) => {
  // Immediate UI update
  setFilteredResults(
    results.filter(r => matchesFilter(r, filterValue))
  )
  // No loading state, no API call
}
```

### **4. Prefetching Common Searches**

```typescript
// Prefetch popular searches in background
useEffect(() => {
  const popularSearches = ['Honda Civic', 'Toyota Camry', 'Ford F-150']
  
  popularSearches.forEach(search => {
    queryClient.prefetchQuery({
      queryKey: ['universal-search', search],
      queryFn: () => fetchSearch(search)
    })
  })
}, [])
```

---

## 🎯 **Success Metrics & Monitoring**

### **Frontend Analytics to Track**

```typescript
// Track search behavior
interface SearchAnalytics {
  // Engagement
  totalSearches: number
  voiceSearchUsage: number       // % of searches via voice
  recentSearchClicks: number     // How often recent searches used
  filterChipUsage: number        // % of incomplete queries that use filters
  
  // Performance
  avgTimeToResults: number       // How long until results appear
  searchesPerSession: number     // How many searches per visit
  
  // Quality
  noResultsRate: number          // % of searches with 0 results
  refinementRate: number         // % of searches that get refined
  
  // Method Distribution
  semanticSearchRate: number     // % using semantic search
  traditionalSearchRate: number  // % using traditional search
}
```

### **Monitoring Implementation**

```typescript
// src/lib/analytics.ts

export function trackSearchEvent(event: {
  query: string
  method: 'voice' | 'keyboard' | 'recent_search' | 'filter_chip'
  resultsCount: number
  searchStrategy: string
  timeToResults: number
}) {
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: event.query,
      search_method: event.method,
      results_count: event.resultsCount,
      search_strategy: event.searchStrategy,
      time_to_results: event.timeToResults
    })
  }
  
  // Log for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Search Event:', event)
  }
}
```

---

## 🚀 **Deployment & Rollout Strategy**

### **Feature Flag Implementation**

```typescript
// src/lib/feature-flags.ts

export function useFeatureFlag(flagName: string): boolean {
  // Check environment variable
  const envFlag = process.env[`NEXT_PUBLIC_FEATURE_${flagName.toUpperCase()}`]
  
  if (envFlag !== undefined) {
    return envFlag === 'true'
  }
  
  // Check localStorage (for admin override)
  if (typeof window !== 'undefined') {
    const localFlag = localStorage.getItem(`feature_${flagName}`)
    if (localFlag !== null) {
      return localFlag === 'true'
    }
  }
  
  // Default: disabled
  return false
}

// Usage in components
export function SearchPage() {
  const useUniversalSearch = useFeatureFlag('universal_search')
  
  return useUniversalSearch 
    ? <UniversalSearchInterface />
    : <LegacySearchInterface />
}
```

### **Gradual Rollout Plan**

```
Week 1: Internal Testing
- Enable for admin users only
- Test all search scenarios
- Collect feedback from counter staff

Week 2: Beta Release (10% of users)
- Enable for 10% of traffic via feature flag
- Monitor error rates, search success
- Collect user feedback

Week 3: Expansion (50% of users)
- Increase to 50% if metrics positive
- A/B test: Universal vs Legacy
- Compare conversion rates

Week 4: Full Rollout (100% of users)
- Enable for all users
- Keep legacy search accessible via advanced filters
- Monitor for 2 weeks before removing legacy code
```

### **Rollback Procedure**

```typescript
// If issues arise, instant rollback via environment variable

// Vercel Dashboard → Environment Variables
NEXT_PUBLIC_FEATURE_UNIVERSAL_SEARCH=false

// Redeploy (automatic)
// All users revert to legacy search interface
// No code changes needed
```

---

## 📋 **Testing Checklist**

### **Functional Testing**

```
Search Input:
☐ Keyboard input works
☐ Voice input works (Chrome/Safari)
☐ Enter key triggers search
☐ Clear button clears input
☐ Debouncing prevents excessive API calls

Recent Searches:
☐ Recent searches persist after browser close
☐ Clicking chip executes search
☐ Max 10 searches stored
☐ Searches older than 30 days removed

Filter Chips:
☐ Chips generated from results
☐ Clicking chip filters instantly
☐ Multiple filters can be active
☐ Clear filters button works

Results Display:
☐ Loading shows skeleton
☐ No results shows helpful message
☐ Results table renders correctly
☐ Pagination works (when needed)

Advanced Filters:
☐ Panel slides out from right
☐ Dropdowns cascade correctly (make → model → year)
☐ Checkboxes toggle properly
☐ Apply button constructs correct query
☐ Clear button resets all filters

Error Handling:
☐ API timeout shows fallback results
☐ Network error shows toast notification
☐ Rate limiting shows appropriate message
☐ Fallback to traditional search works
```

### **Performance Testing**

```
Response Times:
☐ Skeleton appears <100ms after Enter
☐ Results appear <800ms for AI search
☐ Filter chips apply <50ms (client-side)
☐ Voice recognition starts <200ms

Mobile Performance:
☐ Touch targets ≥44px (Apple guideline)
☐ Scrolling is smooth
☐ Voice button easily tappable
☐ Recent searches scroll horizontally

Caching:
☐ Identical query within 5min = instant
☐ Recent searches load instantly
☐ Filter chips work offline (after initial load)
```

### **Cross-Browser Testing**

```
Desktop:
☐ Chrome (voice works)
☐ Safari (voice works)
☐ Edge (voice works)
☐ Firefox (voice button hidden)

Mobile:
☐ iOS Safari (voice works)
☐ iOS Chrome (voice works)
☐ Android Chrome (voice works)
☐ Android Firefox (voice button hidden)

Tablet:
☐ iPad Safari (primary testing device)
☐ Android tablets
```

---

## 🎓 **Summary: What Phase 5 Delivers**

### **User Experience**
✅ Single universal search bar (replaces separate SKU + Vehicle inputs)  
✅ Voice search for hands-free operation  
✅ Recent searches for quick re-searching  
✅ Progressive disclosure with filter chips (no conversation needed)  
✅ Advanced filters panel for power users  
✅ Skeleton loaders for perceived performance  
✅ Silent fallback with toast notifications  

### **Technical Implementation**
✅ React components with TypeScript  
✅ TanStack Query for state management  
✅ Local Storage for recent searches  
✅ Browser Web Speech API for voice  
✅ Dynamic page sizing based on query type  
✅ Client-side filtering for instant results  
✅ Feature flags for gradual rollout  

### **Performance**
✅ Debounced input (300ms)  
✅ Query caching (5 min stale time)  
✅ Optimistic UI (instant filters)  
✅ Efficient data fetching (fetch all for incomplete, paginate for complete)  

### **Mobile Optimization**
✅ Large touch targets (44px+)  
✅ Voice search prominence  
✅ Horizontal scroll for recent searches  
✅ Responsive filter chips  

---

## 🔜 **Next Steps: Integration with Phase 4**

With Phase 5 complete, the frontend components are ready to connect to the Phase 4 backend:

- Universal search calls `/api/ai/search` endpoint
- Dynamic page sizing passed to backend via `pageSize` parameter
- Filter chips generated from results (client-side)
- Advanced filters construct natural language queries
- Voice transcription feeds directly into search input

The complete AI-enhanced search experience is now fully specified and ready for implementation!