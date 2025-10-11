"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { Route } from "next";

/**
 * Determines the appropriate home link based on current context
 * @returns "/admin" for admin context, "/" for public context
 */
export function useHomeLink(): Route {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromAdmin = searchParams?.get('from') === 'admin';

  if (fromAdmin || pathname?.startsWith("/admin")) {
    return "/admin" as Route;
  }

  return "/" as Route;
}
