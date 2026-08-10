import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SynapseProject } from "@synapse/config-schema";
import { computeLayout } from "../../lib/autoLayout";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { NodeCard, type NodeCardData } from "./NodeCard";

const nodeTypes = { synapseNode: NodeCard };

export function Canvas({
  project,
  runningNodeId,
}: {
  project: SynapseProject;
  runningNodeId: string | null;
}) {
  const selectNode = useWorkspaceStore((s) => s.selectNode);

  const nodes = useMemo<Node<NodeCardData>[]>(() => {
    const positions = computeLayout(project);
    return project.nodes.map((node) => ({
      id: node.id,
      type: "synapseNode",
      position: positions[node.id] ?? { x: 0, y: 0 },
      data: { node, running: node.id === runningNodeId },
    }));
  }, [project, runningNodeId]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => selectNode(node.id)}
        nodesDraggable={false}
        panOnDrag={false}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
