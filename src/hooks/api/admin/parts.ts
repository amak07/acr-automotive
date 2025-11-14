"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  querySchema,
  createPartSchema,
  updatePartSchema,
} from "@/app/api/admin/parts/schemas";
import {
  AdminPartsQueryParams,
  PartSummary,
  PartWithDetails,
  DatabasePartRow,
} from "@/types";
import { queryKeys } from "@/hooks/common/queryKeys";

// ============================================================================
// Types
// ============================================================================

type UsePartsParams = AdminPartsQueryParams;
interface UsePartByIdParams {
  sku: string;
}
export type CreatePartsParams = z.infer<typeof createPartSchema>;
export type UpdatePartsParams = z.infer<typeof updatePartSchema>;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * useGetParts - Fetch paginated and filtered parts list
 */
export function useGetParts(queryParams: UsePartsParams) {
  const {
    limit,
    offset,
    sort_by,
    sort_order,
    abs_type,
    bolt_pattern,
    drive_type,
    part_type,
    position_type,
    search,
  } = queryParams;

  return useQuery<{ data: PartSummary[]; count: number }>({
    queryKey: queryKeys.parts.list({
      limit,
      offset,
      sort_by,
      sort_order,
      abs_type,
      bolt_pattern,
      drive_type,
      part_type,
      position_type,
      search,
    }),
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      // Add pagination
      searchParams.append("offset", offset.toString());
      searchParams.append("limit", limit.toString());

      // Add sorting
      searchParams.append("sort_by", sort_by);
      searchParams.append("sort_order", sort_order);

      // Add filters
      if (search) searchParams.append("search", search);
      if (part_type) searchParams.append("part_type", part_type);
      if (position_type) searchParams.append("position_type", position_type);
      if (abs_type) searchParams.append("abs_type", abs_type);
      if (drive_type) searchParams.append("drive_type", drive_type);
      if (bolt_pattern) searchParams.append("bolt_pattern", bolt_pattern);

      const url = `/api/admin/parts?${searchParams.toString()}`;
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) throw new Error("failed to fetch parts list");
      const result = await response.json();
      return {
        data: result.data,
        count: result.count,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * useGetPartById - Fetch a single part with full details
 * @param queryParams.sku - The ACR SKU of the part to fetch
 */
export function useGetPartById(queryParams: UsePartByIdParams) {
  const { sku } = queryParams;

  return useQuery<PartWithDetails>({
    queryKey: queryKeys.parts.detail(sku || ""),
    enabled: !!sku, // Only run query if sku exists
    queryFn: async () => {
      const url = `/api/admin/parts?sku=${encodeURIComponent(sku)}`;
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) throw new Error(`failed to fetch part: ${sku}`);
      const result = await response.json();
      return result.data as PartWithDetails;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * useCreatePart - Create a new part
 */
export function useCreatePart() {
  const queryClient = useQueryClient();

  return useMutation<DatabasePartRow[], Error, CreatePartsParams>({
    mutationFn: async (params: CreatePartsParams) => {
      const response = await fetch(`/api/admin/parts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to create part: ${response.json()}`);
      }

      const result = await response.json();
      return result.data as DatabasePartRow[];
    },
    onSuccess: () => {
      // Also invalidate the parts list so it shows updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.parts(),
      });
    },
  });
}

/**
 * useUpdatePartById - Update an existing part
 */
export function useUpdatePartById() {
  const queryClient = useQueryClient();

  return useMutation<DatabasePartRow[], Error, UpdatePartsParams>({
    mutationFn: async (params: UpdatePartsParams) => {
      const response = await fetch(`/api/admin/parts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to update part: ${params.id}`);
      }

      const result = await response.json();
      return result.data as DatabasePartRow[];
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the part details data
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.detail(variables.id),
      });
      // Also invalidate the parts list so it shows updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.parts(),
      });
    },
  });
}
