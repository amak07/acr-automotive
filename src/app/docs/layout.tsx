import { source } from "@/lib/source";
import { enrichPageTreeWithRoles } from "@/lib/docs-utils.server";
import { DocsLayoutClient } from "./layout-client";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  // Enrich page tree with role metadata server-side
  const enrichedTree = enrichPageTreeWithRoles(source.pageTree);

  return (
    <DocsLayoutClient pageTree={enrichedTree}>
      {children}
    </DocsLayoutClient>
  );
}
