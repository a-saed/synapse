import type { SynapseProject } from "@synapse/config-schema";

export interface NodePosition {
  x: number;
  y: number;
}

export const COLUMN_WIDTH = 220;
export const ROW_HEIGHT = 140;

export function computeLayout(
  project: SynapseProject,
  pinnedIds: Set<string> = new Set()
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  // Seeded with pinnedIds so the grid-placement loops below skip them
  // entirely, rather than wasting a slot next to a node that already has
  // a manually dragged, persisted position.
  const placedNodeIds = new Set<string>(pinnedIds);

  let row = 0;
  for (const group of project.groups) {
    let col = 0;
    for (const nodeId of group.nodeIds) {
      if (placedNodeIds.has(nodeId)) continue;
      positions[nodeId] = { x: col * COLUMN_WIDTH, y: row * ROW_HEIGHT };
      placedNodeIds.add(nodeId);
      col++;
    }
    if (col > 0) row++;
  }

  let orphanCol = 0;
  for (const node of project.nodes) {
    if (placedNodeIds.has(node.id)) continue;
    positions[node.id] = { x: orphanCol * COLUMN_WIDTH, y: row * ROW_HEIGHT };
    orphanCol++;
  }

  return positions;
}

/**
 * A node nested inside a group frame (React Flow `parentId` + `extent:
 * "parent"`) reports its drag position relative to that frame's origin, not
 * in the same absolute space `computeLayout` and `project.positions` use.
 * Translates back using the frame's origin so a dragged position can be
 * persisted and re-laid-out consistently regardless of group membership.
 */
export function toAbsolutePosition(
  relativePosition: NodePosition,
  parentOrigin: NodePosition | undefined
): NodePosition {
  if (!parentOrigin) return relativePosition;
  return { x: relativePosition.x + parentOrigin.x, y: relativePosition.y + parentOrigin.y };
}
