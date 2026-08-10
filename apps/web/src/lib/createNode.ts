import type { SynapseNode, SynapseGroup } from "@synapse/config-schema";
import { slugify } from "./slugify";

function uniqueId(base: string, existingIds: string[]): string {
  const slug = slugify(base);
  if (!existingIds.includes(slug)) return slug;
  let n = 2;
  while (existingIds.includes(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

export function createDefaultNode(
  kind: "tool" | "resource" | "prompt",
  existingIds: string[]
): SynapseNode {
  if (kind === "tool") {
    return {
      id: uniqueId("new-tool", existingIds),
      kind: "tool",
      name: "New Tool",
      description: "New tool",
      inputSchema: { type: "object", properties: {} },
      logic: { type: "code", code: "return null;" },
    };
  }
  if (kind === "resource") {
    return {
      id: uniqueId("new-resource", existingIds),
      kind: "resource",
      name: "New Resource",
      uri: "resource://new",
      description: "New resource",
      logic: { type: "code", code: "return null;" },
    };
  }
  return {
    id: uniqueId("new-prompt", existingIds),
    kind: "prompt",
    name: "New Prompt",
    description: "New prompt",
    arguments: [],
    logic: { type: "code", code: "return null;" },
  };
}

export function createDefaultGroup(existingIds: string[]): SynapseGroup {
  return {
    id: uniqueId("new-group", existingIds),
    name: "New Group",
    nodeIds: [],
  };
}
