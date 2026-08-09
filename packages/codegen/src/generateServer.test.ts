import { describe, it, expect } from "vitest";
import type { SynapseProject } from "@synapse/config-schema";
import { generateServer } from "./generateServer.js";

const project: SynapseProject = {
  id: "greet-server",
  name: "greet-server",
  nodes: [
    {
      id: "tool-1",
      kind: "tool",
      name: "greet",
      description: "Greets someone",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
      logic: { type: "code", code: 'return "hi " + input.name;' },
    },
    {
      id: "tool-2",
      kind: "tool",
      name: "hidden",
      description: "Not exposed",
      inputSchema: { type: "object", properties: {} },
      logic: { type: "code", code: 'return "should not appear";' },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["tool-1"] }],
  exposedGroupIds: ["g1"],
};

describe("generateServer", () => {
  it("generates an index.ts registering only exposed tools", () => {
    const files = generateServer(project);
    const index = files.find((f) => f.path === "index.ts");
    expect(index).toBeDefined();
    expect(index!.contents).toContain('"greet"');
    expect(index!.contents).toContain('return "hi " + input.name;');
    expect(index!.contents).not.toContain("should not appear");
  });

  it("generates a package.json with the MCP SDK dependency", () => {
    const files = generateServer(project);
    const pkg = files.find((f) => f.path === "package.json");
    expect(pkg).toBeDefined();
    const parsed = JSON.parse(pkg!.contents);
    expect(parsed.dependencies["@modelcontextprotocol/sdk"]).toBeDefined();
  });

  it("registers tools with a Zod raw shape inputSchema, not raw JSON Schema", () => {
    const files = generateServer(project);
    const index = files.find((f) => f.path === "index.ts");
    expect(index).toBeDefined();
    expect(index!.contents).toContain("jsonSchemaToZodShape(");
    expect(index!.contents).not.toContain('inputSchema: {"type":"object"');
    expect(index!.contents).toContain('import { z } from "zod";');
  });
});
