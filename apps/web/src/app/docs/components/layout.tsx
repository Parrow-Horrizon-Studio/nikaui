import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { getSubTree } from "@/lib/tree-utils";
import type { ReactNode } from "react";

export default function ComponentsLayout({ children }: { children: ReactNode }) {
  const tree = getSubTree(source.getPageTree(), "components");

  return (
    <DocsLayout
      tree={tree}
      {...baseOptions()}
      containerProps={{ className: "[--fd-layout-width:1400px]" }}
    >
      {children}
    </DocsLayout>
  );
}
