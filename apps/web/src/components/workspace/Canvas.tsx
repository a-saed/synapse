import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SynapseProject } from "@synapse/config-schema";
import { computeLayout, toAbsolutePosition, COLUMN_WIDTH, ROW_HEIGHT } from "../../lib/autoLayout";
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
  onDeleteNode,
  onDeleteGroup,
  onPositionChange,
}: {
  project: SynapseProject;
  runningNodeId: string | null;
  onToggleGroupExposed: (groupId: string) => void;
  onAddRequest: (position: { x: number; y: number }) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void;
}) {
  const selectNode = useWorkspaceStore((s) => s.selectNode);

  // Nodes with a saved position ("pinned") keep it; computeLayout only
  // fills in a starting spot for anything that's never been dragged.
  const positions = useMemo(() => {
    const pinnedIds = new Set(Object.keys(project.positions));
    const fallback = computeLayout(project, pinnedIds);
    return { ...fallback, ...project.positions };
  }, [project]);

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
      // Group frames aren't independently draggable — their bounds are
      // always derived from their (individually draggable) members'
      // positions, so dragging the frame itself would just snap back.
      draggable: false,
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
        onDelete: () => onDeleteGroup(group.id),
      },
    }));
  }, [project, groupBounds, onToggleGroupExposed, onDeleteGroup]);

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
        // Explicit width/height for the same reason groupNodes sets them
        // above: jsdom's ResizeObserver is a no-op stub, so an unmeasured
        // node stays `visibility: hidden`, which hides its interactive
        // content (the delete button) from accessibility-tree queries.
        width: 160,
        height: 44,
        data: { node, running: node.id === runningNodeId, onDelete: () => onDeleteNode(node.id) },
        ...(groupId && bounds ? { parentId: groupId, extent: "parent" as const } : {}),
      };
    });
  }, [project, runningNodeId, positions, nodeIdToGroupId, groupBounds, onDeleteNode]);

  return (
    <div className="relative h-full w-full bg-background">
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, hsl(var(--background)) 100%)",
        }}
      />
      <ReactFlow
        nodes={[...groupNodes, ...memberNodes]}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => selectNode(node.id)}
        onNodeDragStop={(_, node) => {
          const bounds = node.parentId ? groupBounds.get(node.parentId) : undefined;
          const origin = bounds && { x: bounds.originX, y: bounds.originY };
          onPositionChange(node.id, toAbsolutePosition(node.position, origin));
        }}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          onAddRequest({ x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY });
        }}
        fitView
      >
        <Background id="fine" color="hsl(var(--border))" gap={16} size={1} />
        <Background id="coarse" color="hsl(var(--border))" gap={128} size={2} />
        <Controls />
        <MiniMap maskColor="hsl(var(--background) / 0.7)" nodeColor="hsl(var(--muted-foreground))" />
      </ReactFlow>
    </div>
  );
}
