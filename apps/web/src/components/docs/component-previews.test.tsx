import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { previews } from "./component-previews";

afterEach(cleanup);

/**
 * `previews` is a `Record<string, React.ReactNode>` — the values are already
 * *elements*, not component types, because `component-cards.tsx` consumes
 * them as `{previews[slug]}`. So these render `previews[slug]` directly
 * rather than `<Preview />`: the record's shape is the established interface
 * and the test follows it, not the other way round.
 *
 * The point of these is that the previews are live. A preview that renders a
 * component's static default demonstrates nothing a screenshot wouldn't, so
 * every interactive one is driven here with a real event and asserted on the
 * DOM it produces.
 */
describe("the five component previews added in sub-project D", () => {
  for (const slug of ["alert", "progress", "radio-group", "slider", "textarea"]) {
    it(`has a preview for ${slug}`, () => {
      expect(previews[slug]).toBeDefined();
    });
  }

  it("renders an interactive radio group that changes selection", async () => {
    render(previews["radio-group"]);
    const options = screen.getAllByRole("radio");
    // `:scope` matters: a bare "span span" resolves its ancestor part
    // against the whole document, so it would match the ring rather than the
    // dot inside it.
    const dot = (option: Element) =>
      option.querySelector(":scope > span > span") as HTMLElement;

    expect(options.length).toBeGreaterThan(1);
    expect(options[0]!.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(options[1]!);
    expect(options[1]!.getAttribute("aria-checked")).toBe("true");
    expect(options[0]!.getAttribute("aria-checked")).toBe("false");

    // The dot inside each option scales with the selection. Without this the
    // test would pass on a group whose ARIA state moved but whose visible
    // marker did not. Motion normalises an identity scale to
    // `transform: none`, so the selected dot is asserted as "not collapsed"
    // rather than as a literal `scale(1)`.
    await waitFor(() => {
      expect(dot(options[0]!).style.transform).toContain("scale(0)");
      expect(dot(options[1]!).style.transform).not.toContain("scale(0)");
    });
  });

  it("renders a textarea that accepts input", () => {
    render(previews["textarea"]);
    const field = screen.getByRole("textbox");
    fireEvent.change(field, { target: { value: "hello" } });
    expect((field as HTMLTextAreaElement).value).toBe("hello");
    // The counter proves the change reached React state rather than only the
    // DOM node — a preview whose `value` never round-trips through `useState`
    // would still pass the assertion above.
    expect(screen.getByText("5 / 120")).toBeDefined();
  });

  it("renders a slider whose displayed value tracks the input", () => {
    render(previews["slider"]);
    const slider = screen.getByRole("slider");
    expect((slider as HTMLInputElement).value).toBe("50");
    fireEvent.change(slider, { target: { value: "80" } });
    expect((slider as HTMLInputElement).value).toBe("80");
    expect(screen.getByText("80")).toBeDefined();
  });

  it("renders a determinate progress bar that reports a real value", async () => {
    render(previews["progress"]);
    const bar = screen.getByRole("progressbar");
    const fill = bar.firstElementChild as HTMLElement;
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(fill.style.width).toBe("40%");

    fireEvent.click(screen.getByRole("button", { name: "Advance" }));
    expect(bar.getAttribute("aria-valuenow")).toBe("60");
    // The fill is animated, so it arrives a few frames later. Asserting it
    // at all is the point: `aria-valuenow` alone would still pass on a bar
    // whose visible fill never moved.
    await waitFor(() => expect(fill.style.width).toBe("60%"), { timeout: 3000 });
  });

  it("renders more than one alert variant", () => {
    render(previews["alert"]);
    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(1);
    expect(screen.getByText("Changes saved")).toBeDefined();
    expect(screen.getByText("Upload failed")).toBeDefined();
    // Two different variants, not the same one twice — the variant is the
    // only thing this preview has to demonstrate.
    expect(alerts[0]!.className).toContain("success");
    expect(alerts[1]!.className).toContain("danger");
  });
});

/**
 * Not one of the five, but the same defect class: the combobox preview used
 * to be a `<div>` styled to look like the component. A preview that previews
 * nothing is worse than no preview, because it reads as evidence the
 * component works.
 */
describe("the combobox preview", () => {
  it("renders the real Combobox rather than a look-alike element", () => {
    render(previews["combobox"]);
    const input = screen.getByRole("combobox", { name: "Framework" });
    expect(input.tagName).toBe("INPUT");
    // The selection is rendered through the component's own `displayValue`,
    // which a styled `<div>` has no way to produce.
    expect((input as HTMLInputElement).value).toBe("React");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });
});
