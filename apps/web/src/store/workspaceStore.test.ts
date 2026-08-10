import { describe, it, expect, beforeEach } from "vitest";
import { useWorkspaceStore } from "./workspaceStore";

describe("useWorkspaceStore", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ selectedNodeId: null, playgroundOpen: false });
  });

  it("selects and deselects a node", () => {
    useWorkspaceStore.getState().selectNode("tool-1");
    expect(useWorkspaceStore.getState().selectedNodeId).toBe("tool-1");

    useWorkspaceStore.getState().selectNode(null);
    expect(useWorkspaceStore.getState().selectedNodeId).toBeNull();
  });

  it("toggles the playground open state", () => {
    expect(useWorkspaceStore.getState().playgroundOpen).toBe(false);
    useWorkspaceStore.getState().togglePlayground();
    expect(useWorkspaceStore.getState().playgroundOpen).toBe(true);
    useWorkspaceStore.getState().togglePlayground();
    expect(useWorkspaceStore.getState().playgroundOpen).toBe(false);
  });

  it("sets the playground open state directly", () => {
    useWorkspaceStore.getState().setPlaygroundOpen(true);
    expect(useWorkspaceStore.getState().playgroundOpen).toBe(true);
  });
});
