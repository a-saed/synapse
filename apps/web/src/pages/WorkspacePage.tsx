import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { SynapseProject, SynapseNode } from "@synapse/config-schema";
import { useProject, useUpdateProject } from "../api/queries";
import { useAutosave } from "../hooks/useAutosave";
import { useWorkspaceStore } from "../store/workspaceStore";
import { Canvas } from "../components/workspace/Canvas";
import { NodeEditorPanel } from "../components/workspace/NodeEditorPanel";
import { PlaygroundDrawer } from "../components/workspace/PlaygroundDrawer";
import { ExportDialog } from "../components/workspace/ExportDialog";
import { CommandPalette, type CommandAction } from "../components/CommandPalette";
import { Button } from "../components/ui/button";

const SAVE_LABEL: Record<string, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loadedProject } = useProject(id!);
  const updateProject = useUpdateProject();
  const [project, setProject] = useState<SynapseProject | undefined>(undefined);
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null);

  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId);
  const selectNode = useWorkspaceStore((s) => s.selectNode);
  const togglePlayground = useWorkspaceStore((s) => s.togglePlayground);

  useEffect(() => {
    if (loadedProject && !project) setProject(loadedProject);
  }, [loadedProject, project]);

  // Selection/playground state lives in a module-level store, so switching to
  // a different project must clear it — otherwise a selected node id (or an
  // open playground) from the previous project leaks into the next one.
  useEffect(() => {
    setProject(undefined);
    useWorkspaceStore.getState().selectNode(null);
    useWorkspaceStore.getState().setPlaygroundOpen(false);
  }, [id]);

  const { status, retry } = useAutosave(project, (p) => updateProject.mutateAsync(p));

  if (!project) {
    return <p className="p-8 text-muted-foreground">Loading…</p>;
  }

  const selectedNode = project.nodes.find((n) => n.id === selectedNodeId) ?? null;

  function updateNode(updated: SynapseNode) {
    setProject((p) =>
      p ? { ...p, nodes: p.nodes.map((n) => (n.id === updated.id ? updated : n)) } : p
    );
  }

  function toggleGroupExposed(groupId: string) {
    setProject((p) => {
      if (!p) return p;
      const exposed = p.exposedGroupIds.includes(groupId)
        ? p.exposedGroupIds.filter((id) => id !== groupId)
        : [...p.exposedGroupIds, groupId];
      return { ...p, exposedGroupIds: exposed };
    });
  }

  const commandActions: CommandAction[] = [
    { id: "playground", label: "Open playground", run: togglePlayground },
    { id: "back", label: "Back to projects", run: () => navigate("/projects") },
  ];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">{project.name}</h1>
          <span className="text-xs text-muted-foreground">
            {SAVE_LABEL[status]}
            {status === "error" && (
              <Button variant="ghost" size="sm" onClick={retry} className="ml-2">
                Retry
              </Button>
            )}
          </span>
        </div>
        <ExportDialog projectId={project.id} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <Canvas
            project={project}
            runningNodeId={runningNodeId}
            onToggleGroupExposed={toggleGroupExposed}
          />
        </div>
        <NodeEditorPanel
          node={selectedNode}
          onChange={updateNode}
          onClose={() => selectNode(null)}
        />
      </div>

      <PlaygroundDrawer
        project={project}
        onRunStart={setRunningNodeId}
        onRunEnd={() => setRunningNodeId(null)}
      />

      <CommandPalette actions={commandActions} />
    </div>
  );
}
