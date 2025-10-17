/**
 * Site Settings JSONB Type Helpers
 * These types define the structure of JSONB values in site_settings.value
 * Keep separate from auto-generated Supabase types to avoid overwriting
 */

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
}

export interface Banner {
  id: string;
  image_url: string;
  mobile_image_url?: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  display_order: number;
  is_active: boolean;
}

export interface Branding {
  company_name: string;
  logo_url: string;
  favicon_url: string;
  banners: Banner[];
}

// Combined settings for frontend consumption
export interface SiteSettings {
  contact_info: ContactInfo;
  branding: Branding;
}

// Type guard to check setting keys
export type SettingKey = 'contact_info' | 'branding';

// Helper to type-cast JSONB values from database
export function parseSettingValue<K extends SettingKey>(
  key: K,
  value: unknown
): SiteSettings[K] {
  return value as SiteSettings[K];
}
