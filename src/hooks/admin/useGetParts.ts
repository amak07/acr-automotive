"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminPartsQueryParams, PartSummary } from "@/types";

type UsePartsParams = AdminPartsQueryParams;

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
    queryKey: [
      "parts",
      {
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
      },
    ],
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
