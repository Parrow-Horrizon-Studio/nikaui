import path from "path";
import type { PlatformPath } from "path";

/**
 * Why `value`, resolved against `cwd`, is or isn't a valid contained path.
 *
 * "root" and "outside" are kept distinct — not just booleaned together —
 * because they read differently to a caller building an error message: an
 * answer that resolves to `cwd` itself (e.g. an empty string, or enough
 * `../` to cancel back to the start) didn't go anywhere, so saying it
 * "resolves outside the project" is simply false. "must be a subdirectory
 * of the project" is the accurate complaint for that case.
 */
export type ContainmentResult = "ok" | "root" | "outside";

/**
 * Classify `value` (resolved against `cwd`) as contained, the project root
 * itself, or outside the project.
 *
 * `pathImpl` defaults to the host platform's `path` module but can be
 * overridden — pass `path.win32` to exercise Windows drive-letter semantics
 * (or `path.posix` for POSIX semantics) regardless of which OS the code is
 * actually running on. Every call site in this codebase relies on the
 * default; the parameter exists so the different-drive branch below can be
 * tested deterministically on any CI runner, not just on Windows.
 *
 * `path.relative` returns a `..`-prefixed relative path for anything
 * outside `cwd` in the common case, but under Windows semantics it returns
 * an *absolute* path instead when `cwd` and the resolved path are on
 * different drives (e.g. `cwd` on `C:` and the answer resolving to
 * `D:\...`) — neither `..`-prefixed nor `""`. The `pathImpl.isAbsolute(rel)`
 * check catches that case too.
 */
export function checkContainment(
  cwd: string,
  value: string,
  pathImpl: PlatformPath = path
): ContainmentResult {
  // Zero-length segments are ignored by `resolve`, so an empty `value`
  // resolves to `cwd` on its own — no special-casing needed here beyond
  // letting that fall through to the `resolved === cwd` check below.
  const resolved = pathImpl.resolve(cwd, value);
  if (resolved === cwd) return "root";

  const rel = pathImpl.relative(cwd, resolved);
  if (rel.startsWith("..") || pathImpl.isAbsolute(rel)) return "outside";

  return "ok";
}

/**
 * True when `value`, resolved against `cwd`, stays inside `cwd` — neither
 * escaping it nor naming the project root itself. See `checkContainment`
 * for the two ways this can fail and why they're kept separate there.
 *
 * `value` may be relative (a prompt answer like `"../../etc"`) or already
 * absolute (a path a caller built itself, like `resolveTarget`'s joined
 * registry target) — `path.resolve` is a no-op on an already-absolute
 * second argument, so both shapes go through the same check.
 */
export function isContainedPath(
  cwd: string,
  value: string,
  pathImpl: PlatformPath = path
): boolean {
  return checkContainment(cwd, value, pathImpl) === "ok";
}
