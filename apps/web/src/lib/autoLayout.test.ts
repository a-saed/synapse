import { describe, it, expect } from "vitest";
import type { SynapseProject } from "@synapse/config-schema";
import { computeLayout } from "./autoLayout";

function project(overrides: Partial<SynapseProject>): SynapseProject {
  return {
    id: "p",
    name: "P",
    nodes: [],
    groups: [],
    exposedGroupIds: [],
    ...overrides,
  };
}

const toolNode = (id: string) => ({
  id,
  kind: "tool" as const,
  name: id,
  description: "",
  inputSchema: { type: "object" as const, properties: {} },
  logic: { type: "code" as const, code: "" },
});

describe("computeLayout", () => {
  it("returns an empty map for a project with no nodes", () => {
    expect(computeLayout(project({}))).toEqual({});
  });

  it("places every node in the returned map, one entry per node id", () => {
    const p = project({
      nodes: [toolNode("a"), toolNode("b")],
      groups: [{ id: "g1", name: "g1", nodeIds: ["a", "b"] }],
    });
    const layout = computeLayout(p);
    expect(Object.keys(layout).sort()).toEqual(["a", "b"]);
  });

  it("gives distinct nodes distinct positions", () => {
    const p = project({
      nodes: [toolNode("a"), toolNode("b")],
      groups: [{ id: "g1", name: "g1", nodeIds: ["a", "b"] }],
    });
    const layout = computeLayout(p);
    expect(layout.a).not.toEqual(layout.b);
  });

  it("places nodes belonging to no group as well as grouped nodes", () => {
    const p = project({
      nodes: [toolNode("a"), toolNode("orphan")],
      groups: [{ id: "g1", name: "g1", nodeIds: ["a"] }],
    });
    const layout = computeLayout(p);
    expect(Object.keys(layout).sort()).toEqual(["a", "orphan"]);
  });

  it("stacks distinct groups at distinct vertical positions", () => {
    const p = project({
      nodes: [toolNode("a"), toolNode("b")],
      groups: [
        { id: "g1", name: "g1", nodeIds: ["a"] },
        { id: "g2", name: "g2", nodeIds: ["b"] },
      ],
    });
    const layout = computeLayout(p);
    expect(layout.a.y).not.toBe(layout.b.y);
  });
});
