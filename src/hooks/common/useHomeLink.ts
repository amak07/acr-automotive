"use client";

import { usePathname } from "next/navigation";
import type { Route } from "next";

/**
 * Determines the appropriate home link based on current context
 * @returns "/admin" for admin context, "/" for public context
 */
export function useHomeLink(): Route {
  const pathname = usePathname();

  // If we're on any admin page, link to admin home
  if (pathname?.startsWith("/admin")) {
    return "/admin" as Route;
  }

  return "/" as Route;
}
