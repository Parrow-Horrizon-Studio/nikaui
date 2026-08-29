import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
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

/**
 * Submenus and multiple selection.
 *
 * These are the two capabilities that make this a component-sized piece of
 * work rather than a styling change: a submenu is a second floating layer
 * with focus crossing between it and its parent, and a checkbox item has to
 * NOT close the menu, which is the one behaviour that separates it from an
 * ordinary item.
 */

function openWithSub() {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Top</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More tools</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Deep item</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  fireEvent.click(screen.getByRole("button", { name: "Open" }));
}

describe("DropdownMenu submenus", () => {
  // WAI-ARIA: a submenu trigger is a menuitem with aria-haspopup, not a
  // button. An earlier version of this test asked for role="button" and was
  // wrong about the pattern, not about the implementation.
  it("renders a sub-trigger that advertises a submenu", () => {
    openWithSub();
    const trigger = screen.getByRole("menuitem", { name: /More tools/ });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens on ArrowRight", () => {
    openWithSub();
    const trigger = screen.getByRole("menuitem", { name: /More tools/ });
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Deep item")).toBeDefined();
  });

  // This one was missing, and its absence is why the defect it now covers
  // shipped: the browser showed focus staying on the trigger while every
  // jsdom assertion passed. "Opens" is not the same claim as "moves focus".
  it("moves focus into the panel when opened by keyboard", () => {
    openWithSub();
    const trigger = screen.getByRole("menuitem", { name: /More tools/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    expect(document.activeElement?.textContent).toContain("Deep item");
  });

  it("leaves focus alone when opened by hover", () => {
    // Pulling focus out from under someone who merely moved the mouse over a
    // menu is worse than not moving it at all.
    openWithSub();
    const trigger = screen.getByRole("menuitem", { name: /More tools/ });
    const before = document.activeElement;
    fireEvent.mouseEnter(trigger);
    expect(document.activeElement).toBe(before);
  });

  it("closes on ArrowLeft and returns focus to its trigger", () => {
    openWithSub();
    const trigger = screen.getByRole("menuitem", { name: /More tools/ });
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    const deep = screen.getByText("Deep item");
    fireEvent.keyDown(deep, { key: "ArrowLeft" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    // Focus must land back on the trigger, not on the root menu: losing your
    // place in the parent list is the thing that makes nested menus unusable
    // by keyboard.
    expect(document.activeElement).toBe(trigger);
  });
});

describe("DropdownMenuCheckboxItem", () => {
  it("reports its state through aria-checked", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Status bar</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>Activity bar</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    const items = screen.getAllByRole("menuitemcheckbox");
    expect(items).toHaveLength(2);
    expect(items[0]!.getAttribute("aria-checked")).toBe("true");
    expect(items[1]!.getAttribute("aria-checked")).toBe("false");
  });

  it("does not close the menu when toggled", () => {
    const seen: boolean[] = [];
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={false}
            onCheckedChange={(v) => seen.push(v)}
          >
            Status bar
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByRole("menuitemcheckbox"));
    expect(seen).toEqual([true]);
    // Still open: this is the whole difference from an ordinary item.
    expect(screen.getByRole("menuitemcheckbox")).toBeDefined();
  });
});
