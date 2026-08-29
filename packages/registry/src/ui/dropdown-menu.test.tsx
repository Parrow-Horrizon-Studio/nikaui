import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "./dropdown-menu";

/**
 * Item slots and grouping.
 *
 * `DropdownMenuItem` took children and nothing else, so an icon, a keyboard
 * shortcut, a secondary description and a destructive action were each
 * something the consuming app laid out by hand — and therefore laid out
 * differently in every app. These are the four things a real menu needs, and
 * they belong in the component.
 *
 * `DropdownMenuLabel` already existed and was undocumented. It only labelled
 * visually: nothing tied it to the items beneath it, so a screen reader heard
 * a stray line of text rather than a group heading. `DropdownMenuGroup` gives
 * it a `role="group"` and an `aria-labelledby` that actually points at it.
 */

function open(extra: React.ReactNode = null) {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup label="My account">
          <DropdownMenuItem
            icon={<span data-testid="icon" />}
            shortcut="⇧⌘P"
            description="Your public profile"
          >
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem destructive>Log out</DropdownMenuItem>
        {extra}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  fireEvent.click(screen.getByRole("button", { name: "Open" }));
}

describe("DropdownMenuItem slots", () => {
  it("renders an icon without the consumer positioning it", () => {
    open();
    expect(screen.getByTestId("icon")).toBeDefined();
  });

  it("renders a shortcut hint", () => {
    open();
    expect(screen.getByText("⇧⌘P")).toBeDefined();
  });

  it("renders a description as a second line", () => {
    open();
    expect(screen.getByText("Your public profile")).toBeDefined();
  });

  it("marks a destructive item in the danger colour", () => {
    open();
    const item = screen.getByRole("menuitem", { name: /Log out/ });
    expect(item.className).toContain("text-danger");
  });

  it("leaves an ordinary item undecorated", () => {
    open();
    const item = screen.getByRole("menuitem", { name: /Profile/ });
    expect(item.className).not.toContain("text-danger");
  });
});

describe("DropdownMenuGroup", () => {
  it("ties its label to the group for assistive technology", () => {
    open();
    const group = screen.getByRole("group", { name: "My account" });
    expect(group).toBeDefined();
    // The accessible name must come from the visible heading, not a
    // duplicated aria-label that can drift away from it.
    const labelledBy = group.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)?.textContent).toBe("My account");
  });

  it("still renders its heading visibly", () => {
    open();
    expect(screen.getByText("My account")).toBeDefined();
  });
});
