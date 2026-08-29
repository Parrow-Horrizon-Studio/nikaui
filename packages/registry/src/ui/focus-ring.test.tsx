import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Every focusable control shares one focus treatment.
 *
 * WHY THIS FILE EXISTS: the library shipped two different rings. `input`,
 * `textarea`, `checkbox`, `switch`, `radio-group` and `tabs` used
 * `ring-2 ring-offset-2` — a ring separated from the control by a gap —
 * while `select` and `combobox` used the same shape under `focus:` rather
 * than `focus-visible:`, so they also lit up on mouse click. A form with an
 * Input beside a Select therefore showed two focus treatments that differed
 * both visually and in when they appeared.
 *
 * The offset was not merely cosmetic. D found the same construction to be
 * effectively invisible at 20px, and recorded the 16px cases on `checkbox`
 * and `radio-group` as unverified rather than assume they behaved the same.
 * Removing the offset so the ring hugs the control is what makes a small
 * control's focus state legible at all.
 *
 * This asserts the source text rather than rendering each component: the
 * ring lives in a static class string, several of these components need a
 * provider or an open floating layer to render their focusable element, and
 * a source assertion cannot be fooled by a component that simply failed to
 * mount.
 *
 * IF THIS FAILS: a control has reintroduced `ring-offset`, or has a ring
 * that is not the shared one. Use the string in SHARED_RING.
 */

// `group-` prefixed is the same ring projected onto an inner element:
const SHARED_RING = "focus-visible:ring-[3px] focus-visible:ring-ring";

/**
 * `group-` prefixed is the same ring projected onto an inner element:
 * RadioGroup focuses its row but draws the ring on the dot, which is where
 * it belongs. Normalising the prefix away lets both spellings satisfy one
 * assertion without a regex that has to be escaped correctly to be true.
 */
function ringOf(src: string): string {
  return src.split("group-").join("");
}

const uiDir = path.dirname(fileURLToPath(import.meta.url));

/** Every component that owns a focusable element. */
const FOCUSABLE = [
  "badge",
  "button",
  "checkbox",
  "combobox",
  "input",
  "radio-group",
  "select",
  "slider",
  "switch",
  "tabs",
  "textarea",
];

function source(name: string): string {
  return fs.readFileSync(path.join(uiDir, `${name}.tsx`), "utf-8");
}

describe("one focus ring across every control", () => {
  for (const name of FOCUSABLE) {
    describe(name, () => {
      it("has no ring offset", () => {
        expect(source(name)).not.toMatch(/ring-offset/);
      });

      it("uses the shared 3px ring", () => {
        expect(ringOf(source(name))).toContain(SHARED_RING);
      });

      it("triggers on focus-visible, not bare focus", () => {
        // `focus:ring` fires on mouse click too, which reads as a stuck
        // highlight. Only `focus-visible:` is allowed.
        expect(source(name)).not.toMatch(/(?<!-)\bfocus:ring/);
      });
    });
  }
});
