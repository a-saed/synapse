import { describe, it, expect } from "vitest";
import { slugify, isValidProjectId } from "./slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Greet Server")).toBe("greet-server");
  });

  it("strips characters outside the allowed set", () => {
    expect(slugify("Hello, World! 2.0")).toBe("hello-world-20");
  });

  it("collapses repeated separators", () => {
    expect(slugify("a   b---c")).toBe("a-b-c");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  -Weird Name-  ")).toBe("weird-name");
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("isValidProjectId", () => {
  it("accepts letters, digits, underscore and dash", () => {
    expect(isValidProjectId("greet-server_v2")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidProjectId("")).toBe(false);
  });

  it("rejects slashes and dots", () => {
    expect(isValidProjectId("a/b")).toBe(false);
    expect(isValidProjectId("../evil")).toBe(false);
  });
});
