import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { NodeProps } from "@xyflow/react";
import type { SynapseNode } from "@synapse/config-schema";
import { NodeCard, type NodeCardData } from "./NodeCard";

const node: SynapseNode = {
  id: "greet",
  kind: "tool",
  name: "greet",
  description: "Greets someone",
  inputSchema: { type: "object", properties: {} },
  logic: { type: "code", code: "" },
};

// Minimal-but-valid NodeProps, built by hand since these tests render
// NodeCard directly rather than through a <ReactFlow> provider.
function makeProps(data: NodeCardData): NodeProps & { data: NodeCardData } {
  return {
    id: node.id,
    type: "synapseNode",
    data,
    dragging: false,
    zIndex: 0,
    selectable: true,
    deletable: true,
    selected: false,
    draggable: true,
    isConnectable: false,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  };
}

describe("NodeCard", () => {
  it("pulses instead of playing the mount animation when the node is running", () => {
    render(
      <NodeCard {...makeProps({ node, running: true, onDelete: () => {} })} />
    );
    const card = screen.getByTestId(`node-${node.id}`);
    expect(card.className).toContain("animate-pulse");
    expect(card.className).not.toContain("animate-scale-in");
  });

  it("plays the mount animation instead of pulsing when the node is not running", () => {
    render(
      <NodeCard {...makeProps({ node, running: false, onDelete: () => {} })} />
    );
    const card = screen.getByTestId(`node-${node.id}`);
    expect(card.className).toContain("animate-scale-in");
    expect(card.className).not.toContain("animate-pulse");
  });
});
