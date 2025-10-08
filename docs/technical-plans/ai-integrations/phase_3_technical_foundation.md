# Phase 3: Technical Foundation (Backend)
## Database Setup, Vector Embeddings, and Backend API Architecture

---

## 🎯 **Overview**

Phase 4 establishes the technical infrastructure for ACR's AI-powered search system. This includes database enhancements for semantic search, embedding generation for existing parts, and the backend API architecture that intelligently routes between traditional and semantic search strategies.

**Key Principle**: **Augment, don't replace** - Traditional search remains for structured queries, semantic search adds intelligent fallback and natural language understanding.

---

## 🗄️ **Part 1: Database Setup**

### **What We're Building: Hybrid Search Architecture**

```
User Query → AI Intent Classification → Search Strategy Selection
                                              ↓
                        ┌─────────────────────┴─────────────────────┐
                        ↓                                           ↓
              Traditional Search                          Semantic Search
              (Vehicle/SKU exact match)                   (Meaning-based similarity)
                      ↓                                           ↓
              Existing indexes                            Vector embeddings
              Fast (<100ms)                               Smart (~300ms)
```

**Technical Reasoning**: 
- Traditional search is perfect for structured data (make/model/year, exact SKUs)
- Semantic search excels at vague descriptions and typo recovery
- Hybrid approach gets best of both worlds

### **1.1 Enable pgvector Extension**

**What**: Adds native vector data type to PostgreSQL
**Why**: Allows storing and searching embeddings directly in Supabase

```sql
-- Run in Supabase SQL Editor (Production database)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Technical Notes**:
- pgvector is included by default in Supabase
- No additional configuration needed
- Vector operations are native PostgreSQL functions

### **1.2 Add Embedding Columns to Parts Table**

**What**: Add vector columns to store AI-generated embeddings
**Why**: Enable semantic similarity searches

```sql
-- Add embedding columns to existing parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS description_embedding vector(1536);

-- Optional: Separate embedding for SKU fuzzy matching
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS sku_embedding vector(1536);

-- Add metadata for tracking
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'text-embedding-3-small';
```

**Technical Reasoning**:
- `vector(1536)` matches OpenAI text-embedding-3-small output dimensions
- Separate SKU embeddings allow different search strategies (optional for MVP)
- Metadata tracks when embeddings generated (for future re-generation if models improve)
- Nullable columns allow gradual migration without breaking existing data

**Storage Impact**:
```
865 parts × 1536 dimensions × 4 bytes per float = ~5.3 MB
Negligible storage cost for massive search improvement
```

### **1.3 Create Vector Indexes**

**What**: Performance indexes for fast similarity searches
**Why**: Without indexes, vector searches would scan entire table (slow)

```sql
-- Create IVFFlat index for description embeddings
CREATE INDEX idx_parts_description_embedding 
ON parts 
USING ivfflat (description_embedding vector_cosine_ops)
WITH (lists = 100);

-- Optional: Index for SKU embeddings
CREATE INDEX idx_parts_sku_embedding 
ON parts 
USING ivfflat (sku_embedding vector_cosine_ops)
WITH (lists = 100);
```

**Technical Reasoning**:

**Index Type: IVFFlat**
- Best for datasets <1M vectors (ACR has 865)
- Trades slight accuracy for speed
- Good balance for production use

**Operator: vector_cosine_ops**
- Cosine similarity is standard for text embeddings
- Measures angle between vectors (direction matters, not magnitude)
- Range: -1 to 1 (higher = more similar)

**Tuning Parameter: lists = 100**
- Rule of thumb: sqrt(row_count) for <1M rows
- sqrt(865) ≈ 29, but 100 provides better recall
- More lists = better accuracy, slightly slower queries
- Adjust if dataset grows: 1000 parts = 30 lists, 10000 parts = 100 lists

**Performance Impact**:
```
Without index: O(n) - scans all 865 parts (~500ms)
With index: O(log n) - checks ~100 cluster centers (~50ms)
Speed improvement: 10x faster
```

### **1.4 Create Similarity Search Function**

**What**: Database function for semantic search
**Why**: Encapsulates complex similarity logic, callable from API

```sql
CREATE OR REPLACE FUNCTION search_parts_by_similarity(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  acr_sku varchar(50),
  part_type varchar(100),
  position_type varchar(50),
  abs_type varchar(20),
  bolt_pattern varchar(50),
  drive_type varchar(50),
  specifications text,
  image_url text,
  similarity_score float
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.acr_sku,
    p.part_type,
    p.position_type,
    p.abs_type,
    p.bolt_pattern,
    p.drive_type,
    p.specifications,
    p.image_url,
    1 - (p.description_embedding <=> query_embedding) as similarity_score
  FROM parts p
  WHERE p.description_embedding IS NOT NULL
    AND 1 - (p.description_embedding <=> query_embedding) > similarity_threshold
  ORDER BY p.description_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Technical Reasoning**:

**Cosine Distance Operator `<=>`**:
- Returns distance (0 = identical, 2 = opposite)
- Lower distance = more similar

**Similarity Score Conversion**:
- `1 - distance` converts to similarity (0-1 range, higher = better)
- Makes results more intuitive for frontend

**Threshold Filter**:
- Default 0.7 = 70% similarity minimum
- Filters weak matches before returning
- Adjustable based on testing (0.6-0.8 typical range)

**NULL Check**:
- Only searches parts with embeddings
- Gracefully handles migration in progress

**Performance**:
- Index automatically used by ORDER BY
- LIMIT applied after sorting (efficient)
- Typical query time: 50-200ms for 865 parts

### **1.5 Create Hybrid Search Function**

**What**: Intelligent search that tries traditional first, semantic as fallback
**Why**: Best of both worlds - fast precise results when possible, smart fallback when needed

```sql
CREATE OR REPLACE FUNCTION search_parts_hybrid(
  search_make varchar(50) DEFAULT NULL,
  search_model varchar(100) DEFAULT NULL,
  search_year int DEFAULT NULL,
  search_sku varchar(50) DEFAULT NULL,
  search_embedding vector(1536) DEFAULT NULL,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  acr_sku varchar(50),
  part_type varchar(100),
  position_type varchar(50),
  abs_type varchar(20),
  bolt_pattern varchar(50),
  drive_type varchar(50),
  specifications text,
  image_url text,
  search_method varchar(20),
  similarity_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  result_count int;
BEGIN
  -- Try traditional search first (if parameters provided)
  IF search_make IS NOT NULL AND search_model IS NOT NULL AND search_year IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, 
      p.bolt_pattern, p.drive_type, p.specifications, p.image_url,
      'traditional'::varchar(20) as search_method,
      1.0::float as similarity_score
    FROM parts p
    JOIN vehicle_applications va ON p.id = va.part_id
    WHERE va.make = search_make 
      AND va.model = search_model
      AND search_year BETWEEN va.start_year AND va.end_year;
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
    IF result_count > 0 THEN RETURN; END IF;
  END IF;

  -- Try SKU search if provided
  IF search_sku IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
      p.bolt_pattern, p.drive_type, p.specifications, p.image_url,
      'traditional'::varchar(20) as search_method,
      1.0::float as similarity_score
    FROM parts p
    WHERE p.acr_sku = search_sku
       OR similarity(p.acr_sku, search_sku) > 0.6;
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
    IF result_count > 0 THEN RETURN; END IF;
  END IF;

  -- Fallback to semantic search
  IF search_embedding IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
      p.bolt_pattern, p.drive_type, p.specifications, p.image_url,
      'semantic'::varchar(20) as search_method,
      1 - (p.description_embedding <=> search_embedding) as similarity_score
    FROM parts p
    WHERE p.description_embedding IS NOT NULL
      AND 1 - (p.description_embedding <=> search_embedding) > similarity_threshold
    ORDER BY p.description_embedding <=> search_embedding
    LIMIT 10;
  END IF;
END;
$$;
```

**Technical Reasoning**:
- Single function encapsulates entire hybrid strategy
- Returns `search_method` so frontend knows which strategy worked
- Early returns optimize performance (don't check semantic if traditional succeeds)
- Graceful degradation through multiple fallback layers

---

## 🔄 **Part 2: Embedding Generation Migration**

### **2.1 One-Time Embedding Generation Script**

**What**: Generate embeddings for all 865 existing MAZA parts
**When**: Run once now, then on-demand for new parts
**Cost**: ~$0.002 (essentially free)

```typescript
// scripts/generate-embeddings.ts
import { openai } from '@ai-sdk/openai'
import { embedMany } from 'ai'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key for write access
)

interface Part {
  id: string
  acr_sku: string
  part_type: string
  position_type: string | null
  abs_type: string | null
  bolt_pattern: string | null
  drive_type: string | null
  specifications: string | null
}

/**
 * Generate rich text description for embedding
 * Combines all relevant part information
 */
function createPartDescription(part: Part): string {
  const components = [
    part.part_type,
    part.acr_sku,
    part.position_type,
    part.abs_type,
    part.bolt_pattern,
    part.drive_type,
    part.specifications
  ].filter(Boolean) // Remove nulls
  
  return components.join(' ')
}

/**
 * Main migration function
 * Processes parts in batches to respect rate limits
 */
async function generateEmbeddings() {
  console.log('🚀 Starting embedding generation...')
  
  // 1. Fetch all parts without embeddings
  const { data: parts, error } = await supabase
    .from('parts')
    .select('id, acr_sku, part_type, position_type, abs_type, bolt_pattern, drive_type, specifications')
    .is('description_embedding', null)
  
  if (error) {
    console.error('❌ Error fetching parts:', error)
    throw error
  }
  
  console.log(`📊 Found ${parts.length} parts without embeddings`)
  
  // 2. Process in batches (OpenAI rate limits)
  const batchSize = 50 // Conservative batch size
  const totalBatches = Math.ceil(parts.length / batchSize)
  
  for (let i = 0; i < parts.length; i += batchSize) {
    const batchNumber = Math.floor(i / batchSize) + 1
    const batch = parts.slice(i, i + batchSize)
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} parts)`)
    
    try {
      // 3. Create descriptions for embedding
      const descriptions = batch.map(createPartDescription)
      
      // 4. Generate embeddings via OpenAI (batch API call)
      const { embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: descriptions
      })
      
      console.log(`✅ Generated ${embeddings.length} embeddings`)
      
      // 5. Update database with embeddings
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from('parts')
          .update({ 
            description_embedding: embeddings[j],
            embedding_generated_at: new Date().toISOString(),
            embedding_model: 'text-embedding-3-small'
          })
          .eq('id', batch[j].id)
        
        if (updateError) {
          console.error(`❌ Error updating part ${batch[j].acr_sku}:`, updateError)
        }
      }
      
      console.log(`💾 Updated ${batch.length} parts in database`)
      
      // 6. Rate limiting delay between batches
      if (i + batchSize < parts.length) {
        console.log('⏳ Waiting 1 second before next batch...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
    } catch (batchError) {
      console.error(`❌ Error processing batch ${batchNumber}:`, batchError)
      // Continue with next batch instead of failing entire migration
      continue
    }
  }
  
  console.log('\n✅ Embedding generation complete!')
  console.log(`📊 Processed ${parts.length} parts`)
  
  // 7. Verify completion
  const { count } = await supabase
    .from('parts')
    .select('id', { count: 'exact', head: true })
    .not('description_embedding', 'is', null)
  
  console.log(`✅ ${count} parts now have embeddings`)
}

// Run migration
generateEmbeddings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
```

**Technical Reasoning**:

**Batch Processing**:
- 50 parts per batch respects OpenAI rate limits (3,000 requests/minute)
- 865 parts ÷ 50 = ~18 batches = ~20 seconds total
- 1 second delay between batches prevents rate limit errors

**Description Quality**:
- Combines all searchable part attributes
- Richer descriptions = better embeddings
- Filters null values to avoid "null" in descriptions

**Error Handling**:
- Try-catch per batch (one failure doesn't stop entire migration)
- Logs errors but continues processing
- Verification step at end confirms completion

**Cost Calculation**:
```
865 parts × ~100 tokens per description = 86,500 tokens
86,500 tokens ÷ 1,000,000 × $0.02 (input cost) = $0.0017
Total: less than a penny!
```

### **2.2 Ongoing Embedding Generation**

**For new parts created via admin interface**:

```typescript
// src/lib/services/parts.service.ts

import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function createPartWithEmbedding(partData: PartCreateInput) {
  // 1. Create part in database
  const { data: part, error } = await supabase
    .from('parts')
    .insert(partData)
    .select()
    .single()
  
  if (error) throw error
  
  // 2. Generate embedding for new part (async, non-blocking)
  generateEmbeddingForPart(part.id).catch(err => {
    console.error('Failed to generate embedding:', err)
    // Log error but don't block part creation
  })
  
  return part
}

async function generateEmbeddingForPart(partId: string) {
  // Fetch part details
  const { data: part } = await supabase
    .from('parts')
    .select('*')
    .eq('id', partId)
    .single()
  
  if (!part) return
  
  // Create description
  const description = createPartDescription(part)
  
  // Generate embedding
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: description
  })
  
  // Update part with embedding
  await supabase
    .from('parts')
    .update({ 
      description_embedding: embedding,
      embedding_generated_at: new Date().toISOString()
    })
    .eq('id', partId)
}
```

**Technical Reasoning**:
- Embeddings generated asynchronously (don't block admin UI)
- Failures logged but don't prevent part creation
- Eventually consistent (part searchable via traditional search immediately, semantic search within seconds)

---

## 🔌 **Part 3: Backend API Architecture**

### **3.1 New AI Search Endpoint**

**Endpoint**: `POST /api/ai/search`
**Purpose**: Intelligent search routing with AI intent classification
**Strategy**: Hybrid search with fallback layers

```typescript
// src/app/api/ai/search/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { classifyIntent } from '@/lib/ai/intent-classifier'
import { generateResponse } from '@/lib/ai/response-generator'
import { checkRateLimit } from '@/lib/rate-limiter'
import { searchHybrid } from '@/lib/services/search.service'

// Request validation schema
const AISearchRequestSchema = z.object({
  query: z.string().min(1, 'Query required').max(500, 'Query too long'),
  conversationId: z.string().uuid().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    message: z.string(),
    timestamp: z.number()
  })).max(10).optional() // Limit history to prevent large payloads
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. Parse and validate request
    const body = await request.json()
    const validatedData = AISearchRequestSchema.parse(body)
    const { query, conversationId, conversationHistory = [] } = validatedData
    
    // 2. Rate limiting check (IP-based)
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const rateLimitOk = await checkRateLimit(clientIP)
    if (!rateLimitOk) {
      return NextResponse.json({
        messageType: 'rate_limited',
        aiMessage: 'Has alcanzado el límite de búsquedas. Intenta en 10 minutos o usa búsqueda tradicional.',
        fallbackToTraditional: true,
        processingTime: Date.now() - startTime
      }, { status: 429 })
    }
    
    // 3. Check conversation turn limit
    const turnCount = conversationHistory.length + 1
    if (turnCount > 3) {
      return NextResponse.json({
        messageType: 'max_turns_exceeded',
        aiMessage: 'He alcanzado el límite de refinamientos. Intenta búsqueda por filtros.',
        showTraditionalSearch: true,
        conversationComplete: true,
        processingTime: Date.now() - startTime
      }, { status: 200 })
    }
    
    // 4. Classify intent using AI
    const intentResult = await classifyIntent(query, conversationHistory)
    
    // 5. Handle clarification needed
    if (intentResult.needsClarification) {
      return NextResponse.json({
        messageType: 'clarification',
        aiMessage: intentResult.clarificationQuestion,
        conversationId: conversationId || crypto.randomUUID(),
        turnCount,
        remainingTurns: 3 - turnCount,
        conversationComplete: false,
        needsClarification: true,
        confidence: intentResult.confidence,
        processingTime: Date.now() - startTime
      })
    }
    
    // 6. Handle invalid intents
    if (intentResult.intent === 'off_topic') {
      return NextResponse.json({
        messageType: 'off_topic',
        aiMessage: 'Soy el asistente de rodamientos MAZA de ACR. ¿Necesitas ayuda para encontrar una parte?',
        conversationComplete: true,
        processingTime: Date.now() - startTime
      })
    }
    
    if (intentResult.intent === 'non_maza_parts') {
      return NextResponse.json({
        messageType: 'redirect',
        aiMessage: 'Somos especialistas en rodamientos MAZA. ¿Necesitas rodamientos de rueda para tu vehículo?',
        conversationComplete: true,
        processingTime: Date.now() - startTime
      })
    }
    
    // 7. Execute hybrid search
    const searchResults = await searchHybrid(intentResult, query)
    
    // 8. Generate natural language response
    const aiMessage = await generateResponse(searchResults, query, intentResult)
    
    // 9. Return complete response
    return NextResponse.json({
      messageType: 'success',
      aiMessage,
      conversationId: conversationId || crypto.randomUUID(),
      turnCount,
      remainingTurns: 3 - turnCount,
      conversationComplete: true,
      needsClarification: false,
      searchParams: intentResult.parameters,
      searchMethod: searchResults.method, // 'traditional' or 'semantic'
      results: searchResults.data,
      totalResults: searchResults.count,
      currentPage: 1,
      pageSize: 10,
      totalPages: Math.ceil(searchResults.count / 10),
      confidence: intentResult.confidence,
      processingTime: Date.now() - startTime
    })
    
  } catch (error) {
    console.error('AI Search Error:', error)
    
    // Fallback to traditional search on any error
    return NextResponse.json({
      messageType: 'error',
      aiMessage: 'La búsqueda inteligente no está disponible. Mostrando resultados tradicionales.',
      fallbackUsed: true,
      showTraditionalSearch: true,
      processingTime: Date.now() - startTime
    }, { status: 500 })
  }
}
```

**Technical Reasoning**:

**Validation First**:
- Zod schema catches malformed requests early
- Prevents processing invalid data
- Type-safe throughout function

**Rate Limiting Early**:
- Check before expensive AI calls
- Prevents abuse without authentication
- IP-based (imperfect but functional)

**Turn Limit Enforcement**:
- Hard stop at 3 turns prevents infinite loops
- Forces users to traditional search if AI can't help
- Clear messaging about why limit reached

**Error Handling Strategy**:
- Try-catch wraps entire function
- Always returns valid response (never crashes)
- Fallback to traditional search on any error
- Logs errors for monitoring

**Processing Time Tracking**:
- Measure total response time
- Monitor performance over time
- Identify slow queries for optimization

### **3.2 Hybrid Search Service**

```typescript
// src/lib/services/search.service.ts

import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/client'
import type { IntentResult } from '@/lib/ai/intent-classifier'

const supabase = createClient()

interface SearchResult {
  data: Part[]
  count: number
  method: 'traditional' | 'semantic' | 'hybrid'
}

/**
 * Intelligent hybrid search
 * Routes to best search strategy based on intent
 */
export async function searchHybrid(
  intentResult: IntentResult,
  originalQuery: string
): Promise<SearchResult> {
  
  // Strategy 1: Traditional search for structured data
  if (intentResult.intent === 'vehicle_search' && 
      intentResult.parameters.make && 
      intentResult.parameters.model && 
      intentResult.parameters.year) {
    
    const results = await searchByVehicle(
      intentResult.parameters.make,
      intentResult.parameters.model,
      intentResult.parameters.year
    )
    
    // If traditional succeeds, return immediately
    if (results.data.length > 0) {
      return { ...results, method: 'traditional' }
    }
    
    // Fall through to semantic search
  }
  
  // Strategy 2: Traditional SKU search
  if (intentResult.intent === 'sku_lookup' && intentResult.parameters.sku) {
    const results = await searchBySKU(intentResult.parameters.sku)
    
    if (results.data.length > 0) {
      return { ...results, method: 'traditional' }
    }
    
    // Fall through to semantic search
  }
  
  // Strategy 3: Semantic search fallback
  // Generate embedding for user query
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: originalQuery
  })
  
  // Call similarity search function
  const { data, error, count } = await supabase
    .rpc('search_parts_by_similarity', {
      query_embedding: embedding,
      similarity_threshold: 0.7,
      match_count: 50 // Get more results for pagination
    })
  
  if (error) throw error
  
  return {
    data: data || [],
    count: count || 0,
    method: 'semantic'
  }
}

/**
 * Traditional vehicle search (existing function)
 */
async function searchByVehicle(make: string, model: string, year: number) {
  const { data, error, count } = await supabase
    .rpc('search_by_vehicle', { make, model, target_year: year })
  
  if (error) throw error
  
  return { data: data || [], count: count || 0 }
}

/**
 * Traditional SKU search (existing function)
 */
async function searchBySKU(sku: string) {
  const { data, error, count } = await supabase
    .rpc('search_by_sku', { search_sku: sku })
  
  if (error) throw error
  
  return { data: data || [], count: count || 0 }
}
```

**Technical Reasoning**:

**Early Returns**:
- Traditional search tries first (fastest)
- Only calls semantic if traditional fails
- Optimizes for most common case (structured queries)

**Method Tracking**:
- Returns which search method worked
- Frontend can display this to user
- Analytics track usage patterns

**Error Propagation**:
- Throws errors to be caught by API route
- Consistent error handling across all search types

### **3.3 Rate Limiting Implementation**

```typescript
// src/lib/rate-limiter.ts

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis for production scaling)
const rateLimitStore = new Map<string, RateLimitEntry>()

const LIMITS = {
  perMinute: 10,
  perHour: 50,
  perDay: 200
}

export async function checkRateLimit(clientIP: string): Promise<boolean> {
  const now = Date.now()
  const minuteKey = `${clientIP}:minute:${Math.floor(now / 60000)}`
  const hourKey = `${clientIP}:hour:${Math.floor(now / 3600000)}`
  const dayKey = `${clientIP}:day:${Math.floor(now / 86400000)}`
  
  // Check minute limit
  const minuteEntry = rateLimitStore.get(minuteKey) || { count: 0, resetAt: now + 60000 }
  if (minuteEntry.count >= LIMITS.perMinute) return false
  
  // Check hour limit
  const hourEntry = rateLimitStore.get(hourKey) || { count: 0, resetAt: now + 3600000 }
  if (hourEntry.count >= LIMITS.perHour) return false
  
  // Check day limit
  const dayEntry = rateLimitStore.get(dayKey) || { count: 0, resetAt: now + 86400000 }
  if (dayEntry.count >= LIMITS.perDay) return false
  
  // Increment counters
  rateLimitStore.set(minuteKey, { count: minuteEntry.count + 1, resetAt: minuteEntry.resetAt })
  rateLimitStore.set(hourKey, { count: hourEntry.count + 1, resetAt: hourEntry.resetAt })
  rateLimitStore.set(dayKey, { count: dayEntry.count + 1, resetAt: dayEntry.resetAt })
  
  // Cleanup old entries (prevent memory leak)
  cleanupExpiredEntries()
  
  return true
}

function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}
```

**Technical Reasoning**:
- Three-tier rate limiting (minute/hour/day)
- In-memory for MVP (fast, simple)
- Cleanup prevents memory leaks
- Ready for Redis upgrade when scaling

---

## 🧪 **Part 4: Development Environment Setup**

### **4.1 Environment Variables**

```bash
# .env.local (Development)
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_KEY=your-test-service-key
OPENAI_API_KEY=sk-your-openai-key

# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_KEY=your-prod-service-key
OPENAI_API_KEY=sk-your-openai-key-prod
```

**Technical Reasoning**:
- Separate test/prod Supabase projects prevents accidental data corruption
- Service keys for admin operations (embedding generation)
- Anon keys for client-side operations (read-only)
- OpenAI key can be same for dev/prod (cost tracking via metadata)

### **4.2 TypeScript Interfaces**

```typescript
// src/types/ai-search.ts

export interface AISearchRequest {
  query: string
  conversationId?: string
  conversationHistory?: ConversationMessage[]
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  message: string
  timestamp: number
}

export interface AISearchResponse {
  // AI Response
  messageType: 'success' | 'clarification' | 'no_results' | 'redirect' | 'error' | 'rate_limited' | 'off_topic' | 'max_turns_exceeded'
  aiMessage: string
  messageTone?: 'formal' | 'friendly' | 'business'
  
  // Conversation State
  conversationId: string
  turnCount: number
  remainingTurns: number
  conversationComplete: boolean
  needsClarification: boolean
  
  // Search Results
  searchParams?: SearchParams
  searchMethod?: 'traditional' | 'semantic' | 'hybrid'
  results?: Part[]
  totalResults?: number
  
  // Pagination
  currentPage: number
  pageSize: number
  totalPages: number
  
  // Metadata
  confidence: number
  processingTime: number
  fallbackUsed?: boolean
  showTraditionalSearch?: boolean
  
  // Rate Limiting
  rateLimitStatus?: {
    remaining: number
    resetAt: number
  }
}

export interface SearchParams {
  make?: string
  model?: string
  year?: number
  sku?: string
  partType?: string
}

export interface IntentResult {
  intent: 'vehicle_search' | 'sku_lookup' | 'part_category_search' | 
          'cross_reference_lookup' | 'compatibility_check' | 'general_inventory' |
          'non_maza_parts' | 'off_topic' | 'unsupported'
  confidence: number
  needsClarification: boolean
  clarificationQuestion?: string
  parameters: SearchParams
  searchStrategy: 'traditional' | 'semantic' | 'hybrid'
}
```

### **4.3 Database Migration Checklist**

**Pre-Migration Checklist**:
```
☐ Backup production database (Supabase dashboard → Database → Backups)
☐ Test all SQL scripts in development environment first
☐ Verify pgvector extension available in Supabase
☐ Confirm OpenAI API key has sufficient quota
☐ Review estimated costs (~$0.002 for 865 parts)
```

**Migration Steps (Production)**:
```
1. ☐ Enable pgvector extension
2. ☐ Add embedding columns to parts table
3. ☐ Create vector indexes
4. ☐ Create similarity search functions
5. ☐ Run embedding generation script
6. ☐ Verify embeddings generated (check count)
7. ☐ Test similarity search manually
8. ☐ Deploy backend API changes
9. ☐ Monitor first 100 AI searches
10. ☐ Adjust similarity threshold if needed (0.6-0.8 range)
```

**Rollback Plan**:
```sql
-- If something goes wrong, remove vector columns
ALTER TABLE parts DROP COLUMN IF EXISTS description_embedding;
ALTER TABLE parts DROP COLUMN IF EXISTS sku_embedding;
ALTER TABLE parts DROP COLUMN IF EXISTS embedding_generated_at;
ALTER TABLE parts DROP COLUMN IF EXISTS embedding_model;

-- Drop indexes
DROP INDEX IF EXISTS idx_parts_description_embedding;
DROP INDEX IF EXISTS idx_parts_sku_embedding;

-- Drop functions
DROP FUNCTION IF EXISTS search_parts_by_similarity;
DROP FUNCTION IF EXISTS search_parts_hybrid;

-- Traditional search still works (no data lost)
```

---

## 📊 **Part 5: Testing Strategy**

### **5.1 Database Function Testing**

```sql
-- Test 1: Verify pgvector installation
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Expected: One row with vector extension

-- Test 2: Check embedding columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'parts' 
  AND column_name LIKE '%embedding%';
-- Expected: description_embedding (vector), sku_embedding (vector)

-- Test 3: Count parts with embeddings
SELECT 
  COUNT(*) as total_parts,
  COUNT(description_embedding) as parts_with_embeddings,
  ROUND(COUNT(description_embedding)::numeric / COUNT(*)::numeric * 100, 2) as percentage
FROM parts;
-- Expected after migration: 865 total, 865 with embeddings, 100%

-- Test 4: Test similarity search function
-- First, get a sample embedding from an existing part
WITH sample_embedding AS (
  SELECT description_embedding 
  FROM parts 
  WHERE description_embedding IS NOT NULL 
  LIMIT 1
)
SELECT * FROM search_parts_by_similarity(
  (SELECT description_embedding FROM sample_embedding),
  0.7,
  5
);
-- Expected: 5 similar parts returned with similarity scores
```

### **5.2 API Endpoint Testing**

```typescript
// Test 1: Successful vehicle search
const test1 = await fetch('/api/ai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'rodamientos Honda Civic 2018'
  })
})
// Expected: 200 OK, messageType: 'success', results array

// Test 2: Clarification needed
const test2 = await fetch('/api/ai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'rodamientos Honda'
  })
})
// Expected: 200 OK, messageType: 'clarification', needsClarification: true

// Test 3: Off-topic rejection
const test3 = await fetch('/api/ai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '¿cómo estás?'
  })
})
// Expected: 200 OK, messageType: 'off_topic'

// Test 4: Non-MAZA redirect
const test4 = await fetch('/api/ai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'frenos para Honda Civic'
  })
})
// Expected: 200 OK, messageType: 'redirect'

// Test 5: Rate limiting
// Make 11 requests in quick succession
for (let i = 0; i < 11; i++) {
  await fetch('/api/ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `test ${i}` })
  })
}
// Expected: First 10 succeed, 11th returns 429 rate_limited
```

### **5.3 Hybrid Search Testing**

```typescript
// Test scenarios to verify search strategy routing

// Scenario 1: Structured query → Traditional search
query: "rodamientos Honda Civic 2018"
expected_method: "traditional"
expected_results: > 0

// Scenario 2: Vague description → Semantic search
query: "algo para el cubo delantero Honda"
expected_method: "semantic"
expected_results: > 0

// Scenario 3: Typos → Traditional fails, semantic succeeds
query: "rodaminetos Hoda Civi 2018"
expected_method: "semantic" (fallback)
expected_results: > 0

// Scenario 4: Valid SKU → Traditional search
query: "ACR-MAZA-001"
expected_method: "traditional"
expected_results: 1

// Scenario 5: No results anywhere
query: "rodamientos para avión Boeing 747"
expected_method: "semantic" (tried both, found nothing)
expected_results: 0
```

### **5.4 Performance Benchmarks**

```typescript
// Measure response times for different search types

interface PerformanceBenchmark {
  searchType: string
  avgResponseTime: number
  target: number
  status: 'pass' | 'fail'
}

const benchmarks: PerformanceBenchmark[] = [
  {
    searchType: 'Traditional Vehicle Search',
    avgResponseTime: 150, // ms
    target: 300,
    status: 'pass'
  },
  {
    searchType: 'Traditional SKU Search',
    avgResponseTime: 120,
    target: 300,
    status: 'pass'
  },
  {
    searchType: 'AI Intent Classification',
    avgResponseTime: 280,
    target: 400,
    status: 'pass'
  },
  {
    searchType: 'Semantic Search',
    avgResponseTime: 350,
    target: 500,
    status: 'pass'
  },
  {
    searchType: 'Complete AI Search (Traditional)',
    avgResponseTime: 520,
    target: 800,
    status: 'pass'
  },
  {
    searchType: 'Complete AI Search (Semantic Fallback)',
    avgResponseTime: 720,
    target: 1000,
    status: 'pass'
  }
]
```

---

## 💰 **Part 6: Cost Monitoring**

### **6.1 Cost Estimation**

```typescript
// Detailed cost breakdown for ACR usage

interface CostEstimate {
  operation: string
  volumePerMonth: number
  costPerOperation: number
  monthlyTotal: number
}

const costEstimates: CostEstimate[] = [
  {
    operation: 'Intent Classification (GPT-4o Mini)',
    volumePerMonth: 3000, // 100 searches/day
    costPerOperation: 0.0008, // ~150 input + 100 output tokens
    monthlyTotal: 2.40
  },
  {
    operation: 'Response Generation (GPT-4o Mini)',
    volumePerMonth: 2500, // 80% complete successfully
    costPerOperation: 0.0011, // ~500 input + 50 output tokens
    monthlyTotal: 2.75
  },
  {
    operation: 'Embedding Generation (new parts)',
    volumePerMonth: 50, // ~10 new parts/week
    costPerOperation: 0.00002, // ~100 tokens
    monthlyTotal: 0.001
  },
  {
    operation: 'Semantic Search Embeddings',
    volumePerMonth: 500, // 20% use semantic search
    costPerOperation: 0.00002,
    monthlyTotal: 0.01
  }
]

// Total estimated monthly cost: ~$5.16
// With 30% buffer for clarifications: ~$6.70/month
```

### **6.2 Cost Tracking Implementation**

```typescript
// src/lib/ai/cost-tracker.ts

interface AIUsageLog {
  timestamp: Date
  operation: 'intent_classification' | 'response_generation' | 'embedding_generation' | 'semantic_search'
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  success: boolean
}

export async function logAIUsage(log: AIUsageLog) {
  // Log to database for cost tracking
  await supabase
    .from('ai_usage_logs')
    .insert({
      timestamp: log.timestamp.toISOString(),
      operation: log.operation,
      model: log.model,
      input_tokens: log.inputTokens,
      output_tokens: log.outputTokens,
      estimated_cost: log.estimatedCost,
      success: log.success
    })
}

export async function getDailyCostSummary(date: Date) {
  const { data } = await supabase
    .from('ai_usage_logs')
    .select('estimated_cost, operation')
    .gte('timestamp', new Date(date.setHours(0, 0, 0, 0)).toISOString())
    .lte('timestamp', new Date(date.setHours(23, 59, 59, 999)).toISOString())
  
  const totalCost = data?.reduce((sum, log) => sum + log.estimated_cost, 0) || 0
  
  return {
    date,
    totalCost,
    operationBreakdown: groupBy(data, 'operation')
  }
}
```

### **6.3 Cost Alert System**

```typescript
// src/lib/ai/cost-alerts.ts

const COST_THRESHOLDS = {
  daily: 1.00,   // Alert if >$1/day
  weekly: 5.00,  // Alert if >$5/week
  monthly: 15.00 // Alert if >$15/month
}

export async function checkCostThresholds() {
  const today = new Date()
  const dailyCost = await getDailyCostSummary(today)
  
  if (dailyCost.totalCost > COST_THRESHOLDS.daily) {
    await sendAlert('DAILY_COST_EXCEEDED', {
      cost: dailyCost.totalCost,
      threshold: COST_THRESHOLDS.daily,
      date: today
    })
  }
  
  // Similar checks for weekly/monthly
}

async function sendAlert(alertType: string, data: any) {
  // Send email, Slack notification, etc.
  console.error(`COST ALERT [${alertType}]:`, data)
  
  // Log to monitoring service
  // Could integrate with Vercel Analytics, Sentry, etc.
}
```

---

## 🚀 **Part 7: Deployment Checklist**

### **7.1 Pre-Deployment Verification**

```
Database:
☐ pgvector extension enabled
☐ Embedding columns added
☐ Indexes created
☐ Search functions deployed
☐ All 865 parts have embeddings
☐ Test queries return expected results

Backend:
☐ Environment variables configured
☐ OpenAI API key valid and funded
☐ Rate limiting tested
☐ Error handling verified
☐ Fallback to traditional search works
☐ Cost tracking implemented

Testing:
☐ All API endpoints return correct responses
☐ Intent classification accuracy >85%
☐ Hybrid search routing works correctly
☐ Performance targets met (<800ms)
☐ Rate limiting blocks excess requests
☐ Edge cases handled gracefully

Monitoring:
☐ Cost tracking operational
☐ Error logging configured
☐ Performance metrics collected
☐ Alert system tested
```

### **7.2 Deployment Steps**

```bash
# 1. Deploy database changes (Production Supabase)
# Run all SQL scripts in Supabase SQL Editor
# Verify with test queries

# 2. Generate embeddings (Production)
npm run generate-embeddings:prod
# Wait for completion (~30 seconds)
# Verify: SELECT COUNT(*) FROM parts WHERE description_embedding IS NOT NULL

# 3. Deploy backend code (Vercel)
git add .
git commit -m "feat: Add AI search with hybrid strategy"
git push origin main
# Vercel auto-deploys

# 4. Smoke test in production
curl -X POST https://acrautomotive.com/api/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query":"rodamientos Honda Civic 2018"}'
# Verify: Returns 200 OK with results

# 5. Monitor for 24 hours
# Check error rates, response times, costs
# Be ready to rollback if issues arise
```

### **7.3 Rollback Procedure**

**If issues arise in production**:

```bash
# Option 1: Rollback Vercel deployment
# Vercel Dashboard → Deployments → Previous deployment → Promote to Production

# Option 2: Feature flag disable
# Set NEXT_PUBLIC_AI_SEARCH_ENABLED=false in Vercel env vars
# Redeploy

# Option 3: Database rollback (if embeddings causing issues)
# Run rollback SQL script (see section 4.3)
# Traditional search continues working normally
```

---

## 📈 **Part 8: Success Metrics**

### **8.1 Technical Metrics**

```typescript
interface TechnicalMetrics {
  // Performance
  avgResponseTime: number        // Target: <800ms
  p95ResponseTime: number        // Target: <1200ms
  
  // Reliability
  uptime: number                 // Target: >99%
  errorRate: number              // Target: <5%
  fallbackRate: number           // Target: <10%
  
  // Search Quality
  intentAccuracy: number         // Target: >85%
  searchSuccessRate: number      // Target: >90%
  semanticSearchUsage: number    // Monitor trend
  
  // Cost
  dailyCost: number              // Target: <$0.35
  costPerSearch: number          // Target: <$0.002
}
```

### **8.2 User Experience Metrics**

```typescript
interface UXMetrics {
  // Adoption
  aiSearchUsage: number          // Searches via AI endpoint
  traditionalSearchUsage: number // Searches via traditional
  aiAdoptionRate: number         // AI / (AI + Traditional)
  
  // Engagement
  avgTurnsPerConversation: number // Target: <2
  clarificationRate: number       // Target: <30%
  completionRate: number          // Target: >80%
  
  // Satisfaction
  resultsFoundRate: number        // Target: >90%
  timeToResult: number            // Target: <10 seconds
}
```

### **8.3 Business Metrics**

```typescript
interface BusinessMetrics {
  // Search Improvements
  searchSuccessImprovement: number // Compare AI vs traditional
  noResultsReduction: number       // Fewer "no results" scenarios
  
  // Efficiency
  avgSearchTime: number            // Faster than dropdown navigation?
  searchesPerSession: number       // Fewer searches needed?
  
  // Cost/Benefit
  monthlyCost: number              // Total AI costs
  costPerSuccessfulSearch: number  // Cost efficiency
  roiEstimate: number              // Business value vs cost
}
```

---

## 🎯 **Summary: What Phase 4 Delivers**

### **Database Enhancements**
✅ pgvector extension for semantic search  
✅ Embedding columns on parts table  
✅ Optimized indexes for fast similarity search  
✅ Hybrid search functions combining traditional + semantic

### **Embeddings Infrastructure**
✅ Migration script for 865 existing parts (~$0.002 cost)  
✅ Automated embedding generation for new parts  
✅ Metadata tracking for embedding freshness

### **Backend API**
✅ New `/api/ai/search` endpoint with intelligent routing  
✅ Hybrid search strategy (traditional first, semantic fallback)  
✅ Rate limiting to prevent abuse  
✅ Comprehensive error handling with fallbacks  
✅ TypeScript interfaces for type safety

### **Development Setup**
✅ Separate test/prod database configuration  
✅ Environment variable management  
✅ Testing strategy for AI features  
✅ Cost tracking and monitoring

### **Production Readiness**
✅ Deployment checklist  
✅ Rollback procedures  
✅ Performance benchmarks  
✅ Success metrics defined

---

## 🔜 **Next Phase: Frontend Integration**

With Phase 4 complete, the backend infrastructure is ready. Phase 5 will cover:
- React components for AI search input
- Toggle mechanism between AI/traditional search
- TanStack Query integration for state management
- Loading states, error boundaries, and UX polish
- Mobile optimization for tablet interfaces

The foundation is now solid for building the user-facing AI search experience!