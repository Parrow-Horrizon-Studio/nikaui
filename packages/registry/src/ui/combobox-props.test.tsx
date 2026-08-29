import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Combobox, ComboboxTrigger } from "./combobox";

/**
 * ComboboxTrigger accepts native input attributes.
 *
 * WHY THIS FILE EXISTS: its props resolved against an uninstantiated generic,
 * and the resulting type rejected `placeholder`, `id`, `name` and every other
 * native input attribute. A text input that could not take a placeholder.
 *
 * The real guard here is `pnpm check-types`, not the runtime assertion — a
 * regression would fail to compile this file long before the expectation
 * below ran. The render is what proves the attributes actually reach the DOM
 * rather than being accepted by the type and dropped.
 */
describe("ComboboxTrigger", () => {
  it("accepts and forwards native input attributes", () => {
    render(
      <Combobox>
        <ComboboxTrigger placeholder="Search components" id="q" name="q" />
      </Combobox>
    );
    // getByPlaceholderText succeeding is itself half the assertion: it
    // proves the attribute reached the DOM, not merely the type.
    const input = screen.getByPlaceholderText("Search components");
    expect(input.getAttribute("id")).toBe("q");
    expect(input.getAttribute("name")).toBe("q");
  });
});
