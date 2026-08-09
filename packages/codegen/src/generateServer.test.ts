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

const projectWithAllKinds: SynapseProject = {
  ...project,
  nodes: [
    ...project.nodes,
    {
      id: "resource-1",
      kind: "resource",
      name: "readme",
      uri: "synapse://readme",
      description: "Project readme",
      logic: { type: "code", code: 'return "readme contents";' },
    },
    {
      id: "prompt-1",
      kind: "prompt",
      name: "summarize",
      description: "Summarize something",
      arguments: [
        { name: "topic", description: "What to summarize", required: true },
      ],
      logic: { type: "code", code: 'return "Summarize: " + input.topic;' },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["tool-1", "resource-1", "prompt-1"] }],
};

describe("generateServer with resources and prompts", () => {
  it("registers exposed resource nodes", () => {
    const files = generateServer(projectWithAllKinds);
    const index = files.find((f) => f.path === "index.ts")!;
    expect(index.contents).toContain("server.registerResource(");
    expect(index.contents).toContain('"readme"');
    expect(index.contents).toContain("synapse://readme");
  });

  it("registers exposed prompt nodes with their arguments", () => {
    const files = generateServer(projectWithAllKinds);
    const index = files.find((f) => f.path === "index.ts")!;
    expect(index.contents).toContain("server.registerPrompt(");
    expect(index.contents).toContain('"summarize"');
    expect(index.contents).toContain("topic: z.string()");
  });
});
