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

// These do not claim the vm is a security boundary (it is not — see the
// comment at the top of worker.cjs). They pin the specific, trivially
// reachable host-realm escape hatches that the original context object
// exposed by passing `console`/`JSON`/`Promise`/`fetch` straight in, so a
// future edit that reintroduces a host object reference fails loudly.
describe("runCode sandbox context hygiene", () => {
  const escapeVectors: Array<[string, string]> = [
    ["JSON", 'return String(JSON.constructor.constructor("return process")().env.HOME);'],
    ["input", 'return String(input.constructor.constructor("return process")().env.HOME);'],
    ["this", 'return String(this.constructor.constructor("return process")().env.HOME);'],
    [
      "globalThis",
      'return String(globalThis.constructor.constructor("return process")().env.HOME);',
    ],
    ["Array literal", 'return String([].constructor.constructor("return process")().env.HOME);'],
    [
      "function constructor",
      'return String((function () {}).constructor("return process")().env.HOME);',
    ],
  ];

  it.each(escapeVectors)(
    "does not yield a host process handle via %s.constructor.constructor",
    async (_label, code) => {
      const result = await runCode(code, { name: "Ada" });
      expect(result.ok).toBe(false);
      expect(result.error).toContain("process is not defined");
      expect(result.result).toBeUndefined();
    }
  );

  it("does not expose require, process, fetch or console-based host access", async () => {
    const result = await runCode(
      'return [typeof require, typeof process, typeof module, typeof fetch].join(",");',
      {}
    );
    expect(result).toEqual({
      ok: true,
      result: "undefined,undefined,undefined,undefined",
    });
  });

  it("cannot pollute the host realm's Object.prototype", async () => {
    const result = await runCode(
      'Object.prototype.synapsePolluted = "yes"; return "done";',
      {}
    );
    expect(result.ok).toBe(true);
    expect(
      (Object.prototype as Record<string, unknown>).synapsePolluted
    ).toBeUndefined();
  });

  it("still provides realm-local JSON and Promise to code blocks", async () => {
    const result = await runCode(
      'const v = await Promise.resolve(input.name); return JSON.stringify({ hi: v });',
      { name: "Ada" }
    );
    expect(result).toEqual({ ok: true, result: '{"hi":"Ada"}' });
  });

  it("passes structured input through as a plain object", async () => {
    const result = await runCode(
      "return input.list.map((n) => n * 2).join(\"-\") + \"/\" + input.nested.deep;",
      { list: [1, 2, 3], nested: { deep: "ok" } }
    );
    expect(result).toEqual({ ok: true, result: "2-4-6/ok" });
  });
});
