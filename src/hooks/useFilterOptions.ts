import { useQuery } from '@tanstack/react-query';
import type { FilterOptionsResponse } from '@/app/api/admin/filter-options/route';

interface FilterOptionsApiResponse {
  success: boolean;
  data?: FilterOptionsResponse;
  error?: string;
  timestamp: string;
}

async function fetchFilterOptions(): Promise<FilterOptionsResponse> {
  const response = await fetch('/api/admin/filter-options');
  
  if (!response.ok) {
    throw new Error('Failed to fetch filter options');
  }
  
  const result: FilterOptionsApiResponse = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch filter options');
  }
  
  return result.data;
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes - filter options don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    retry: 2,
    retryDelay: 1000,
  });
}