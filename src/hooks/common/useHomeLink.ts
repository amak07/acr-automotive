"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Determines the appropriate home link based on current context
 * @returns "/admin" for admin context, "/" for public context
 */
export function useHomeLink(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromAdmin = searchParams?.get('from') === 'admin';

  if (fromAdmin || pathname?.startsWith("/admin")) {
    return "/admin";
  }

  return "/";
}
