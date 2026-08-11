import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { SynapseProject } from "@synapse/config-schema";
import { Canvas } from "./Canvas";

const project: SynapseProject = {
  id: "p",
  name: "P",
  nodes: [
    {
      id: "greet",
      kind: "tool",
      name: "greet",
      description: "",
      inputSchema: { type: "object", properties: {} },
      logic: { type: "code", code: "" },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["greet"] }],
  exposedGroupIds: ["g1"],
  positions: {},
};

describe("Canvas group frames", () => {
  it("renders the group name and an exposed switch reflecting exposedGroupIds", () => {
    render(
      <Canvas project={project} runningNodeId={null} onToggleGroupExposed={vi.fn()} onAddRequest={() => {}} onDeleteNode={() => {}} onDeleteGroup={() => {}} onPositionChange={() => {}} onRenameGroup={() => {}} />
    );
    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
  });

  it("calls onToggleGroupExposed with the group id when its switch is clicked", () => {
    const onToggle = vi.fn();
    render(
      <Canvas
        project={project}
        runningNodeId={null}
        onToggleGroupExposed={onToggle}
        onAddRequest={() => {}}
        onDeleteNode={() => {}}
        onDeleteGroup={() => {}}
        onPositionChange={() => {}}
        onRenameGroup={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledWith("g1");
  });

  it("shows the switch unchecked for a group not in exposedGroupIds", () => {
    const notExposed: SynapseProject = { ...project, exposedGroupIds: [] };
    render(<Canvas project={notExposed} runningNodeId={null} onToggleGroupExposed={vi.fn()} onAddRequest={() => {}} onDeleteNode={() => {}} onDeleteGroup={() => {}} onPositionChange={() => {}} onRenameGroup={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "unchecked");
  });
});
