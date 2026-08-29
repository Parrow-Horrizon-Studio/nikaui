import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./field";
import { Input } from "./input";
import { Textarea } from "./textarea";

/**
 * Field wires a control to its label, description and error.
 *
 * The visible half of an error state is easy and nearly worthless on its own:
 * a red border tells a sighted user something is wrong and tells a screen
 * reader nothing. What matters is `aria-invalid` on the control and an
 * `aria-describedby` that actually resolves to the message element. That
 * relationship is what these assert — not that a message rendered somewhere
 * on the page.
 */
describe("Field", () => {
  it("labels the control", () => {
    render(
      <Field label="Email">
        <Input />
      </Field>
    );
    // getByLabelText resolves the label/control relationship rather than
    // just finding the text, which is the point.
    expect(screen.getByLabelText("Email")).toBeDefined();
  });

  it("wires aria-invalid and aria-describedby to the message", () => {
    render(
      <Field label="Email" error="Enter a valid email address">
        <Input />
      </Field>
    );
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      "Enter a valid email address"
    );
  });

  it("describes the control with its help text when there is no error", () => {
    render(
      <Field label="Slug" description="Lowercase letters and dashes">
        <Input />
      </Field>
    );
    const input = screen.getByLabelText("Slug");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    const describedBy = input.getAttribute("aria-describedby");
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      "Lowercase letters and dashes"
    );
  });

  it("prefers the error over the description when both are present", () => {
    // Announcing the hint before the failure buries the failure.
    render(
      <Field label="Slug" description="Lowercase letters" error="Already taken">
        <Input />
      </Field>
    );
    const input = screen.getByLabelText("Slug");
    const describedBy = input.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toBe("Already taken");
  });

  it("marks a required field for both sighted and assistive users", () => {
    render(
      <Field label="Name" required>
        <Input />
      </Field>
    );
    const input = screen.getByLabelText(/Name/);
    expect(input.getAttribute("aria-required")).toBe("true");
  });

  it("works with a textarea too", () => {
    render(
      <Field label="Message" error="Too short">
        <Textarea />
      </Field>
    );
    expect(screen.getByLabelText("Message").getAttribute("aria-invalid")).toBe("true");
  });
});

describe("Input props", () => {
  it("shifts its padding for start content automatically", () => {
    // The reason icons are props rather than composed children: the padding
    // shift cannot be forgotten.
    render(<Input aria-label="q" startContent={<span>@</span>} />);
    expect(screen.getByLabelText("q").className).toMatch(/pl-\d/);
  });

  it("shifts its padding for end content", () => {
    render(<Input aria-label="q" endContent={<span>@</span>} />);
    expect(screen.getByLabelText("q").className).toMatch(/pr-\d/);
  });

  it.each([
    ["sm", "h-9"],
    ["md", "h-10"],
    ["lg", "h-11"],
  ])("size %s renders %s", (size, height) => {
    render(<Input aria-label="q" size={size as "sm" | "md" | "lg"} />);
    expect(screen.getByLabelText("q").className).toContain(height);
  });

  it("colours the border when invalid", () => {
    render(<Input aria-label="q" invalid />);
    expect(screen.getByLabelText("q").className).toContain("border-danger");
  });
});
