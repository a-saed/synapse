import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SynapseProject } from "@synapse/config-schema";
import {
  computeLayout,
  toAbsolutePosition,
  computeGroupDragPositionUpdates,
  COLUMN_WIDTH,
  ROW_HEIGHT,
} from "../../lib/autoLayout";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { NodeCard, type NodeCardData } from "./NodeCard";
import { GroupFrame, type GroupFrameData } from "./GroupFrame";

const GROUP_NODE_TYPE = "synapseGroup";

const nodeTypes = { synapseNode: NodeCard, [GROUP_NODE_TYPE]: GroupFrame };

const GROUP_PADDING = 40;

interface GroupBounds {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * Handles the `onNodeDragStop` case where the dragged node is a group frame:
 * looks up the frame's bounds and member list, computes each member's new
 * absolute position via `computeGroupDragPositionUpdates`, and persists
 * them one at a time through `onPositionChange`. Pulled out of the
 * `onNodeDragStop` closure so this wiring — the lookups and the loop, not
 * just the pure math in `computeGroupDragPositionUpdates` — is unit
 * testable without rendering a full `<Canvas>`/React Flow tree.
 */
export function handleGroupDragStop(
  project: SynapseProject,
  positions: Record<string, { x: number; y: number }>,
  groupBounds: Map<string, GroupBounds>,
  groupId: string,
  newGroupPosition: { x: number; y: number },
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void
): void {
  const bounds = groupBounds.get(groupId);
  const group = project.groups.find((g) => g.id === groupId);
  if (!bounds || !group) return;
  // Only ids that already resolve to a real position are passed through —
  // an id in group.nodeIds with no matching project.nodes/positions entry
  // (shouldn't normally happen, but isn't guaranteed impossible) would
  // otherwise fall back to {x:0,y:0} inside the helper and get a bogus
  // position persisted for a nonexistent node.
  const memberIds = group.nodeIds.filter((id) => id in positions);
  const updates = computeGroupDragPositionUpdates(memberIds, positions, bounds, newGroupPosition);
  for (const [memberId, position] of Object.entries(updates)) {
    onPositionChange(memberId, position);
  }
}

export function Canvas({
  project,
  runningNodeId,
  onToggleGroupExposed,
  onAddRequest,
  onDeleteNode,
  onDeleteGroup,
  onPositionChange,
  onRenameGroup,
}: {
  project: SynapseProject;
  runningNodeId: string | null;
  onToggleGroupExposed: (groupId: string) => void;
  onAddRequest: (position: { x: number; y: number }) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onRenameGroup: (groupId: string, name: string) => void;
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
      type: GROUP_NODE_TYPE,
      position: { x: bounds.originX, y: bounds.originY },
      // Group frames are draggable via their own handle (dragHandle
      // below). Member cards use React Flow's parent/child relationship
      // (memberNodes sets parentId/extent: "parent" when grouped), which
      // is what keeps their rendered position correct relative to the
      // frame. Whichever way that renders during the gesture itself,
      // onNodeDragStop below is what persists the final result: it
      // computes each member's new absolute position from the delta the
      // frame moved and writes it back via onPositionChange.
      draggable: true,
      dragHandle: ".drag-handle",
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
        onRename: (name: string) => onRenameGroup(group.id, name),
      },
    }));
  }, [project, groupBounds, onToggleGroupExposed, onDeleteGroup, onRenameGroup]);

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
        dragHandle: ".drag-handle",
        data: { node, running: node.id === runningNodeId, onDelete: () => onDeleteNode(node.id) },
        ...(groupId && bounds ? { parentId: groupId, extent: "parent" as const } : {}),
      };
    });
  }, [project, runningNodeId, positions, nodeIdToGroupId, groupBounds, onDeleteNode]);

  return (
    <div className="relative h-full w-full bg-background">
      <ReactFlow
        nodes={[...groupNodes, ...memberNodes]}
        edges={[]}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => selectNode(node.id)}
        onNodeDragStop={(_, node) => {
          if (node.type === GROUP_NODE_TYPE) {
            handleGroupDragStop(project, positions, groupBounds, node.id, node.position, onPositionChange);
            return;
          }
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
        <div
          className="pointer-events-none absolute inset-0 z-[4]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 75%, hsl(var(--background)) 100%)",
          }}
        />
      </ReactFlow>
    </div>
  );
}
