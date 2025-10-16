# ACR 3D Model Generation - Complete Technical Implementation

**Architecture**: Next.js (Vercel) + Railway Worker + Supabase + Meshy AI
**Job Queue**: pg-boss (PostgreSQL-based)
**Optimization**: gltf-pipeline (Phase 1) → Blender (Phase 2)
**Real-time Updates**: Supabase Realtime + Polling Fallback

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel (Next.js)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Admin UI: Upload images, select angles, trigger gen     │  │
│  │  API Routes: Thin layer (validation, queue submission)   │  │
│  │  Public UI: Display 3D models with model-viewer          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (Database as Queue)
                         
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                          │
│  - parts, part_images, model_generation_jobs tables             │
│  - pg-boss job queue tables                                      │
│  - Supabase Storage (images + GLB files)                         │
│  - Realtime subscriptions (WebSocket updates)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (pg-boss polls for jobs)
                         
┌─────────────────────────────────────────────────────────────────┐
│                Railway Worker (Node.js 24/7)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  pg-boss worker loop (event-driven, no polling)          │  │
│  │  1. Check Meshy AI status                                 │  │
│  │  2. Download GLB when ready                               │  │
│  │  3. Optimize (gltf-pipeline or Blender)                   │  │
│  │  4. Upload to Supabase Storage                            │  │
│  │  5. Update database → triggers realtime update            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         ↓
                         
┌─────────────────────────────────────────────────────────────────┐
│                    Meshy AI (External)                           │
│  Multi-image to 3D generation service                            │
│  Input: 1-4 image URLs                                           │
│  Output: GLB file with textures                                  │
│  Time: 2-5 minutes                                               │
│  Cost: 15 credits (~$0.24) per model                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema

### **1.1 Multi-Image Support**

```sql
-- ============================================================================
-- TABLE: part_images (Multi-image support for parts)
-- ============================================================================
CREATE TABLE part_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    
    -- Image storage and metadata
    image_url TEXT NOT NULL,
    storage_path TEXT,  -- Path in Supabase Storage
    file_size_bytes INTEGER,
    width_px INTEGER,
    height_px INTEGER,
    mime_type VARCHAR(50) DEFAULT 'image/jpeg',
    
    -- UI display configuration
    display_order INTEGER NOT NULL DEFAULT 0,  -- 0 = primary image
    alt_text TEXT,
    caption TEXT,
    
    -- Angle metadata (for 3D generation selection)
    angle_label VARCHAR(20),  -- 'front', 'back', 'left', 'right', 'top', 'bottom'
    
    -- 3D model generation tracking
    is_selected_for_3d_generation BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique ordering per part
    CONSTRAINT unique_part_display_order UNIQUE(part_id, display_order)
);

-- Indexes for performance
CREATE INDEX idx_part_images_part_id ON part_images(part_id);
CREATE INDEX idx_part_images_part_id_order ON part_images(part_id, display_order);
CREATE INDEX idx_part_images_selected_for_3d ON part_images(part_id, is_selected_for_3d_generation);
```

### **1.2 Parts Table Extensions**

```sql
-- Add 3D model columns to parts table
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS model_status VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS model_3d_url TEXT,
ADD COLUMN IF NOT EXISTS model_generation_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS model_generation_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS model_generation_error TEXT,
ADD COLUMN IF NOT EXISTS meshy_task_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS primary_image_url TEXT;

-- Create index for model status filtering
CREATE INDEX IF NOT EXISTS idx_parts_model_status ON parts(model_status);

-- Status values: 'none', 'queued', 'processing', 'optimizing', 'complete', 'failed'
```

### **1.3 Job Tracking Table**

```sql
-- ============================================================================
-- TABLE: model_generation_jobs (Job tracking and debugging)
-- ============================================================================
CREATE TABLE model_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    
    -- Meshy AI integration
    meshy_task_id VARCHAR(100),
    
    -- Job status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Values: 'pending', 'submitted', 'processing', 'optimizing', 'complete', 'failed'
    
    -- Input configuration
    selected_image_ids UUID[],  -- Array of part_images.id
    selected_image_urls TEXT[], -- URLs used for generation
    selected_image_metadata JSONB, -- Store angle labels: [{ id, url, angle }]
    generation_config JSONB,    -- Store Meshy AI parameters
    
    -- Output tracking
    raw_model_url TEXT,         -- Original Meshy output URL
    optimized_model_url TEXT,   -- Final optimized URL in CDN
    raw_file_size_bytes INTEGER,
    optimized_file_size_bytes INTEGER,
    polycount INTEGER,
    
    -- Resource tracking
    meshy_credits_used INTEGER DEFAULT 15,
    processing_duration_seconds INTEGER,
    optimization_duration_seconds INTEGER,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    processing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_model_generation_jobs_part_id ON model_generation_jobs(part_id);
CREATE INDEX idx_model_generation_jobs_status ON model_generation_jobs(status);
CREATE INDEX idx_model_generation_jobs_meshy_task_id ON model_generation_jobs(meshy_task_id);
```

### **1.4 pg-boss Setup**

```sql
-- pg-boss creates its own tables automatically in 'pgboss' schema
-- No manual setup needed - just run boss.start() and it creates:
-- - pgboss.job
-- - pgboss.archive
-- - pgboss.schedule
-- - pgboss.subscription
-- - pgboss.version
```

### **1.5 Enable Supabase Realtime**

```sql
-- Enable realtime for parts table (for status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE parts;

-- Enable realtime for model_generation_jobs (for progress updates)
ALTER PUBLICATION supabase_realtime ADD TABLE model_generation_jobs;
```

### **1.6 Migration from Single Image**

```sql
-- Migrate existing single image_url to part_images table
INSERT INTO part_images (part_id, image_url, display_order, created_at)
SELECT id, image_url, 0, created_at
FROM parts
WHERE image_url IS NOT NULL;

-- Update primary_image_url for caching
UPDATE parts p
SET primary_image_url = (
    SELECT image_url 
    FROM part_images 
    WHERE part_id = p.id 
    ORDER BY display_order 
    LIMIT 1
);

-- Optional: Drop old image_url column after verification
-- ALTER TABLE parts DROP COLUMN image_url;
```

---

## Phase 2: Environment Configuration

### **2.1 Vercel Environment Variables**

```bash
# .env.local (Vercel)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Server-side only

# Meshy AI
MESHY_API_KEY=mesh_xxx

# Admin Authentication (existing)
ADMIN_PASSWORD_HASH=...

# Database (for pg-boss in API routes if needed)
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
```

### **2.2 Railway Environment Variables**

```bash
# Railway Service

# Supabase (same as Vercel)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Meshy AI
MESHY_API_KEY=mesh_xxx

# Database (for pg-boss)
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
```

---

## Phase 3: Railway Worker Implementation

### **3.1 Project Structure**

```
acr-3d-worker/          # New repo (separate from main Next.js app)
│
├── package.json
├── index.js            # Main worker entry point
├── lib/
│   ├── pg-boss.js     # pg-boss client setup
│   ├── meshy.js       # Meshy API client
│   ├── supabase.js    # Supabase client
│   └── optimize.js    # Optimization logic (gltf-pipeline)
├── .env.example
├── .gitignore
└── README.md
```

### **3.2 package.json**

```json
{
  "name": "acr-3d-worker",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "pg-boss": "^9.0.3",
    "gltf-pipeline": "^4.1.0",
    "node-fetch": "^3.3.2"
  }
}
```

### **3.3 Main Worker (index.js)**

```javascript
import PgBoss from 'pg-boss';
import { createClient } from '@supabase/supabase-js';
import { checkMeshyStatus, downloadGLB } from './lib/meshy.js';
import { optimizeGLB } from './lib/optimize.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  schema: 'pgboss',
});

await boss.start();
console.log('✅ pg-boss started');

// Register job handler
await boss.work('process-3d-model', { teamSize: 5 }, async (job) => {
  const { jobId, partId, meshyTaskId } = job.data;
  
  console.log(`[Job ${jobId}] Processing...`);
  
  try {
    // Update status: processing
    await updateJobStatus(jobId, 'processing');
    
    // 1. Check Meshy AI status
    const meshyStatus = await checkMeshyStatus(meshyTaskId);
    
    if (meshyStatus.status === 'PENDING' || meshyStatus.status === 'IN_PROGRESS') {
      // Not ready yet - throw error to retry later
      throw new Error('Meshy still processing');
    }
    
    if (meshyStatus.status === 'FAILED' || meshyStatus.status === 'EXPIRED') {
      throw new Error(`Meshy failed: ${meshyStatus.task_error?.message}`);
    }
    
    if (meshyStatus.status === 'SUCCEEDED') {
      const glbUrl = meshyStatus.model_urls?.glb;
      if (!glbUrl) throw new Error('No GLB URL in response');
      
      // 2. Download GLB
      console.log(`[Job ${jobId}] Downloading GLB...`);
      const glbBuffer = await downloadGLB(glbUrl);
      
      // 3. Optimize with gltf-pipeline
      console.log(`[Job ${jobId}] Optimizing...`);
      await updateJobStatus(jobId, 'optimizing');
      const optimizedBuffer = await optimizeGLB(glbBuffer);
      
      // 4. Upload to Supabase Storage
      console.log(`[Job ${jobId}] Uploading...`);
      const fileName = `3d-models/${partId}.glb`;
      const { error: uploadError } = await supabase.storage
        .from('acr-part-images')
        .upload(fileName, optimizedBuffer, {
          contentType: 'model/gltf-binary',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('acr-part-images')
        .getPublicUrl(fileName);
      
      // 5. Update database (triggers realtime update)
      await supabase.from('model_generation_jobs').update({
        status: 'complete',
        raw_model_url: glbUrl,
        optimized_model_url: publicUrl,
        raw_file_size_bytes: glbBuffer.length,
        optimized_file_size_bytes: optimizedBuffer.length,
        completed_at: new Date().toISOString(),
      }).eq('id', jobId);
      
      await supabase.from('parts').update({
        model_status: 'complete',
        model_3d_url: publicUrl,
        model_generation_completed_at: new Date().toISOString(),
      }).eq('id', partId);
      
      console.log(`✅ [Job ${jobId}] Complete!`);
      return { success: true };
    }
  } catch (error) {
    console.error(`❌ [Job ${jobId}] Failed:`, error.message);
    
    // Update job with error
    await supabase.from('model_generation_jobs').update({
      status: 'failed',
      error_message: error.message,
      retry_count: job.data.retry_count + 1,
    }).eq('id', jobId);
    
    await supabase.from('parts').update({
      model_status: 'failed',
      model_generation_error: error.message,
    }).eq('id', partId);
    
    throw error; // pg-boss will retry based on config
  }
});

async function updateJobStatus(jobId, status) {
  await supabase.from('model_generation_jobs').update({
    status,
    [`${status}_started_at`]: new Date().toISOString(),
  }).eq('id', jobId);
}

console.log('🚀 Worker ready, waiting for jobs...');

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await boss.stop();
  process.exit(0);
});
```

### **3.4 Meshy Client (lib/meshy.js)**

```javascript
const MESHY_API_KEY = process.env.MESHY_API_KEY;
const MESHY_API_BASE = 'https://api.meshy.ai/v2';

export async function checkMeshyStatus(taskId) {
  const response = await fetch(`${MESHY_API_BASE}/image-to-3d/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${MESHY_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Meshy API error: ${response.status}`);
  }
  
  return response.json();
}

export async function downloadGLB(url) {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download GLB: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### **3.5 Optimization (lib/optimize.js)**

```javascript
import { processGlb } from 'gltf-pipeline';

export async function optimizeGLB(inputBuffer) {
  const options = {
    dracoOptions: {
      compressionLevel: 7, // 0-10, higher = smaller file
    },
  };
  
  const results = await processGlb(inputBuffer, options);
  return Buffer.from(results.glb);
}
```

### **3.6 Railway Deployment**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd acr-3d-worker
railway init

# Add environment variables via dashboard
# (Railway opens browser automatically)

# Deploy
railway up

# View logs
railway logs
```

---

## Phase 4: Next.js API Routes (Vercel)

### **4.1 Upload Images API**

```typescript
// app/api/admin/3d-models/upload-images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const partId = formData.get('partId') as string;

    if (!partId) {
      return NextResponse.json({ error: 'Part ID required' }, { status: 400 });
    }

    // Get existing image count
    const { count } = await supabase
      .from('part_images')
      .select('*', { count: 'exact', head: true })
      .eq('part_id', partId);

    const existingCount = count || 0;

    // Extract image files
    const imageFiles: File[] = [];
    for (let i = 0; i < 6; i++) {
      const file = formData.get(`image${i}`) as File | null;
      if (file) imageFiles.push(file);
    }

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (existingCount + imageFiles.length > 6) {
      return NextResponse.json(
        { error: `Cannot exceed 6 total images (currently ${existingCount})` },
        { status: 400 }
      );
    }

    const uploadedImages = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      // Optimize image with sharp
      const buffer = Buffer.from(await file.arrayBuffer());
      const optimized = await sharp(buffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Get image metadata
      const metadata = await sharp(buffer).metadata();

      // Upload to Supabase Storage
      const fileName = `part-images/${partId}/${Date.now()}-${i}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('acr-part-images')
        .upload(fileName, optimized, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('acr-part-images')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('part_images')
        .insert({
          part_id: partId,
          image_url: publicUrl,
          storage_path: fileName,
          file_size_bytes: optimized.length,
          width_px: metadata.width,
          height_px: metadata.height,
          display_order: existingCount + i,
        });

      if (dbError) throw dbError;

      uploadedImages.push(publicUrl);
    }

    return NextResponse.json({
      success: true,
      uploadedCount: imageFiles.length,
      urls: uploadedImages,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
```

### **4.2 Generate 3D Model API**

```typescript
// app/api/admin/3d-models/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import PgBoss from 'pg-boss';

// Initialize Meshy client
const MESHY_API_KEY = process.env.MESHY_API_KEY!;
const MESHY_API_BASE = 'https://api.meshy.ai/v2';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { partId, selectedAngles } = await request.json();
    
    // selectedAngles format:
    // { front: 'image-id-1', back: 'image-id-2', left: 'image-id-3', right: 'image-id-4' }

    const selectedIds = Object.values(selectedAngles).filter(Boolean) as string[];

    if (selectedIds.length < 2) {
      return NextResponse.json(
        { error: 'Select at least 2 images' },
        { status: 400 }
      );
    }

    if (selectedIds.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 images allowed' },
        { status: 400 }
      );
    }

    // Get selected images with angle metadata
    const { data: images, error: imagesError } = await supabase
      .from('part_images')
      .select('id, image_url')
      .in('id', selectedIds);

    if (imagesError || !images || images.length === 0) {
      throw new Error('Failed to fetch selected images');
    }

    // Build metadata with angle labels
    const imageMetadata = selectedIds.map(id => {
      const image = images.find(img => img.id === id);
      const angle = Object.keys(selectedAngles).find(
        key => selectedAngles[key] === id
      );
      return {
        id,
        url: image?.image_url,
        angle,
      };
    });

    const imageUrls = imageMetadata.map(img => img.url);

    // Update part status
    await supabase
      .from('parts')
      .update({
        model_status: 'queued',
        model_generation_started_at: new Date().toISOString(),
      })
      .eq('id', partId);

    // Create generation job record
    const { data: job, error: jobError } = await supabase
      .from('model_generation_jobs')
      .insert({
        part_id: partId,
        status: 'pending',
        selected_image_ids: selectedIds,
        selected_image_urls: imageUrls,
        selected_image_metadata: imageMetadata, // Store angle labels
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Submit to Meshy AI
    try {
      const meshyResponse = await fetch(`${MESHY_API_BASE}/image-to-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MESHY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_urls: imageUrls,
          enable_pbr: true,
          target_polycount: 150000,
          topology: 'quad',
          should_remesh: true,
        }),
      });

      if (!meshyResponse.ok) {
        throw new Error(`Meshy API error: ${await meshyResponse.text()}`);
      }

      const { result: meshyTaskId } = await meshyResponse.json();

      // Update job with Meshy task ID
      await supabase
        .from('model_generation_jobs')
        .update({
          meshy_task_id: meshyTaskId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      await supabase
        .from('parts')
        .update({
          model_status: 'processing',
          meshy_task_id: meshyTaskId,
        })
        .eq('id', partId);

      // Submit to pg-boss queue (Railway worker will pick it up)
      const boss = new PgBoss(process.env.DATABASE_URL!);
      await boss.start();
      
      await boss.send('process-3d-model', {
        jobId: job.id,
        partId: partId,
        meshyTaskId: meshyTaskId,
        retry_count: 0,
      }, {
        retryLimit: 5,
        retryDelay: 60,  // 1 minute between retries
        retryBackoff: true,  // Exponential backoff
        expireInMinutes: 120,  // Give up after 2 hours
      });
      
      await boss.stop();

      return NextResponse.json({
        success: true,
        jobId: job.id,
        meshyTaskId,
        message: '3D model generation started',
      });

    } catch (meshyError) {
      // Update job status to failed
      await supabase
        .from('model_generation_jobs')
        .update({
          status: 'failed',
          error_message: meshyError instanceof Error ? meshyError.message : 'Unknown error',
        })
        .eq('id', job.id);

      await supabase
        .from('parts')
        .update({
          model_status: 'failed',
          model_generation_error: meshyError instanceof Error ? meshyError.message : 'Unknown error',
        })
        .eq('id', partId);

      throw meshyError;
    }

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to start 3D model generation' },
      { status: 500 }
    );
  }
}
```

### **4.3 Status Check API (for polling fallback)**

```typescript
// app/api/admin/parts/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data: part, error } = await supabase
    .from('parts')
    .select('model_status, model_3d_url, model_generation_error')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    model_status: part.model_status,
    model_3d_url: part.model_3d_url,
    error: part.model_generation_error,
  });
}
```

---

## Phase 5: Admin UI Components

### **5.1 Image Upload & Management**

```typescript
// components/admin/part-details/ImageManagement.tsx
'use client';

import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, GripVertical, Trash2 } from 'lucide-react';

interface Image {
  id: string;
  image_url: string;
  display_order: number;
  file_size_bytes: number;
  width_px: number;
  height_px: number;
}

export function ImageManagement({ partId, initialImages }: { 
  partId: string; 
  initialImages: Image[];
}) {
  const [images, setImages] = useState<Image[]>(initialImages);
  const [uploading, setUploading] = useState(false);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over?.id);
      
      const reordered = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
        ...img,
        display_order: idx,
      }));
      
      setImages(reordered);
      
      // Update display_order in database
      await updateImageOrder(reordered);
    }
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('partId', partId);
      
      Array.from(files).forEach((file, i) => {
        formData.append(`image${i}`, file);
      });

      const response = await fetch('/api/admin/3d-models/upload-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      window.location.reload();
    } catch (error) {
      alert