"use client";

/**
 * `layout.shared.tsx` passes this as `slots.navTitle` to remove Fumadocs'
 * sidebar home-link tab stop outright (see the comment there for why). It
 * has to live in its own `"use client"` module rather than be an inline
 * arrow function in `layout.shared.tsx`: `baseOptions()` runs in a Server
 * Component, and Fumadocs' `DocsLayout` renders this slot from inside its
 * own Client Component tree, so the value crossing that boundary must be a
 * proper client component reference, not a bare closure — passing a plain
 * function as a prop from a Server Component to a Client Component fails at
 * build time ("Functions cannot be passed directly to Client Components")
 * even though it type-checks and even though `@testing-library/react`,
 * which renders outside any RSC boundary, can't see the problem. Exporting
 * it from a `"use client"` file is what makes it a serializable reference
 * instead of a closure.
 */
// No declared parameter, not `(_props: ComponentProps<"a">)`: TypeScript
// allows a function with fewer parameters than the type it's assigned to
// expects (same reason `onClick={() => …}` satisfies a handler type that
// takes an event), and an unused, unnamed parameter is exactly what
// `@typescript-eslint/no-unused-vars` (`--max-warnings 0`) flags.
export function EmptyNavTitle() {
  return null;
}
