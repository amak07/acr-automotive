// ============================================================================
// Locale Context Mock - For component testing
// ============================================================================

import React from 'react';

/**
 * Mock translation function that returns the key
 */
export const mockT = (key: string): string => key;

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
