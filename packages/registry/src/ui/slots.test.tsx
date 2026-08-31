import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Alert, AlertTitle } from "./alert";
import { Avatar, AvatarFallback, AvatarGroup } from "./avatar";
import { Progress } from "./progress";
import { Spinner } from "./spinner";
import { Separator } from "./separator";

describe("Alert", () => {
  it("dismisses through a button with an accessible name", () => {
    const onDismiss = vi.fn();
    render(
      <Alert onDismiss={onDismiss}>
        <AlertTitle>Saved</AlertTitle>
      </Alert>
    );
    // Named, not an unlabelled icon: a bare × is invisible to a screen reader.
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("has no dismiss button unless it can be dismissed", () => {
    render(<Alert><AlertTitle>Saved</AlertTitle></Alert>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders an action alongside the message", () => {
    render(
      <Alert action={<button>View logs</button>}>
        <AlertTitle>Deploy failed</AlertTitle>
      </Alert>
    );
    expect(screen.getByRole("button", { name: "View logs" })).toBeDefined();
  });
});

describe("Avatar", () => {
  it.each([
    ["xs", "size-6"],
    ["sm", "size-8"],
    ["md", "size-10"],
    ["lg", "size-13"],
    ["xl", "size-17"],
  ])("size %s renders %s", (size, cls) => {
    const { container } = render(
      <Avatar size={size as "xs" | "sm" | "md" | "lg" | "xl"}>
        <AvatarFallback>RA</AvatarFallback>
      </Avatar>
    );
    expect((container.firstElementChild as HTMLElement).className).toContain(cls);
  });

  it("announces a status rather than showing a bare coloured dot", () => {
    render(
      <Avatar status="online">
        <AvatarFallback>RA</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("online")).toBeDefined();
  });

  it("collapses a group past its max into a count", () => {
    render(
      <AvatarGroup max={2}>
        <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
        <Avatar><AvatarFallback>B</AvatarFallback></Avatar>
        <Avatar><AvatarFallback>C</AvatarFallback></Avatar>
        <Avatar><AvatarFallback>D</AvatarFallback></Avatar>
      </AvatarGroup>
    );
    expect(screen.getByText("+2")).toBeDefined();
    expect(screen.queryByText("C")).toBeNull();
  });
});

describe("Progress", () => {
  it("shows a label and value without the consumer building a row", () => {
    render(<Progress value={62} label="Uploading" showValue />);
    expect(screen.getByText("Uploading")).toBeDefined();
    expect(screen.getByText("62%")).toBeDefined();
  });

  it("keeps the value out of the accessibility tree twice over", () => {
    // The bar already reports aria-valuenow; a visible duplicate must not be
    // announced again.
    render(<Progress value={62} showValue />);
    expect(screen.getByText("62%").getAttribute("aria-hidden")).toBe("true");
  });
});

describe("Spinner", () => {
  it("labels itself for assistive technology", () => {
    render(<Spinner label="Deploying" />);
    expect(screen.getByText("Deploying")).toBeDefined();
  });

  it.each([["right", "flex-row"], ["bottom", "flex-col"]])(
    "places its label %s",
    (placement, cls) => {
      const { container } = render(
        <Spinner label="Loading" labelPlacement={placement as "right" | "bottom"} />
      );
      expect((container.firstElementChild as HTMLElement).className).toContain(cls);
    }
  );
});

describe("Separator", () => {
  it("centres a label between two rules", () => {
    render(<Separator label="OR" />);
    expect(screen.getByText("OR")).toBeDefined();
  });

  it("keeps its decorative default, so the label is the only thing announced", () => {
    // Separator is decorative unless told otherwise, and that is right here:
    // the label is real text in the DOM and is read on its own. A role of
    // "separator" would add an announcement without adding information.
    const { container } = render(<Separator label="OR" />);
    expect((container.firstElementChild as HTMLElement).getAttribute("role")).toBe("none");
  });

  it("claims the separator role when asked to be semantic", () => {
    render(<Separator label="OR" decorative={false} />);
    expect(screen.getByRole("separator")).toBeDefined();
  });
});
