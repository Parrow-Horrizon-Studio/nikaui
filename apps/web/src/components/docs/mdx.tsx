import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentCards } from "./component-cards";
import { ComponentDemo } from "./component-demo";
import { SourceView } from "./source-view";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ComponentCards,
    ComponentDemo,
    SourceView,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
