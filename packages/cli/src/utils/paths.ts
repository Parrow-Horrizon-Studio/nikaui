import path from "path";

/**
 * True when `value`, resolved against `cwd`, stays inside `cwd`.
 *
 * `value` may be relative (a prompt answer like `"../../etc"`) or already
 * absolute (a path a caller built itself, like `resolveTarget`'s joined
 * registry target) — `path.resolve` is a no-op on an already-absolute
 * second argument, so both shapes go through the same check.
 *
 * `path.relative` returns a `..`-prefixed relative path for anything
 * outside `cwd` in the common case, but on Windows it returns an
 * *absolute* path instead when `cwd` and the resolved path are on
 * different drives (e.g. `cwd` on `C:` and the answer resolving to
 * `D:\...`) — neither `..`-prefixed nor `""`. The `path.isAbsolute(rel)`
 * check catches that case too.
 *
 * A `value` that resolves to `cwd` itself (e.g. an empty string) is also
 * rejected: every caller uses this to admit a location *within* the
 * project — a components directory, a utils directory, a stylesheet's
 * containing directory, a registry target file — and the project root
 * itself is never a valid answer for any of them.
 */
export function isContainedPath(cwd: string, value: string): boolean {
  if (!value) return false;
  const resolved = path.resolve(cwd, value);
  const rel = path.relative(cwd, resolved);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}
