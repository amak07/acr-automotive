---
title: "Site Settings System"
---

# Site Settings System

> **Complete guide** to ACR Automotive's centralized configuration management: contact info, branding, and homepage banners

## Overview

The Site Settings system provides a centralized, admin-controlled configuration management for the entire application. All settings are stored in a single `site_settings` table using JSONB values for flexibility and are cached globally for performance.

### Key Features

- **Contact Information** - Email, phone, WhatsApp, physical address
- **Branding Assets** - Company logo, favicon with file upload
- **Homepage Banners** - Carousel management with desktop/mobile responsive images
- **JSONB Storage** - Flexible schema-less values with TypeScript type safety
- **Global Caching** - TanStack Query with 10-minute cache for instant access
- **Real-time Updates** - Automatic invalidation across admin and public interfaces

## Architecture

### Database Schema

```sql
create table site_settings (
  key text primary key,               -- Setting key (e.g., 'contact_info', 'branding')
  value jsonb not null,               -- JSONB value for flexible schema
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Example records
INSERT INTO site_settings (key, value) VALUES
('contact_info', '{
  "email": "info@acr-automotive.com",
  "phone": "+52 33 1234 5678",
  "whatsapp": "+52 33 9876 5432",
  "address": "Av. Libertad 123, Guadalajara, Jalisco, México"
}'::jsonb),
('branding', '{
  "company_name": "ACR Automotive",
  "logo_url": "https://xyz.supabase.co/.../logo.png",
  "favicon_url": "https://xyz.supabase.co/.../favicon.ico",
  "banners": [...]
}'::jsonb);
```

**Design Decision**: JSONB values provide flexibility for complex nested structures (like `banners` arrays) without requiring schema migrations for new fields.

---

### TypeScript Type System

Located in [src/lib/types/settings.ts](../../../src/lib/types/settings.ts)

#### Contact Information

```typescript
export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
}
```

#### Banner Configuration

```typescript
export interface Banner {
  id: string; // Client-generated UUID
  image_url: string; // Desktop banner image (required)
  mobile_image_url?: string; // Mobile banner image (optional)
  title?: string; // Banner heading
  subtitle?: string; // Banner subheading
  cta_text?: string; // Call-to-action button text
  cta_link?: string; // CTA button link
  display_order: number; // Sort order (0 = first)
  is_active: boolean; // Visibility toggle
}
```

#### Branding Settings

```typescript
export interface Branding {
  company_name: string;
  logo_url: string;
  favicon_url: string;
  banners: Banner[];
}
```

#### Combined Settings

```typescript
export interface SiteSettings {
  contact_info: ContactInfo;
  branding: Branding;
}

export type SettingKey = "contact_info" | "branding";
```

---

## API Reference

### Admin Endpoints

#### `GET /api/admin/settings`

Fetch all site settings for admin editing.

**Response**:

```typescript
{
  settings: {
    contact_info: ContactInfo;
    branding: Branding;
  }
}
```

**Example**:

```typescript
const response = await fetch("/api/admin/settings");
const { settings } = await response.json();

console.log(settings.contact_info.email); // "info@acr-automotive.com"
console.log(settings.branding.banners.length); // 3
```

**Data Transformation**:

```typescript
// Database: Array of {key, value} records
const dbRecords = [
  { key: "contact_info", value: {...} },
  { key: "branding", value: {...} }
];

// Response: Object keyed by setting key
const settings = {
  contact_info: {...},
  branding: {...}
};
```

---

#### `PUT /api/admin/settings`

Update a specific setting by key.

**Request Body**:

```typescript
{
  key: SettingKey; // "contact_info" | "branding"
  value: ContactInfo | Branding;
}
```

**Response**:

```typescript
{
  message: string; // "Successfully updated {key}"
  setting: {
    key: string;
    value: any;
    updated_at: string;
  }
}
```

**Example**:

```typescript
// Update contact information
await fetch("/api/admin/settings", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    key: "contact_info",
    value: {
      email: "new-email@acr-automotive.com",
      phone: "+52 33 1111 2222",
      whatsapp: "+52 33 3333 4444",
      address: "New Address, Guadalajara, México",
    },
  }),
});

// Database automatically updates:
// - Sets `updated_at = NOW()`
// - Merges JSONB value
```

**Validation**: Uses Zod schema `updateSettingSchema` to validate request body.

---

#### `POST /api/admin/settings/upload-asset`

Upload branding assets (logo, favicon, banner images) to Supabase Storage.

**Request**: `multipart/form-data`

- `file`: File - The image file to upload
- `type`: string - Asset type: `"logo"` | `"favicon"` | `"banner"`

**Validation Rules**:

- **Allowed types**: PNG, JPEG, JPG, WebP, SVG, ICO
- **Max file size**: 5MB

**Response**:

```typescript
{
  message: "Asset uploaded successfully",
  url: string,      // Public URL: https://xyz.supabase.co/.../logo-1234567890.png
  path: string      // Storage path: logo-1234567890.png
}
```

**Storage Path Pattern**:

```
{assetType}-{timestamp}.{extension}
```

**Examples**:

```
logo-1698765432000.png
favicon-1698765500000.ico
banner-1698765600000.webp
```

**Example Upload**:

```typescript
const formData = new FormData();
formData.append("file", logoFile);
formData.append("type", "logo");

const response = await fetch("/api/admin/settings/upload-asset", {
  method: "POST",
  body: formData,
});

const { url } = await response.json();
// url = "https://xyz.supabase.co/storage/v1/object/public/acr-site-assets/logo-1698765432000.png"

// Admin then updates branding.logo_url
await fetch("/api/admin/settings", {
  method: "PUT",
  body: JSON.stringify({
    key: "branding",
    value: { ...existingBranding, logo_url: url },
  }),
});
```

**Storage Bucket**: `acr-site-assets` (separate from `acr-part-images`)

---

### Public Endpoints

#### `GET /api/public/settings`

Fetch all site settings for public consumption (footer, header, banners).

**Response**:

```typescript
{
  settings: {
    contact_info: ContactInfo;
    branding: Branding;
  }
}
```

**Caching Headers**: Includes cache-control for CDN caching

**Example Usage**:

```typescript
// Public homepage fetches settings
const { settings } = await fetch("/api/public/settings").then(r => r.json());

// Display contact info in footer
<footer>
  <p>Email: {settings.contact_info.email}</p>
  <p>Phone: {settings.contact_info.phone}</p>
</footer>

// Render active banners
const activeBanners = settings.branding.banners
  .filter(b => b.is_active)
  .sort((a, b) => a.display_order - b.display_order);
```

---

## Frontend Components

### Admin Interface

#### `SettingsPageContent.tsx` - Main Settings Page

Located at [/admin/settings](../../../src/app/admin/settings/page.tsx)

**Features**:

- Two-section layout: Contact Info + Branding
- Language toggle (English/Spanish)
- Logout button
- Back navigation

**Component Structure**:

```tsx
<SettingsPageContent>
  {/* Contact Information Section */}
  <section>
    <ContactInfoSettings />
  </section>

  {/* Branding Section */}
  <section>
    <BrandingSettings />
  </section>
</SettingsPageContent>
```

---

#### `ContactInfoSettings.tsx` - Contact Form

**Features**:

- Email, phone, WhatsApp, address fields
- Real-time validation with Zod + React Hook Form
- Auto-save with dirty state detection
- TanStack Query optimistic updates

**Form Flow**:

```typescript
// 1. Load current settings
const { data: settings } = useQuery({
  queryKey: ["settings", "contact_info"],
  queryFn: async () => {
    const res = await fetch("/api/admin/settings");
    const { settings } = await res.json();
    return settings.contact_info as ContactInfo;
  },
});

// 2. Auto-populate form
const form = useForm<ContactInfo>({
  resolver: zodResolver(contactInfoSchema),
  values: settings, // Auto-populate when data loads
});

// 3. Save changes
const updateMutation = useMutation({
  mutationFn: async (data: ContactInfo) => {
    await fetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ key: "contact_info", value: data }),
    });
  },
  onSuccess: () => {
    // Invalidate admin AND public queries
    queryClient.invalidateQueries({ queryKey: ["settings"] });
    queryClient.invalidateQueries({ queryKey: ["public", "settings"] });
  },
});
```

**Validation Schema** ([src/lib/schemas/admin.ts](../../../src/lib/schemas/admin.ts)):

```typescript
export const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
});
```

---

#### `BrandingSettings.tsx` - Branding Management

**Features**:

- **Company Name** - Text input
- **Logo Upload** - File upload with preview (recommended size: varies)
- **Favicon Upload** - ICO/PNG upload with 16x16 preview
- **Banner Carousel** - Full CRUD management

**Banner Management UI**:

```tsx
{
  banners.map((banner, index) => (
    <div key={banner.id}>
      {/* Header with Active Toggle */}
      <div className="flex justify-between">
        <span>Banner {index + 1}</span>
        <input
          type="checkbox"
          checked={banner.is_active}
          onChange={(e) =>
            updateBanner(banner.id, { is_active: e.target.checked })
          }
        />
      </div>

      {/* Reorder Buttons */}
      <button
        onClick={() => moveBanner(banner.id, "up")}
        disabled={index === 0}
      >
        <ChevronUp />
      </button>
      <button
        onClick={() => moveBanner(banner.id, "down")}
        disabled={index === banners.length - 1}
      >
        <ChevronDown />
      </button>

      {/* Edit/Delete */}
      <button onClick={() => setEditingBannerId(banner.id)}>
        <Edit />
      </button>
      <button onClick={() => deleteBanner(banner.id)}>
        <Trash2 />
      </button>

      {/* Expanded Edit Form */}
      {editingBannerId === banner.id && (
        <div>
          <input type="file" /* Desktop image upload */ />
          <input type="file" /* Mobile image upload */ />
          <input value={banner.title} /* Title */ />
          <input value={banner.subtitle} /* Subtitle */ />
          <input value={banner.cta_text} /* CTA text */ />
          <input value={banner.cta_link} /* CTA link */ />
        </div>
      )}
    </div>
  ));
}
```

**Banner CRUD Operations**:

```typescript
// Add new banner
const addBanner = () => {
  const newBanner: Banner = {
    id: `banner-${Date.now()}`, // Client-generated ID
    image_url: "",
    mobile_image_url: "",
    title: "",
    subtitle: "",
    cta_text: "",
    cta_link: "",
    display_order: banners.length,
    is_active: true,
  };
  setValue("banners", [...banners, newBanner], { shouldDirty: true });
  setEditingBannerId(newBanner.id);
};

// Delete banner
const deleteBanner = (bannerId: string) => {
  if (!confirm("Delete this banner?")) return;

  const updatedBanners = banners
    .filter((b) => b.id !== bannerId)
    .map((b, index) => ({ ...b, display_order: index })); // Reindex

  setValue("banners", updatedBanners, { shouldDirty: true });
};

// Move banner up/down
const moveBanner = (bannerId: string, direction: "up" | "down") => {
  const currentIndex = banners.findIndex((b) => b.id === bannerId);
  const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  // Swap positions
  const updatedBanners = [...banners];
  [updatedBanners[currentIndex], updatedBanners[newIndex]] = [
    updatedBanners[newIndex],
    updatedBanners[currentIndex],
  ];

  // Update display_order
  updatedBanners.forEach((banner, index) => {
    banner.display_order = index;
  });

  setValue("banners", updatedBanners, { shouldDirty: true });
};

// Update banner field
const updateBanner = (bannerId: string, updates: Partial<Banner>) => {
  const updatedBanners = banners.map((b) =>
    b.id === bannerId ? { ...b, ...updates } : b
  );
  setValue("banners", updatedBanners, { shouldDirty: true });
};
```

**Image Upload Flow**:

```typescript
const uploadBannerImage = async (
  bannerId: string,
  file: File,
  imageType: "desktop" | "mobile"
) => {
  // 1. Upload to storage
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "banner");

  const response = await fetch("/api/admin/settings/upload-asset", {
    method: "POST",
    body: formData,
  });

  const { url } = await response.json();

  // 2. Update banner with new URL
  if (imageType === "desktop") {
    updateBanner(bannerId, { image_url: url });
  } else {
    updateBanner(bannerId, { mobile_image_url: url });
  }

  // 3. Admin must click "Save" to persist to database
};
```

**Important**: Image uploads update form state only. Admin must click "Save" button to persist all changes to the database.

---

## Performance Optimizations

### 1. Global Settings Cache

**Strategy**: Cache settings globally with 10-minute TTL

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes (settings rarely change)
      gcTime: 60 * 60 * 1000, // 1 hour (keep in memory)
    },
  },
});
```

**Benefits**:

- Settings fetched once per page load
- Shared across components (contact footer + header logo use same cache)
- 10-minute stale time reduces API calls

---

### 2. Optimistic Updates

**Pattern**: Update UI immediately, revalidate in background

```typescript
const updateMutation = useMutation({
  mutationFn: async (data) => {
    await fetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  onSuccess: () => {
    // Invalidate cache (triggers background refetch)
    queryClient.invalidateQueries({ queryKey: ["settings"] });
    queryClient.invalidateQueries({ queryKey: ["public", "settings"] });

    // Form resets with saved values (shows success immediately)
    reset(data.setting.value);
  },
});
```

**User Experience**:

- Form saves → Success toast appears instantly
- Background revalidation confirms data persistence
- If revalidation fails, cache reverts to previous state

---

### 3. Dirty State Detection

**Pattern**: Enable "Save" button only when form changes

```typescript
const {
  formState: { isDirty },  // true when any field changes
  reset,                   // Reset dirty state after save
} = useForm();

<button disabled={!isDirty || isSaving}>
  Save Changes
</button>
```

**Benefits**:

- Prevents accidental re-saves
- Visual feedback (disabled button = no changes)
- Resets after successful save

---

### 4. JSONB Indexing

**Database Optimization**:

```sql
-- GIN index for JSONB queries
create index idx_site_settings_value on site_settings using gin(value);

-- Query specific JSONB fields
SELECT value->>'email' FROM site_settings WHERE key = 'contact_info';
```

**Note**: Current implementation fetches entire setting records, but GIN index enables future optimization for partial queries.

---

## Code Examples

### Example 1: Update Contact Information

```typescript
// Admin edits contact form
const form = {
  email: "updated@acr-automotive.com",
  phone: "+52 33 5555 6666",
  whatsapp: "+52 33 7777 8888",
  address: "Updated Address, Guadalajara, México",
};

// Save to database
await fetch("/api/admin/settings", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    key: "contact_info",
    value: form,
  }),
});

// Database updates:
// UPDATE site_settings
// SET value = '{...form...}'::jsonb, updated_at = NOW()
// WHERE key = 'contact_info';

// TanStack Query invalidates cache
queryClient.invalidateQueries({ queryKey: ["settings"] });
queryClient.invalidateQueries({ queryKey: ["public", "settings"] });

// Public footer instantly shows new contact info (after refetch)
```

---

### Example 2: Upload and Set Company Logo

```typescript
// Step 1: User selects logo file
const logoFile = event.target.files[0]; // company-logo.png (2.5MB)

// Step 2: Upload to storage
const formData = new FormData();
formData.append("file", logoFile);
formData.append("type", "logo");

const uploadResponse = await fetch("/api/admin/settings/upload-asset", {
  method: "POST",
  body: formData,
});

const { url } = await uploadResponse.json();
// url = "https://xyz.supabase.co/.../logo-1698765432000.png"

// Step 3: Update branding.logo_url
const existingBranding = {
  company_name: "ACR Automotive",
  logo_url: "old-logo-url.png",  // Replace this
  favicon_url: "favicon.ico",
  banners: [...]
};

await fetch("/api/admin/settings", {
  method: "PUT",
  body: JSON.stringify({
    key: "branding",
    value: {
      ...existingBranding,
      logo_url: url  // New URL from upload
    }
  })
});

// Step 4: Form shows new logo preview immediately
// Step 5: Public header logo updates after cache invalidation
```

---

### Example 3: Create Homepage Banner

```typescript
// Step 1: Admin clicks "Add Banner"
const newBanner: Banner = {
  id: `banner-${Date.now()}`, // "banner-1698765432000"
  image_url: "", // Will upload image next
  mobile_image_url: "",
  title: "Summer Sale",
  subtitle: "20% off all brake rotors",
  cta_text: "Shop Now",
  cta_link: "/search?category=rotors",
  display_order: 0, // First banner
  is_active: true,
};

// Step 2: Upload desktop banner image
const desktopImage = new File(["..."], "summer-sale-desktop.webp");
const formData = new FormData();
formData.append("file", desktopImage);
formData.append("type", "banner");

const { url: desktopUrl } = await fetch("/api/admin/settings/upload-asset", {
  method: "POST",
  body: formData,
}).then((r) => r.json());

newBanner.image_url = desktopUrl;

// Step 3: Upload mobile banner image (optional)
const mobileImage = new File(["..."], "summer-sale-mobile.webp");
const mobileFormData = new FormData();
mobileFormData.append("file", mobileImage);
mobileFormData.append("type", "banner");

const { url: mobileUrl } = await fetch("/api/admin/settings/upload-asset", {
  method: "POST",
  body: mobileFormData,
}).then((r) => r.json());

newBanner.mobile_image_url = mobileUrl;

// Step 4: Add banner to branding.banners array
const existingBranding = {
  /* ... */
};
existingBranding.banners.push(newBanner);

// Step 5: Save to database
await fetch("/api/admin/settings", {
  method: "PUT",
  body: JSON.stringify({
    key: "branding",
    value: existingBranding,
  }),
});

// Step 6: Homepage carousel shows new banner immediately (after cache invalidation)
```

---

### Example 4: Reorder Banners

```typescript
// Initial state (display_order determines carousel order):
const banners = [
  { id: "banner-1", title: "Summer Sale", display_order: 0 },
  { id: "banner-2", title: "New Arrivals", display_order: 1 },
  { id: "banner-3", title: "Clearance", display_order: 2 },
];

// Admin clicks "Move Down" on banner-1
// Swap banner-1 and banner-2

const updatedBanners = [
  { id: "banner-2", title: "New Arrivals", display_order: 0 }, // Moved up
  { id: "banner-1", title: "Summer Sale", display_order: 1 }, // Moved down
  { id: "banner-3", title: "Clearance", display_order: 2 }, // Unchanged
];

// Save to database
await fetch("/api/admin/settings", {
  method: "PUT",
  body: JSON.stringify({
    key: "branding",
    value: { ...existingBranding, banners: updatedBanners },
  }),
});

// Homepage carousel order updates immediately
```

---

## Error Handling

### Upload Validation Errors

```typescript
// Error: Invalid file type
{
  error: "Invalid file type. Allowed types: image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/x-icon",
  status: 400
}

// Error: File too large
{
  error: "File size exceeds 5MB limit",
  status: 400
}

// Error: No file provided
{
  error: "No file provided",
  status: 400
}

// Error: Asset type missing
{
  error: "Asset type is required",
  status: 400
}
```

### Settings Update Errors

```typescript
// Error: Invalid setting key
{
  error: "Validation failed",
  details: [
    {
      field: "key",
      message: "Invalid enum value. Expected 'contact_info' | 'branding', received 'invalid_key'"
    }
  ],
  status: 400
}

// Error: Database update failed
{
  error: "Failed to update contact_info",
  status: 500
}
```

---

## Testing

### Manual Testing Checklist

#### Contact Information

- [ ] Update email (valid format)
- [ ] Update phone number
- [ ] Add/remove WhatsApp number
- [ ] Update physical address
- [ ] Verify public footer shows updated info

#### Branding

- [ ] Upload company logo (PNG, SVG)
- [ ] Upload favicon (ICO, PNG)
- [ ] Verify logo appears in header
- [ ] Verify favicon appears in browser tab

#### Banners

- [ ] Create new banner with desktop image
- [ ] Add mobile image (optional)
- [ ] Add title, subtitle, CTA
- [ ] Activate/deactivate banner
- [ ] Reorder banners (move up/down)
- [ ] Delete banner
- [ ] Verify carousel shows active banners in correct order

### Automated Testing

```typescript
// Example test: Update contact info
describe("PUT /api/admin/settings", () => {
  it("updates contact_info successfully", async () => {
    const newContactInfo = {
      email: "test@example.com",
      phone: "+52 33 1234 5678",
      whatsapp: "+52 33 9876 5432",
      address: "Test Address",
    };

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "contact_info",
        value: newContactInfo,
      }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toContain("Successfully updated");
    expect(json.setting.value).toEqual(newContactInfo);
  });

  it("rejects invalid email", async () => {
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({
        key: "contact_info",
        value: { email: "invalid-email" }, // Missing @ symbol
      }),
    });

    expect(response.status).toBe(400);
  });
});
```

---

## Related Documentation

### Architecture

- **[Architecture Overview](../../architecture/OVERVIEW.md)** - Settings layer in system architecture
- **[State Management](../../architecture/STATE_MANAGEMENT.md)** - TanStack Query caching patterns

### Database

- **[Database Schema](../../database/DATABASE.md)** - Complete schema for `site_settings` table

---

**Last Updated**: October 25, 2025
