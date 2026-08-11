import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import { isContainedPath } from "./paths.js";

/**
 * `isContainedPath` backs every write-path guard in `init` and `add`
 * (componentsDir, utilsDir, the stylesheet path, and `resolveTarget`'s
 * registry targets). It is pure and synchronous, so it is tested directly
 * rather than only by hand through the CLI's prompts.
 */

// A path that need not exist on disk — the function is pure path
// arithmetic, not a filesystem check.
const cwd = path.resolve(os.tmpdir(), "nika-paths-test", "project");

describe("isContainedPath", () => {
  it("accepts a normal relative path inside the project", () => {
    expect(isContainedPath(cwd, "src/components/ui")).toBe(true);
  });

  it("rejects a `..` escape", () => {
    expect(isContainedPath(cwd, "../../../../etc/passwd")).toBe(false);
  });

  it("accepts a path that escapes and returns inside the project", () => {
    // "subdir" then two levels up cancels back to `cwd` (whose basename is
    // "project"), then back down into it — net effect is a normal path
    // inside the project, and should be accepted. This is the case a naive
    // "reject anything containing `..`" fix would wrongly break.
    expect(isContainedPath(cwd, "subdir/../../project/file.txt")).toBe(true);
  });

  it("accepts an absolute path inside the project", () => {
    expect(isContainedPath(cwd, path.join(cwd, "src", "lib"))).toBe(true);
  });

  it("rejects an absolute path outside the project", () => {
    expect(
      isContainedPath(cwd, path.resolve(os.tmpdir(), "nika-paths-test", "elsewhere"))
    ).toBe(false);
  });

  it("rejects an empty answer (resolves to the project root itself)", () => {
    expect(isContainedPath(cwd, "")).toBe(false);
  });

  it("rejects a value that resolves to the project root via `.`", () => {
    expect(isContainedPath(cwd, ".")).toBe(false);
  });

  // `path.relative` returns a `..`-prefixed path for anything outside `cwd`
  // in the common case — except when the two paths are on different
  // drives, where Windows returns an *absolute* path instead (neither
  // `..`-prefixed nor `""`). `isContainedPath` takes an optional platform
  // implementation (defaulting to the host's `path`) precisely so this
  // branch can be exercised deterministically on every CI runner — passing
  // `path.win32` here reproduces Windows drive semantics even when this
  // suite runs on Linux, where the default `path` would never take the
  // absolute-`rel` branch at all (POSIX has no drive letters to cross).
  it("rejects a target on a different drive than cwd, under win32 semantics", () => {
    expect(isContainedPath("C:\\Users\\me\\project", "D:\\evil", path.win32)).toBe(
      false
    );
  });
});
