import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { SynapseProject } from "@synapse/config-schema";
import { Canvas } from "./Canvas";
import { useWorkspaceStore } from "../../store/workspaceStore";

const project: SynapseProject = {
  id: "p",
  name: "P",
  nodes: [
    {
      id: "greet",
      kind: "tool",
      name: "greet",
      description: "Greets someone",
      inputSchema: { type: "object", properties: {} },
      logic: { type: "code", code: "" },
    },
    {
      id: "readme",
      kind: "resource",
      name: "readme",
      uri: "synapse://readme",
      description: "",
      logic: { type: "code", code: "" },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["greet", "readme"] }],
  exposedGroupIds: ["g1"],
  positions: {},
};

describe("Canvas", () => {
  it("renders one node card per project node", () => {
    render(
      <Canvas
        project={project}
        runningNodeId={null}
        onToggleGroupExposed={() => {}}
        onAddRequest={() => {}}
        onDeleteNode={() => {}}
        onDeleteGroup={() => {}}
      />
    );
    expect(screen.getByText("greet")).toBeInTheDocument();
    expect(screen.getByText("readme")).toBeInTheDocument();
  });

  it("selects a node in the workspace store when clicked", () => {
    render(
      <Canvas
        project={project}
        runningNodeId={null}
        onToggleGroupExposed={() => {}}
        onAddRequest={() => {}}
        onDeleteNode={() => {}}
        onDeleteGroup={() => {}}
      />
    );
    fireEvent.click(screen.getByText("greet"));
    expect(useWorkspaceStore.getState().selectedNodeId).toBe("greet");
  });

  it("marks the running node as pulsing", () => {
    render(
      <Canvas
        project={project}
        runningNodeId="greet"
        onToggleGroupExposed={() => {}}
        onAddRequest={() => {}}
        onDeleteNode={() => {}}
        onDeleteGroup={() => {}}
      />
    );
    expect(screen.getByTestId("node-greet")).toHaveAttribute("data-running", "true");
    expect(screen.getByTestId("node-readme")).toHaveAttribute("data-running", "false");
  });

  it("calls onAddRequest with viewport coordinates when the pane is right-clicked", () => {
    const onAddRequest = vi.fn();
    const { container } = render(
      <Canvas
        project={project}
        runningNodeId={null}
        onToggleGroupExposed={() => {}}
        onAddRequest={onAddRequest}
        onDeleteNode={() => {}}
        onDeleteGroup={() => {}}
      />
    );
    const pane = container.querySelector(".react-flow__pane");
    expect(pane).not.toBeNull();
    fireEvent.contextMenu(pane as Element, { clientX: 123, clientY: 45 });
    expect(onAddRequest).toHaveBeenCalledWith({ x: 123, y: 45 });
  });
});
