import { describe, it, expect } from "vitest";
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
};

describe("Canvas", () => {
  it("renders one node card per project node", () => {
    render(<Canvas project={project} runningNodeId={null} onToggleGroupExposed={() => {}} />);
    expect(screen.getByText("greet")).toBeInTheDocument();
    expect(screen.getByText("readme")).toBeInTheDocument();
  });

  it("selects a node in the workspace store when clicked", () => {
    render(<Canvas project={project} runningNodeId={null} onToggleGroupExposed={() => {}} />);
    fireEvent.click(screen.getByText("greet"));
    expect(useWorkspaceStore.getState().selectedNodeId).toBe("greet");
  });

  it("marks the running node as pulsing", () => {
    render(<Canvas project={project} runningNodeId="greet" onToggleGroupExposed={() => {}} />);
    expect(screen.getByTestId("node-greet")).toHaveAttribute("data-running", "true");
    expect(screen.getByTestId("node-readme")).toHaveAttribute("data-running", "false");
  });
});
