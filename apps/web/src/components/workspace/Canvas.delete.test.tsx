import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  groups: [],
  exposedGroupIds: [],
  positions: {},
};

describe("Canvas node deletion", () => {
  it("calls onDeleteNode with the node id after confirming delete", async () => {
    const user = userEvent.setup();
    const onDeleteNode = vi.fn();
    render(
      <Canvas
        project={project}
        runningNodeId={null}
        onToggleGroupExposed={() => {}}
        onAddRequest={() => {}}
        onDeleteNode={onDeleteNode}
        onDeleteGroup={() => {}}
      />
    );

    // Delete trigger is inside React Flow's draggable node wrapper, whose
    // d3-drag handling crashes under userEvent's synthetic mousedown in
    // jsdom (missing `event.view`) — established fireEvent workaround.
    fireEvent.click(screen.getByRole("button", { name: /delete greet/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onDeleteNode).toHaveBeenCalledWith("greet");
  });

  it("does not call onDeleteNode when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onDeleteNode = vi.fn();
    render(
      <Canvas
        project={project}
        runningNodeId={null}
        onToggleGroupExposed={() => {}}
        onAddRequest={() => {}}
        onDeleteNode={onDeleteNode}
        onDeleteGroup={() => {}}
      />
    );

    // Delete trigger is inside React Flow's draggable node wrapper, whose
    // d3-drag handling crashes under userEvent's synthetic mousedown in
    // jsdom (missing `event.view`) — established fireEvent workaround.
    fireEvent.click(screen.getByRole("button", { name: /delete greet/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onDeleteNode).not.toHaveBeenCalled();
    expect(screen.getByText("greet")).toBeInTheDocument();
  });
});

const groupedProject: SynapseProject = {
  id: "p2",
  name: "P2",
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

describe("Canvas group deletion", () => {
  it("calls onDeleteGroup with the group id after confirming delete", async () => {
    const user = userEvent.setup();
    const onDeleteGroup = vi.fn();
    render(
      <Canvas
        project={groupedProject}
        runningNodeId={null}
        onToggleGroupExposed={() => {}}
        onAddRequest={() => {}}
        onDeleteNode={() => {}}
        onDeleteGroup={onDeleteGroup}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /delete default/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onDeleteGroup).toHaveBeenCalledWith("g1");
  });
});
