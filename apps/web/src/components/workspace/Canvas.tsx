import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SynapseProject } from "@synapse/config-schema";
import { computeLayout, COLUMN_WIDTH, ROW_HEIGHT } from "../../lib/autoLayout";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { NodeCard, type NodeCardData } from "./NodeCard";
import { GroupFrame, type GroupFrameData } from "./GroupFrame";

const nodeTypes = { synapseNode: NodeCard, synapseGroup: GroupFrame };

const GROUP_PADDING = 40;

interface GroupBounds {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export function Canvas({
  project,
  runningNodeId,
  onToggleGroupExposed,
  onAddRequest,
}: {
  project: SynapseProject;
  runningNodeId: string | null;
  onToggleGroupExposed: (groupId: string) => void;
  onAddRequest: (position: { x: number; y: number }) => void;
}) {
  const selectNode = useWorkspaceStore((s) => s.selectNode);

  const positions = useMemo(() => computeLayout(project), [project]);

  const nodeIdToGroupId = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of project.groups) {
      for (const nodeId of group.nodeIds) {
        map.set(nodeId, group.id);
      }
    }
    return map;
  }, [project]);

  const groupBounds = useMemo(() => {
    const bounds = new Map<string, GroupBounds>();
    for (const group of project.groups) {
      const memberPositions = group.nodeIds
        .map((id) => positions[id])
        .filter((p): p is { x: number; y: number } => p !== undefined);
      if (memberPositions.length === 0) continue;

      const minX = Math.min(...memberPositions.map((p) => p.x));
      const minY = Math.min(...memberPositions.map((p) => p.y));
      const maxX = Math.max(...memberPositions.map((p) => p.x));
      const maxY = Math.max(...memberPositions.map((p) => p.y));

      bounds.set(group.id, {
        originX: minX - GROUP_PADDING,
        originY: minY - GROUP_PADDING,
        width: maxX - minX + COLUMN_WIDTH + GROUP_PADDING * 2,
        height: maxY - minY + ROW_HEIGHT + GROUP_PADDING * 2,
      });
    }
    return bounds;
  }, [project, positions]);

  const groupNodes = useMemo<Node<GroupFrameData>[]>(() => {
    const groupsWithBounds = project.groups
      .map((group) => ({ group, bounds: groupBounds.get(group.id) }))
      .filter(
        (entry): entry is { group: (typeof project.groups)[number]; bounds: GroupBounds } =>
          entry.bounds !== undefined
      );

    return groupsWithBounds.map(({ group, bounds }) => ({
      id: group.id,
      type: "synapseGroup",
      position: { x: bounds.originX, y: bounds.originY },
      // Set as top-level width/height (not just CSS style) so React Flow
      // treats the node as already measured: in jsdom, ResizeObserver is
      // a no-op stub, so nodes without explicit dimensions never leave
      // `visibility: hidden`, which hides the switch from accessibility
      // queries and breaks pointer interaction in tests.
      width: bounds.width,
      height: bounds.height,
      data: {
        name: group.name,
        exposed: project.exposedGroupIds.includes(group.id),
        onToggleExposed: () => onToggleGroupExposed(group.id),
      },
    }));
  }, [project, groupBounds, onToggleGroupExposed]);

  const memberNodes = useMemo<Node<NodeCardData>[]>(() => {
    return project.nodes.map((node) => {
      const groupId = nodeIdToGroupId.get(node.id);
      const bounds = groupId ? groupBounds.get(groupId) : undefined;
      const absolutePosition = positions[node.id] ?? { x: 0, y: 0 };
      const position = bounds
        ? { x: absolutePosition.x - bounds.originX, y: absolutePosition.y - bounds.originY }
        : absolutePosition;

      return {
        id: node.id,
        type: "synapseNode",
        position,
        data: { node, running: node.id === runningNodeId },
        ...(groupId && bounds ? { parentId: groupId, extent: "parent" as const } : {}),
      };
    });
  }, [project, runningNodeId, positions, nodeIdToGroupId, groupBounds]);

  return (
    <div className="h-full w-full bg-background">
      <ReactFlow
        nodes={[...groupNodes, ...memberNodes]}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          onAddRequest({ x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY });
        }}
        fitView
      >
        <Background color="hsl(var(--border))" />
        <Controls />
        <MiniMap maskColor="hsl(var(--background) / 0.7)" nodeColor="hsl(var(--muted-foreground))" />
      </ReactFlow>
    </div>
  );
}
