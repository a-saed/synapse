import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { NodeProps } from "@xyflow/react";
import { GroupFrame, type GroupFrameData } from "./GroupFrame";

// Minimal-but-valid NodeProps, built by hand since these tests render
// GroupFrame directly rather than through a <ReactFlow> provider — the
// same approach NodeCard.test.tsx uses.
function makeProps(data: GroupFrameData): NodeProps & { data: GroupFrameData } {
  return {
    id: "g1",
    type: "synapseGroup",
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

function makeData(overrides: Partial<GroupFrameData> = {}): GroupFrameData {
  return {
    name: "My Group",
    exposed: true,
    onToggleExposed: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

describe("GroupFrame", () => {
  it("renders a drag handle", () => {
    render(<GroupFrame {...makeProps(makeData())} />);
    expect(document.querySelector(".drag-handle")).not.toBeNull();
  });

  it("still renders the group name and exposed switch", () => {
    render(<GroupFrame {...makeProps(makeData())} />);
    expect(screen.getByText("My Group")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
  });
});
