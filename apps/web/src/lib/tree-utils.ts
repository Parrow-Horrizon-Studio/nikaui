import type { Root, Folder, Item } from "fumadocs-core/page-tree";

/**
 * Extract a subtree from the page tree by folder name.
 * Returns a new Root with only the children of the matched folder.
 */
export function getSubTree(tree: Root, folderName: string): Root {
  for (const node of tree.children) {
    if (node.type === "folder") {
      const folder = node as Folder;
      // Match by checking if the folder's index URL contains the folder name
      const folderUrl =
        folder.index?.url ??
        (folder.children.find((c): c is Item => c.type === "page"))?.url;

      if (folderUrl?.includes(`/${folderName}`)) {
        return {
          name: folder.name,
          children: folder.children,
        };
      }
    }
  }

  // Fallback: return full tree
  return tree;
}
