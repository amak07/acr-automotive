import { source } from "@/lib/source";
import type { Root, Node } from "fumadocs-core/page-tree";
import type { EnrichedPageTree, EnrichedNode } from "./docs-utils";

/**
 * Enrich the page tree with allowedRoles metadata from page frontmatter.
 * This runs server-side and prepares data for client-side filtering.
 */
export function enrichPageTreeWithRoles(tree: Root): EnrichedPageTree {
  const enrichNodes = (nodes: Node[]): EnrichedNode[] => {
    return nodes.map((node) => {
      if (node.type === "page") {
        // Extract slug from URL (remove /docs/ prefix)
        const slug = node.url
          .replace(/^\/docs\/?/, "")
          .split("/")
          .filter(Boolean);
        const page = source.getPage(slug.length > 0 ? slug : undefined);

        // Get allowedRoles from page data, default to admin-only
        const allowedRoles =
          (page?.data as { allowedRoles?: string[] })?.allowedRoles ?? ["admin"];

        return {
          ...node,
          allowedRoles,
        } as EnrichedNode;
      }

      if (node.type === "folder") {
        return {
          ...node,
          children: enrichNodes(node.children),
        } as EnrichedNode;
      }

      // Keep separators as-is
      return node as EnrichedNode;
    });
  };

  return {
    ...tree,
    children: enrichNodes(tree.children),
  };
}
