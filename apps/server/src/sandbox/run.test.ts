import { describe, it, expect } from "vitest";
import { runCode } from "./run.js";

describe("runCode", () => {
  it("returns the string returned by the code", async () => {
    const result = await runCode('return "hi " + input.name;', {
      name: "Ada",
    });
    expect(result).toEqual({ ok: true, result: "hi Ada" });
  });

  it("reports an error when the code throws", async () => {
    const result = await runCode('throw new Error("boom");', {});
    expect(result.ok).toBe(false);
    expect(result.error).toContain("boom");
  });

  it("reports an error when the code returns a non-string", async () => {
    const result = await runCode("return 42;", {});
    expect(result.ok).toBe(false);
    expect(result.error).toContain("must return a string");
  });

  it("times out on an infinite loop", async () => {
    const result = await runCode("while (true) {}", {}, 200);
    expect(result).toEqual({
      ok: false,
      error: "Execution timed out after 200ms",
    });
  }, 2000);
});
