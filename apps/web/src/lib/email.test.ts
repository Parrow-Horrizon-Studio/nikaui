import { describe, expect, it } from "vitest";
import { isValidEmail } from "./email";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("luffy@nika.dev")).toBe(true);
    expect(isValidEmail("a.b+tag@sub.example.co.uk")).toBe(true);
  });

  it("rejects addresses with no domain part", () => {
    expect(isValidEmail("luffy@")).toBe(false);
    expect(isValidEmail("luffy")).toBe(false);
  });

  it("rejects addresses with no local part", () => {
    expect(isValidEmail("@nika.dev")).toBe(false);
  });

  it("rejects whitespace and empty input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
    expect(isValidEmail("lu ffy@nika.dev")).toBe(false);
  });

  it("rejects anything that is not a string", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail({ email: "luffy@nika.dev" })).toBe(false);
  });

  it("rejects an address long enough to be an attack", () => {
    expect(isValidEmail(`${"a".repeat(320)}@nika.dev`)).toBe(false);
  });
});
