import Link from "next/link";

/**
 * Rendered at the top of any documentation page whose frontmatter carries
 * `status: stub`. One source of truth: the same field drives the marker in
 * the component index, so a page cannot look complete in one place and
 * incomplete in the other.
 */
export function StubNotice() {
  return (
    <div
      role="note"
      className="mb-6 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-content-muted"
    >
      <strong className="font-medium text-content">
        This page is a stub.
      </strong>{" "}
      The component works and is installable; its reference documentation is
      not written yet. The{" "}
      <Link href="/docs/guide" className="text-primary underline">
        guide
      </Link>{" "}
      covers installation, theming and animation for every component.
    </div>
  );
}
