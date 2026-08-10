import { describe, it, expect } from "vitest";
import type { SynapseProject } from "@synapse/config-schema";
import { computeLayout, toAbsolutePosition, COLUMN_WIDTH } from "./autoLayout";

function project(overrides: Partial<SynapseProject>): SynapseProject {
  return {
    id: "p",
    name: "P",
    nodes: [],
    groups: [],
    exposedGroupIds: [],
    positions: {},
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

  it("does not assign a position to a pinned node id", () => {
    const p = project({
      nodes: [toolNode("a"), toolNode("b")],
      groups: [{ id: "g1", name: "g1", nodeIds: ["a", "b"] }],
    });
    const layout = computeLayout(p, new Set(["a"]));
    expect(layout).not.toHaveProperty("a");
    expect(layout).toHaveProperty("b");
  });

  it("does not waste a grid slot on a pinned group member", () => {
    const withoutPin = computeLayout(
      project({
        nodes: [toolNode("a"), toolNode("b")],
        groups: [{ id: "g1", name: "g1", nodeIds: ["a", "b"] }],
      })
    );
    const withPin = computeLayout(
      project({
        nodes: [toolNode("a"), toolNode("b")],
        groups: [{ id: "g1", name: "g1", nodeIds: ["a", "b"] }],
      }),
      new Set(["a"])
    );
    // "b" would normally be the second column (x = COLUMN_WIDTH); with "a"
    // pinned out of the auto-layout, "b" takes the first slot instead.
    expect(withoutPin.b.x).toBe(COLUMN_WIDTH);
    expect(withPin.b.x).toBe(0);
  });
});

describe("toAbsolutePosition", () => {
  it("returns the position unchanged when there is no parent origin", () => {
    expect(toAbsolutePosition({ x: 10, y: 20 }, undefined)).toEqual({ x: 10, y: 20 });
  });

  it("offsets by the parent origin when given one", () => {
    expect(toAbsolutePosition({ x: 10, y: 20 }, { x: 100, y: -50 })).toEqual({
      x: 110,
      y: -30,
    });
  });
});
