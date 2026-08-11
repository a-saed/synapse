import { describe, it, expect, vi } from "vitest";
import type { SynapseProject } from "@synapse/config-schema";
import { handleGroupDragStop } from "./Canvas";

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

describe("handleGroupDragStop", () => {
  it("computes each member's new position from the drag delta and calls onPositionChange once per member", () => {
    const p = project({
      nodes: [toolNode("a"), toolNode("b")],
      groups: [{ id: "g1", name: "g1", nodeIds: ["a", "b"] }],
    });
    const positions = { a: { x: 0, y: 0 }, b: { x: 50, y: 10 } };
    const groupBounds = new Map([["g1", { originX: 100, originY: 100, width: 10, height: 10 }]]);
    const onPositionChange = vi.fn();

    // Group moved +40 in x, +30 in y.
    handleGroupDragStop(p, positions, groupBounds, "g1", { x: 140, y: 130 }, onPositionChange);

    expect(onPositionChange).toHaveBeenCalledTimes(2);
    expect(onPositionChange).toHaveBeenCalledWith("a", { x: 40, y: 30 });
    expect(onPositionChange).toHaveBeenCalledWith("b", { x: 90, y: 40 });
  });

  it("does not call onPositionChange when groupBounds has no entry for the group id", () => {
    const p = project({
      nodes: [toolNode("a")],
      groups: [{ id: "g1", name: "g1", nodeIds: ["a"] }],
    });
    const positions = { a: { x: 0, y: 0 } };
    const groupBounds = new Map<string, { originX: number; originY: number; width: number; height: number }>();
    const onPositionChange = vi.fn();

    handleGroupDragStop(p, positions, groupBounds, "g1", { x: 10, y: 10 }, onPositionChange);

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("does not call onPositionChange when the group id isn't found in project.groups", () => {
    const p = project({
      nodes: [toolNode("a")],
      groups: [],
    });
    const positions = { a: { x: 0, y: 0 } };
    const groupBounds = new Map([["g1", { originX: 0, originY: 0, width: 10, height: 10 }]]);
    const onPositionChange = vi.fn();

    handleGroupDragStop(p, positions, groupBounds, "g1", { x: 10, y: 10 }, onPositionChange);

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("filters out member ids with no entry in positions rather than persisting a fallback {0,0}-based position", () => {
    const p = project({
      nodes: [toolNode("a")],
      groups: [{ id: "g1", name: "g1", nodeIds: ["a", "phantom"] }],
    });
    const positions = { a: { x: 0, y: 0 } };
    const groupBounds = new Map([["g1", { originX: 100, originY: 100, width: 10, height: 10 }]]);
    const onPositionChange = vi.fn();

    handleGroupDragStop(p, positions, groupBounds, "g1", { x: 110, y: 105 }, onPositionChange);

    expect(onPositionChange).toHaveBeenCalledTimes(1);
    expect(onPositionChange).toHaveBeenCalledWith("a", { x: 10, y: 5 });
  });
});
