// This project's Vitest pipeline has no automatic-JSX-runtime plugin
// configured (apps/web/tsconfig.json sets "jsx": "preserve", meant for
// Next's own SWC build, not Vite/esbuild), so any test file using JSX
// syntax needs React in scope for the classic transform — the same reason
// site/theme-toggle.test.tsx and site/accent-switcher.test.tsx import it.
import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InstallBar } from "./install-bar";

describe("InstallBar", () => {
  it("shows the command it was given", () => {
    render(<InstallBar command="npx nikaui add button" />);
    expect(screen.getByText(/npx nikaui add button/)).toBeDefined();
  });

  it("labels its copy control for screen readers", () => {
    render(<InstallBar command="npx nikaui add button" />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();
  });
});
