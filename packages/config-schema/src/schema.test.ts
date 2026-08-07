import { describe, it, expect } from "vitest";
import { synapseProjectSchema } from "./schema.js";

const validProject = {
  id: "proj-1",
  name: "Test Project",
  nodes: [
    {
      id: "tool-1",
      kind: "tool" as const,
      name: "greet",
      description: "Greets someone",
      inputSchema: {
        type: "object" as const,
        properties: { name: { type: "string" as const } },
        required: ["name"],
      },
      logic: { type: "code" as const, code: 'return "hi " + input.name;' },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["tool-1"] }],
  exposedGroupIds: ["g1"],
};

describe("synapseProjectSchema", () => {
  it("accepts a well-formed project", () => {
    expect(() => synapseProjectSchema.parse(validProject)).not.toThrow();
  });

  it("rejects a tool node missing code", () => {
    const broken = {
      ...validProject,
      nodes: [{ ...validProject.nodes[0], logic: { type: "code" } }],
    };
    expect(() => synapseProjectSchema.parse(broken)).toThrow();
  });

  it("rejects an unknown node kind", () => {
    const broken = {
      ...validProject,
      nodes: [{ ...validProject.nodes[0], kind: "widget" }],
    };
    expect(() => synapseProjectSchema.parse(broken)).toThrow();
  });
});
