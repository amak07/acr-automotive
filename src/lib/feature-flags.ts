/**
 * Feature Flags Configuration
 *
 * Simple feature flag system for controlling post-MVP features.
 */

export interface FeatureFlags {
  enablePostMVP: boolean;
}

/**
 * Get current feature flags based on environment
 */
export function getFeatureFlags(): FeatureFlags {
  const enablePostMVP =
    process.env.NEXT_PUBLIC_ENABLE_POST_MVP === 'true' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'development';

  return {
    enablePostMVP,
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return getFeatureFlags()[feature];
}

/**
 * Hook for use in React components
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  return isFeatureEnabled(feature);
}

/**
 * Get environment display name
 */
export function getEnvironmentName(): string {
  const env = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV;
  return env === 'development' ? 'Development' : 'Production';
}