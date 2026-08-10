import { create } from "zustand";

interface WorkspaceState {
  selectedNodeId: string | null;
  playgroundOpen: boolean;
  selectNode: (id: string | null) => void;
  togglePlayground: () => void;
  setPlaygroundOpen: (open: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedNodeId: null,
  playgroundOpen: false,
  selectNode: (id) => set({ selectedNodeId: id }),
  togglePlayground: () => set((s) => ({ playgroundOpen: !s.playgroundOpen })),
  setPlaygroundOpen: (open) => set({ playgroundOpen: open }),
}));
