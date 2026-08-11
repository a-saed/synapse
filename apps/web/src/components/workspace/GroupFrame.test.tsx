import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    onRename: vi.fn(),
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

  it("enters edit mode when the name is clicked, and shows an input", async () => {
    const user = userEvent.setup();
    render(<GroupFrame {...makeProps(makeData())} />);
    await user.click(screen.getByRole("button", { name: "My Group" }));
    expect(screen.getByDisplayValue("My Group")).toBeInTheDocument();
  });

  it("commits the new name on Enter", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<GroupFrame {...makeProps(makeData({ onRename }))} />);
    await user.click(screen.getByRole("button", { name: "My Group" }));
    const input = screen.getByDisplayValue("My Group");
    await user.clear(input);
    await user.type(input, "Renamed Group{Enter}");
    expect(onRename).toHaveBeenCalledWith("Renamed Group");
  });

  it("commits the new name on blur", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<GroupFrame {...makeProps(makeData({ onRename }))} />);
    await user.click(screen.getByRole("button", { name: "My Group" }));
    const input = screen.getByDisplayValue("My Group");
    await user.clear(input);
    await user.type(input, "Renamed Group");
    fireEvent.blur(input);
    expect(onRename).toHaveBeenCalledWith("Renamed Group");
  });

  it("does not commit an unchanged or empty name", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<GroupFrame {...makeProps(makeData({ onRename }))} />);
    await user.click(screen.getByRole("button", { name: "My Group" }));
    fireEvent.blur(screen.getByDisplayValue("My Group"));
    expect(onRename).not.toHaveBeenCalled();
  });
});
