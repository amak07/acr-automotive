---
title: Diagram Examples
description: Examples of Mermaid diagrams for documentation
---

# Diagram Examples

This page demonstrates Mermaid diagram support in our documentation.

## Flowchart Example

```mermaid
graph TD
    A[User Request] --> B{Search Type?}
    B -->|SKU| C[Direct SKU Lookup]
    B -->|Cross-Reference| D[Cross-Reference Search]
    C --> E[Return Part Details]
    D --> F[Find Matching Parts]
    F --> E
```

## Sequence Diagram Example

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Next.js API
    participant DB as Supabase

    U->>FE: Enter search query
    FE->>API: POST /api/search
    API->>DB: Query parts table
    DB-->>API: Return results
    API-->>FE: JSON response
    FE-->>U: Display parts
```

## Entity Relationship Diagram

```mermaid
erDiagram
    PARTS ||--o{ VEHICLE_APPLICATIONS : has
    PARTS ||--o{ CROSS_REFERENCES : has
    PARTS ||--o{ PART_IMAGES : has
    PARTS {
        uuid id PK
        string sku
        string description
        string brand
    }
    VEHICLE_APPLICATIONS {
        uuid id PK
        uuid part_id FK
        string make
        string model
        string year_range
    }
    CROSS_REFERENCES {
        uuid id PK
        uuid part_id FK
        string ref_brand
        string ref_number
    }
```

## C4 Context Diagram Style

```mermaid
graph TB
    subgraph "ACR Automotive System"
        WebApp[Web Application<br/>Next.js]
        API[API Routes<br/>Next.js]
        DB[(Database<br/>Supabase PostgreSQL)]
        Storage[(File Storage<br/>Supabase Storage)]
    end

    User[Parts Counter Staff] --> WebApp
    Admin[Administrator] --> WebApp
    WebApp --> API
    API --> DB
    API --> Storage
```

## Usage

To add a diagram to any documentation page, use a mermaid code block:

````markdown
```mermaid
graph TD
    A[Start] --> B[End]
```
````

The diagram will automatically render with theme support (light/dark mode).
