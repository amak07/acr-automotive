/**
 * Hook for managing state in URL query parameters
 *
 * @example
 * const [filters, setFilters] = useURLState({
 *   search: '',
 *   page: 1,
 *   category: 'all'
 * });
 *
 * // Update single param
 * setFilters({ search: 'Honda' });
 *
 * // Update multiple params
 * setFilters({ search: 'Honda', page: 1 });
 */

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMemo, useCallback } from 'react';

type URLStateValue = string | number | boolean | undefined;

export function useURLState<T extends Record<string, URLStateValue>>(
  defaults: T
): [T, (updates: Partial<T>) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read state from URL, fall back to defaults
  const state = useMemo(() => {
    const result = { ...defaults };

    Object.keys(defaults).forEach((key) => {
      const value = searchParams?.get(key);
      if (value !== null) {
        // Parse based on default type
        const defaultValue = defaults[key];
        if (typeof defaultValue === 'number') {
          result[key] = parseInt(value) as T[Extract<keyof T, string>];
        } else if (typeof defaultValue === 'boolean') {
          result[key] = (value === 'true') as T[Extract<keyof T, string>];
        } else {
          result[key] = value as T[Extract<keyof T, string>];
        }
      }
    });

    return result;
  }, [searchParams, defaults]);

  // Update URL with new state
  const setState = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams?.toString());

      Object.entries(updates).forEach(([key, value]) => {
        const defaultValue = defaults[key as keyof T];

        // Remove if value is empty/default
        if (
          value === undefined ||
          value === '' ||
          value === defaultValue ||
          (typeof defaultValue === 'string' && value === '__all__')
        ) {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, defaults]
  );

  return [state, setState];
}