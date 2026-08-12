import Link from "next/link";

/**
 * The wordmark used in both the nav and the footer. Always a link back to
 * "/" — a clickable brand mark is the one piece of chrome a visitor expects
 * to work as a way home from anywhere on the site, docs pages included once
 * sub-project D wraps them in this same nav/footer.
 */
export function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-sm text-base font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      {/* Ported from the prototype's .sun-mark: a radial-gradient disc,
          styled by the class appended to globals.css. Decorative — the
          wordmark text beside it already names the link. */}
      <span className="sun-mark" aria-hidden="true" />
      <span>
        <span className="text-content">Nika</span>{" "}
        <span className="text-primary">UI</span>
      </span>
    </Link>
  );
}
