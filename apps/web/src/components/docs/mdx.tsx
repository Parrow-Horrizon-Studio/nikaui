import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentCards } from "./component-cards";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ComponentCards,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
