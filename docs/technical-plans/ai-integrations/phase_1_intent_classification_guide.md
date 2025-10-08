# Phase 1: Intent Classification System for ACR Automotive
## AI-Powered Natural Language Query Processing

---

## 🎯 **Overview**

The Intent Classification System acts as a **traffic director** for ACR Automotive's AI-enhanced search interface. It analyzes natural language user queries and converts them into structured parameters that map to existing database search APIs.

**Core Function**: Convert natural language → structured data → existing API calls

**Example**:
```
User: "I need brake pads for 2018 Honda Civic"
↓
Intent: vehicle_search
Parameters: { make: "Honda", model: "Civic", year: 2018, part_hint: "brake_pads" }
↓
API Call: /api/public/parts?make=Honda&model=Civic&year=2018
```

---

## 🗂️ **Intent Categories for ACR (MAZA-Only Shop)**

### **Valid Automotive Intents**

#### **1. sku_lookup**
**Purpose**: User provides specific MAZA part numbers (ACR or competitor)
**Maps to**: `/api/public/parts?sku_term={sku}`

**User Examples**:
- "¿Tienen ACR-MAZA-001?"
- "¿Cuál es el equivalente de TM-BRK-9847?"
- "Busco la parte GSP-12345"

#### **2. vehicle_search**
**Purpose**: User asks for MAZA parts that fit specific vehicles
**Maps to**: `/api/public/parts?make={make}&model={model}&year={year}`

**User Examples**:
- "Rodamientos para Honda Civic 2018"
- "¿Qué MAZA tienen para Toyota Camry 2015-2020?"
- "Baleros para Ford F-150 2019"

#### **3. part_category_search**
**Purpose**: User asks about MAZA parts in general
**Maps to**: General MAZA search with optional filters

**User Examples**:
- "Enséñenme todos sus MAZA"
- "¿Qué rodamientos de rueda manejan?"
- "¿Tienen baleros?"

#### **4. cross_reference_lookup**
**Purpose**: User mentions competitor MAZA part numbers seeking ACR equivalents
**Maps to**: `/api/public/parts?sku_term={competitor_sku}`

**User Examples**:
- "¿Cuál es su equivalente para National 513137?"
- "¿Manejan algo como TM-512244?"
- "Necesito reemplazo para GSP-104075"

#### **5. compatibility_check**
**Purpose**: User asks if specific MAZA parts fit their vehicle
**Maps to**: Combination of vehicle search + part validation

**User Examples**:
- "¿ACR-MAZA-001 sirve para Honda Civic 2018?"
- "¿Este rodamiento funciona en Toyota Camry 2020?"
- "¿Es compatible esta parte con Ford F-150?"

#### **6. general_inventory**
**Purpose**: User asks about general MAZA inventory
**Maps to**: Broad MAZA search or informational responses

**User Examples**:
- "¿Qué manejan?"
- "¿Tienen partes para Honda?"
- "¿Qué marcas tienen?"

### **Invalid Intents (Redirection Required)**

#### **7. non_maza_parts**
**Purpose**: User asks for parts ACR doesn't carry (brake pads, rotors, etc.)
**Action**: Polite redirection to MAZA products

**User Examples**:
- "Necesito frenos para Honda Civic"
- "¿Tienen pastillas de freno?"
- "Busco amortiguadores"

**Expected Output**:
```json
{
  "intent": "non_maza_parts",
  "confidence": 0.90,
  "should_respond": true,
  "redirect_message": "Somos especialistas en MAZA (rodamientos de rueda). ¿Necesitas rodamientos para tu vehículo? Puedo ayudarte a encontrar la parte correcta."
}
```

#### **8. off_topic**
**Purpose**: Queries not related to automotive parts
**Action**: Polite rejection with redirection

**User Examples**:
- "¿Qué tal el clima?"
- "Cuéntame un chiste"
- "¿Cómo estás?"

#### **9. unsupported**
**Purpose**: Valid automotive queries but outside ACR's scope
**Action**: Acknowledge but redirect to supported functions

**User Examples**:
- "¿Cuánto cuesta la instalación?"
- "¿Dónde puedo instalar esto?"
- "¿Qué garantía tiene?"

> **📋 FUTURE EXTENSION NOTE**: 
> When expanding beyond MAZA parts:
> 1. **Promote "non_maza_parts" to valid intents** (become "brake_parts", "suspension_parts", etc.)
> 2. **Add new intent categories** for each part type ACR begins carrying
> 3. **Update redirect logic** to check actual inventory instead of blanket MAZA-only responses
> 4. **Expand parameter extraction** to handle multiple part categories simultaneously

---

## 🧠 **Domain Knowledge Mapping**

### **ACR Part Type Translation (MAZA-Only Shop)**

> **Current Reality**: ACR is a MAZA-only shop. 99% of users search in Mexican Spanish. Database stores Spanish values, English only for i18n UI display.

```
Mexican Spanish User Terms → MAZA (Only Available Category):

VALID MAZA TERMS (Wheel Bearing Assemblies):
- "rodamientos de rueda" → MAZA
- "rodamiento de bola" → MAZA  
- "conjuntos de cubo" → MAZA
- "mazas" → MAZA
- "rodamientos delanteros/traseros" → MAZA
- "baleros de rueda" → MAZA (Mexican colloquial)
- "rodamientos" → MAZA (generic bearing term)

INVALID TERMS (Polite Redirection Needed):
- "frenos" → Not available (redirect to MAZA)
- "pastillas de freno" → Not available (redirect to MAZA)
- "discos de freno" → Not available (redirect to MAZA)
- "balatas" → Not available (redirect to MAZA)
- "amortiguadores" → Not available (redirect to MAZA)

Common Variations & Regional Terms:
- "baleros" = Mexican term for bearings (generic)
- "refacciones" = general term for auto parts
- "autopartes" = auto parts (generic)
```

> **📋 FUTURE EXTENSION NOTE**: 
> When ACR expands to carry additional part types (DISCO, BALERO, etc.), update this mapping section to include:
> 1. **New part type mappings** (e.g., "frenos" → "DISCO")
> 2. **Enhanced intent classification** to distinguish between part types
> 3. **Updated system prompts** to handle multiple categories
> 4. **Modified rejection logic** (currently rejects non-MAZA, future: check availability)
> 
> The current MAZA-only structure provides a clean foundation that can be easily extended by adding new mapping categories and updating the intent classification logic.

### **Vehicle Brand Mapping**
```
Supported Makes:
- Honda, Toyota, Ford, Nissan, Chevrolet
- Year ranges: typically 2010-2025
- Popular models: Civic, Camry, F-150, Sentra, Silverado

Common Variations:
- "Toyota Camry" = "TOYOTA CAMRY"
- "Honda Civic" = "HONDA CIVIC"  
- "Ford F150" = "Ford F-150"
```

### **Competitor Brand Recognition**
```
Common Competitor Brands:
- TM, GSP, NATIONAL, SKF, FAG, TIMKEN
- Pattern recognition for part numbers:
  - TM-XXX-#### format
  - GSP-##### format  
  - NATIONAL-##### format
```

---

## 🏗️ **Implementation Architecture**

### **System Flow**
```typescript
1. User Input → Intent Classification (AI)
2. Intent Classification → Parameter Extraction  
3. Parameter Validation → API Route Selection
4. API Call → Results Processing
5. Results → Natural Language Response (AI)
```

### **Core Functions**

#### **Intent Classifier Function**
```typescript
async function classifyIntent(userQuery: string): Promise<IntentResult> {
  // AI processes query with domain-specific prompt
  // Returns structured intent classification
}
```

#### **Router Function**
```typescript
async function routeToAPI(intentResult: IntentResult): Promise<SearchResults> {
  switch(intentResult.intent) {
    case 'vehicle_search':
      return await handleVehicleSearch(intentResult.parameters)
    case 'sku_lookup':
      return await handleSKULookup(intentResult.parameters)
    // ... other cases
  }
}
```

#### **Response Generator**
```typescript
async function generateResponse(results: SearchResults, originalQuery: string): Promise<string> {
  // AI formats results into natural language response
  // Maintains automotive domain context
}
```

### **Integration with Existing ACR APIs**

**No changes required to existing APIs**:
- `/api/public/parts?sku_term={sku}`
- `/api/public/parts?make={make}&model={model}&year={year}`
- `usePublicParts()` React hook
- `search_by_sku()` and `search_by_vehicle()` RPC functions

**AI layer simply converts**:
```
Natural Language → Structured Parameters → Existing API Calls
```

---

## 🎓 **Prompt Engineering Strategy**

### **System Prompt Structure (MAZA-Only Shop)**
```typescript
const INTENT_CLASSIFICATION_PROMPT = `
You are an intent classifier for ACR Automotive, a Mexican MAZA parts specialist.
Users will primarily search in Mexican Spanish.

IMPORTANT: ACR ONLY CARRIES MAZA PARTS (wheel bearings, hub assemblies, ball bearings).

DOMAIN KNOWLEDGE:
- Part Types: MAZA ONLY (rodamientos de rueda, conjuntos de cubo, baleros de rueda)
- Supported Vehicles: Honda, Toyota, Ford, Nissan, Chevrolet (2010-2025)
- Competitor Brands: TM, GSP, NATIONAL, SKF, FAG, TIMKEN

MEXICAN SPANISH MAZA TERMS:
- "rodamientos" = wheel bearings (MAZA)
- "baleros" = bearings (MAZA)
- "mazas" = hub assemblies (MAZA)
- "rodamientos de rueda" = wheel bearings (MAZA)

NON-MAZA REQUESTS (redirect politely):
- "frenos" = brake parts (NOT AVAILABLE - redirect to MAZA)
- "pastillas" = brake pads (NOT AVAILABLE - redirect to MAZA)
- "amortiguadores" = shocks (NOT AVAILABLE - redirect to MAZA)

VALID INTENTS: [sku_lookup, vehicle_search, part_category_search, cross_reference_lookup, compatibility_check, general_inventory]
REDIRECT INTENTS: [non_maza_parts] 
INVALID INTENTS: [off_topic, unsupported]

RESPONSE FORMAT: JSON with intent, confidence, parameters, reasoning

Analyze this user query and classify intent...
`
```

### **Basic Prompt Engineering Examples**

#### **Intent Classification Examples**
```typescript
// Valid MAZA request:
User: "Necesito rodamientos para Honda Civic 2018"
AI Response: {
  "intent": "vehicle_search",
  "confidence": 0.92,
  "parameters": {
    "make": "Honda",
    "model": "Civic", 
    "year": 2018,
    "part_type": "MAZA"
  }
}

// Non-MAZA request (redirect):
User: "Necesito frenos para Honda Civic"
AI Response: {
  "intent": "non_maza_parts",
  "confidence": 0.88,
  "should_respond": true,
  "redirect_message": "Somos especialistas en MAZA (rodamientos de rueda). ¿Necesitas rodamientos para tu Honda Civic?"
}

// Cross-reference query:
User: "¿Tienen equivalente para TM-12345?"
AI Response: {
  "intent": "cross_reference_lookup", 
  "confidence": 0.90,
  "parameters": {
    "competitor_sku": "TM-12345",
    "competitor_brand": "TM"
  }
}
```

#### **Response Generation Examples**
```typescript
// Successful MAZA search:
"Sí, tenemos rodamientos para Honda Civic 2018. Encontré 3 opciones: ACR-MAZA-001, ACR-MAZA-002, y ACR-MAZA-003."

// Cross-reference found:
"El equivalente ACR para TM-12345 es ACR-MAZA-001. Compatible con Toyota Camry 2015-2020."

// Non-MAZA redirect:
"Somos especialistas en MAZA (rodamientos de rueda). ¿Necesitas rodamientos para tu vehículo? Puedo ayudarte a encontrar la parte correcta."

// Off-topic rejection:
"Soy el asistente de MAZA de ACR. Puedo ayudarte a encontrar rodamientos de rueda, verificar compatibilidad, o buscar referencias cruzadas. ¿Qué rodamiento necesitas?"
```

> **📋 FUTURE EXTENSION NOTE**: 
> When ACR expands beyond MAZA:
> 1. **Update system prompt** to include new part types and their Spanish terms
> 2. **Modify redirect logic** from "we only carry MAZA" to "checking availability for requested part type"
> 3. **Add new intent classifications** for each part category (brake_parts, suspension_parts, etc.)
> 4. **Expand response templates** to handle multiple part types in single responses
You are an intent classifier for ACR Automotive, a Mexican auto parts distributor.

DOMAIN KNOWLEDGE:
- Part Types: MAZA (wheel bearings), DISCO (brake components), BALERO (individual bearings)
- Supported Vehicles: Honda, Toyota, Ford, Nissan, Chevrolet (2010-2025)
- Competitor Brands: TM, GSP, NATIONAL, SKF, FAG, TIMKEN

VALID INTENTS: [list of 6 valid intents]
INVALID INTENTS: [off_topic, unsupported]

RESPONSE FORMAT: JSON with intent, confidence, parameters, reasoning

Analyze user query and classify intent...
`
```

### **Response Validation**
- Confidence threshold: >0.7 for auto-processing
- Confidence 0.4-0.7: Ask clarifying questions
- Confidence <0.4: Default to off_topic

---

## 🔄 **Error Handling & Fallbacks**

### **Fallback Strategy**
1. **AI Classification Fails** → Default to traditional search interface
2. **Low Confidence** → Ask clarifying questions
3. **No Results Found** → Suggest alternative searches
4. **API Errors** → Graceful degradation with helpful messages

### **Confidence Thresholds**
```typescript
if (confidence > 0.8) {
  // Auto-execute intent
} else if (confidence > 0.5) {
  // Ask for confirmation: "Did you mean...?"
} else {
  // Fallback to traditional search or clarifying questions
}
```

---

## 🚀 **Development Phases**

### **Phase 1: Basic Intent Classification**
- Implement core 6 intent types
- Basic domain knowledge mapping
- Integration with existing search APIs

### **Phase 2: Enhanced Recognition**
- Spanish language support
- Competitor brand detection
- Fuzzy matching improvements

### **Phase 3: Conversational Flow**
- Multi-turn conversations
- Clarifying questions
- Context retention

### **Phase 4: Advanced Features**
- Learning from user interactions
- Dynamic confidence adjustment
- Performance optimization

---

## 💡 **Success Metrics**

### **Technical Metrics**
- Intent classification accuracy: >90%
- Response time: <300ms total (including AI processing)
- API error rate: <5%

### **Business Metrics**
- Search success rate improvement
- User satisfaction with natural language interface
- Reduction in "no results found" scenarios

### **User Experience Metrics**
- Query completion rate
- Time to find desired parts
- Preference: AI vs traditional search

---

This intent classification system serves as the foundation for ACR's AI-enhanced search interface, converting natural language queries into actionable database searches while maintaining strict domain boundaries and preserving existing system architecture.