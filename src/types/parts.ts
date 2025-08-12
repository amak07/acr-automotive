/**
 * Auto Parts Type Definitions
 * 
 * Type definitions for the ACR Automotive parts catalog system.
 * These types ensure type safety for all parts-related operations.
 */

/**
 * Part Record Types
 */
export interface Part {
  id: string
  acr_sku: string
  competitor_sku?: string | null
  part_type: string
  position?: string | null
  abs_type?: string | null
  bolt_pattern?: string | null
  drive_type?: string | null
  specifications?: string | null
  image_url?: string | null
  created_at: string
  updated_at: string
}

export interface VehicleApplication {
  id: string
  part_id: string
  make: string
  model: string
  year_range: string
  created_at: string
}

export interface CrossReference {
  id: string
  acr_part_id: string
  competitor_sku: string
  competitor_brand?: string | null
  created_at: string
}

/**
 * Search Result Types
 */
export interface SearchResult extends Part {
  match_type?: 'exact_acr' | 'cross_reference' | 'fuzzy'
  vehicle_applications?: VehicleApplication[]
  cross_references?: CrossReference[]
}

export interface VehicleSearchParams {
  make: string
  model: string
  year_range: string
  part_type?: string
}

export interface SKUSearchParams {
  sku: string
  fuzzy?: boolean
}

/**
 * Excel Import Types
 */
export interface ExcelRowData {
  id?: number
  acr_sku: string
  unknown_field?: string
  competitor_sku?: string
  part_type: string
  position?: string
  abs_type?: string
  bolt_pattern?: string
  drive_type?: string
  specifications?: string
  vehicle_make: string
  vehicle_model: string
  year_range: string
  image_url?: string
}

export interface ImportValidationError {
  row: number
  field: string
  message: string
  value?: any
}

export interface ImportSummary {
  total_rows: number
  valid_rows: number
  errors: ImportValidationError[]
  new_parts: number
  updated_parts: number
  duplicate_skus: string[]
}

export interface ImportPreview {
  summary: ImportSummary
  sample_rows: ExcelRowData[]
  all_errors: ImportValidationError[]
}

/**
 * Admin Interface Types
 */
export interface PartFormData {
  acr_sku: string
  competitor_sku?: string
  part_type: string
  position?: string
  abs_type?: string
  bolt_pattern?: string
  drive_type?: string
  specifications?: string
  vehicle_applications: {
    make: string
    model: string
    year_range: string
  }[]
}

export interface ImageUploadData {
  part_id: string
  acr_sku: string
  file: File
}

/**
 * Dropdown/Filter Types
 */
export interface VehicleMake {
  make: string
  count: number
}

export interface VehicleModel {
  model: string
  count: number
}

export interface YearRange {
  year_range: string
  count: number
}

export interface PartCategory {
  part_type: string
  count: number
}

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SearchApiResponse extends ApiResponse<SearchResult[]> {
  total_results?: number
  search_params?: VehicleSearchParams | SKUSearchParams
}

export interface ImportApiResponse extends ApiResponse<ImportSummary> {
  preview?: ImportPreview
}

/**
 * Search State Types (for Zustand store)
 */
export interface SearchState {
  // Vehicle search state
  selectedMake: string | null
  selectedModel: string | null
  selectedYear: string | null
  selectedPartType: string | null
  
  // SKU search state
  searchSKU: string
  
  // Results
  searchResults: SearchResult[]
  isLoading: boolean
  error: string | null
  
  // Filters and pagination
  sortBy: 'acr_sku' | 'part_type' | 'created_at'
  sortOrder: 'asc' | 'desc'
  currentPage: number
  itemsPerPage: number
  totalResults: number
}

export interface SearchActions {
  // Vehicle search actions
  setSelectedMake: (make: string | null) => void
  setSelectedModel: (model: string | null) => void
  setSelectedYear: (year: string | null) => void
  setSelectedPartType: (partType: string | null) => void
  
  // SKU search actions
  setSearchSKU: (sku: string) => void
  
  // Search execution
  performVehicleSearch: () => Promise<void>
  performSKUSearch: () => Promise<void>
  clearSearch: () => void
  
  // Results management
  setSearchResults: (results: SearchResult[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Pagination and sorting
  setSortBy: (sortBy: SearchState['sortBy']) => void
  setSortOrder: (order: SearchState['sortOrder']) => void
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
}

/**
 * Internationalization Types
 */
export interface TranslationKeys {
  // Search interface
  'search.vehicle': string
  'search.sku': string
  'search.make': string
  'search.model': string
  'search.year': string
  'search.partType': string
  'search.enterSKU': string
  'search.noResults': string
  'search.loading': string
  
  // Part details
  'part.details': string
  'part.sku': string
  'part.type': string
  'part.position': string
  'part.abs': string
  'part.bolts': string
  'part.drive': string
  'part.specs': string
  'part.applications': string
  'part.crossReference': string
  
  // Admin interface
  'admin.upload': string
  'admin.import': string
  'admin.preview': string
  'admin.confirm': string
  'admin.errors': string
  
  // Common
  'common.search': string
  'common.clear': string
  'common.loading': string
  'common.error': string
  'common.success': string
}

export type Locale = 'en' | 'es'

/**
 * Utility Types
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Brand and Competition Types
 */
export interface CompetitorBrand {
  name: string
  common_prefixes: string[]
  sku_patterns: RegExp[]
}

export interface PartCompatibility {
  part_id: string
  compatible_parts: string[]
  alternative_skus: string[]
  superseded_by?: string
}