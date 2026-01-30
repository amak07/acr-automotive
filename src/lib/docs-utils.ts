import type { Item, Folder, Separator, Root } from "fumadocs-core/page-tree";

export type UserRole = "admin" | "data_manager";

// Extended node type that includes role metadata
export interface EnrichedPageNode extends Omit<Item, "type"> {
  type: "page";
  allowedRoles: string[];
}

export interface EnrichedFolderNode extends Omit<Folder, "children" | "type"> {
  type: "folder";
  children: EnrichedNode[];
}

export type EnrichedNode = EnrichedPageNode | EnrichedFolderNode | Separator;

export interface EnrichedPageTree extends Omit<Root, "children"> {
  children: EnrichedNode[];
}

/**
 * Filter an enriched page tree based on user role.
 * This function works on client-side with pre-enriched data.
 */
export function filterEnrichedTreeByRole(
  tree: EnrichedPageTree,
  userRole: UserRole
): EnrichedPageTree {
  const filterNodes = (nodes: EnrichedNode[]): EnrichedNode[] => {
    return nodes
      .map((node) => {
        if (node.type === "page") {
          const allowedRoles = node.allowedRoles;
          if (!allowedRoles.includes(userRole)) {
            return null;
          }
          return node;
        }

        if (node.type === "folder") {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length === 0) {
            return null;
          }
          return {
            ...node,
            children: filteredChildren,
          };
        }

        // Keep separators and other node types
        return node;
      })
      .filter((node): node is EnrichedNode => node !== null);
  };

  return {
    ...tree,
    children: filterNodes(tree.children),
  };
}
