/**
 * Hook to preserve current search params when navigating
 *
 * @example
 * const withParams = usePreserveSearchParams();
 *
 * <Link href={withParams('/parts/123')}>View Part</Link>
 * // Result: /parts/123?make=Honda&model=Civic
 */

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function usePreserveSearchParams() {
  const searchParams = useSearchParams();

  const withParams = useCallback(
    (path: string): string => {
      const currentSearch = searchParams?.toString() || '';
      return currentSearch ? `${path}?${currentSearch}` : path;
    },
    [searchParams]
  );

  return withParams;
}
