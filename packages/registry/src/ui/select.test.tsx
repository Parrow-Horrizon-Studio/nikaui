import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select";

/**
 * Multiple selection.
 *
 * The behaviour that matters is not "can it hold an array" — Headless UI's
 * Listbox already does that — but what the trigger shows and whether the list
 * stays open. A multi-select that closes after every pick is unusable for its
 * only purpose, and a trigger that renders `a,b,c` as raw text is why people
 * write their own.
 */

const OPTIONS = ["Design", "Engineering", "Marketing", "Sales"];

function multi(value: string[], onChange = vi.fn()) {
  render(
    <Select multiple value={value} onChange={onChange}>
      <SelectTrigger>
        {({ value: v }) => (
          <SelectValue value={v} placeholder="Choose teams" max={2} />
        )}
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return onChange;
}

describe("Select multiple", () => {
  it("shows a placeholder when nothing is chosen", () => {
    multi([]);
    expect(screen.getByText("Choose teams")).toBeDefined();
  });

  it("renders each selection as its own chip", () => {
    multi(["Design", "Engineering"]);
    expect(screen.getByText("Design")).toBeDefined();
    expect(screen.getByText("Engineering")).toBeDefined();
  });

  it("collapses the tail into a count rather than overflowing the trigger", () => {
    multi(["Design", "Engineering", "Marketing", "Sales"]);
    expect(screen.getByText("+2")).toBeDefined();
  });

  it("reports an array and keeps the list open", () => {
    const onChange = multi([]);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: "Design" }));
    expect(onChange).toHaveBeenCalledWith(["Design"]);
    // Still open: the whole point of a multi-select.
    expect(screen.getByRole("listbox")).toBeDefined();
  });

  it("marks the listbox as accepting several values", () => {
    multi([]);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox").getAttribute("aria-multiselectable")).toBe("true");
  });
});

describe("SelectValue single", () => {
  it("renders a plain string without chip decoration", () => {
    render(
      <Select value="Design" onChange={() => {}}>
        <SelectTrigger>
          {({ value }) => (
            <SelectValue value={value} placeholder="Choose" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Design">Design</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText("Design")).toBeDefined();
  });
});
