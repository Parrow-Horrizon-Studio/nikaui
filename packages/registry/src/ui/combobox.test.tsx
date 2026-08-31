import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Combobox,
  ComboboxTrigger,
  ComboboxChips,
  ComboboxContent,
  ComboboxItem,
} from "./combobox";

/**
 * Multiple selection, built to match Select's so the two read as siblings.
 *
 * ComboboxChips is a near-copy of SelectValue rather than an import from
 * select.tsx. That duplication is deliberate: these files are installed
 * individually — `nika add combobox` must not drag in select — and in a
 * copy-into-your-project registry, a shared helper is a dependency the
 * consumer did not ask for.
 */
describe("Combobox multiple", () => {
  const OPTIONS = ["Design", "Engineering", "Marketing", "Sales"];

  function multi(value: string[], onChange = vi.fn()) {
    render(
      <Combobox multiple value={value} onChange={onChange}>
        <ComboboxChips value={value} max={2} />
        <ComboboxTrigger placeholder="Search teams" />
        <ComboboxContent>
          {OPTIONS.map((o) => (
            <ComboboxItem key={o} value={o}>
              {o}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    );
    return onChange;
  }

  it("renders each selection as a chip", () => {
    multi(["Design", "Engineering"]);
    expect(screen.getByText("Design")).toBeDefined();
    expect(screen.getByText("Engineering")).toBeDefined();
  });

  it("collapses the tail into a count", () => {
    multi(["Design", "Engineering", "Marketing", "Sales"]);
    expect(screen.getByText("+2")).toBeDefined();
  });

  it("renders nothing at all when empty, rather than an empty row", () => {
    const { container } = render(<ComboboxChips value={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("still accepts native input attributes on the trigger", () => {
    // The H1 defect, re-asserted here because multiple selection reworks the
    // same component and this is the regression that would go unnoticed.
    multi([]);
    const input = screen.getByPlaceholderText("Search teams");
    expect(input.tagName).toBe("INPUT");
  });
});
