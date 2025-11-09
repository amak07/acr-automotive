// ============================================================================
// Locale Context Mock - For component testing
// ============================================================================

import React from 'react';
import { mockT as mockTranslationFunction } from '../mock-translations';

/**
 * Mock translation function that returns English translations
 * Falls back to key if translation not found
 */
export const mockT = mockTranslationFunction;

/**
 * Mock locale context provider for tests
 */
export const MockLocaleProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

/**
 * Mock useLocale hook
 */
export const mockUseLocale = () => ({
  locale: 'en',
  setLocale: jest.fn(),
  t: mockT,
  translations: {},
});

/**
 * Helper to wrap component with locale provider
 */
export function withMockLocale(Component: React.ComponentType<any>) {
  return function WrappedComponent(props: any) {
    return (
      <MockLocaleProvider>
        <Component {...props} />
      </MockLocaleProvider>
    );
  };
}
