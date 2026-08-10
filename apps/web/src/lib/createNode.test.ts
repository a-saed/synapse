import { describe, it, expect } from "vitest";
import {
  toolNodeSchema,
  resourceNodeSchema,
  promptNodeSchema,
  synapseGroupSchema,
} from "@synapse/config-schema";
import { createDefaultNode, createDefaultGroup } from "./createNode";

describe("createDefaultNode", () => {
  it("creates a tool that satisfies toolNodeSchema", () => {
    const node = createDefaultNode("tool", []);
    expect(node.id).toBe("new-tool");
    expect(node.name).toBe("New Tool");
    expect(toolNodeSchema.safeParse(node).success).toBe(true);
  });

  it("creates a resource that satisfies resourceNodeSchema", () => {
    const node = createDefaultNode("resource", []);
    expect(node.id).toBe("new-resource");
    expect(resourceNodeSchema.safeParse(node).success).toBe(true);
  });

  it("creates a prompt that satisfies promptNodeSchema", () => {
    const node = createDefaultNode("prompt", []);
    expect(node.id).toBe("new-prompt");
    expect(promptNodeSchema.safeParse(node).success).toBe(true);
  });

  it("de-dupes the id against existing ids by appending -2, -3, ...", () => {
    expect(createDefaultNode("tool", ["new-tool"]).id).toBe("new-tool-2");
    expect(createDefaultNode("tool", ["new-tool", "new-tool-2"]).id).toBe("new-tool-3");
  });
});

describe("createDefaultGroup", () => {
  it("creates a group that satisfies synapseGroupSchema", () => {
    const group = createDefaultGroup([]);
    expect(group.id).toBe("new-group");
    expect(group.name).toBe("New Group");
    expect(group.nodeIds).toEqual([]);
    expect(synapseGroupSchema.safeParse(group).success).toBe(true);
  });

  it("de-dupes the id against existing ids", () => {
    expect(createDefaultGroup(["new-group"]).id).toBe("new-group-2");
  });
});
