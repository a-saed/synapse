import type { SynapseProject } from "@synapse/config-schema";

export interface NodePosition {
  x: number;
  y: number;
}

export const COLUMN_WIDTH = 220;
export const ROW_HEIGHT = 140;

export function computeLayout(project: SynapseProject): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  const placedNodeIds = new Set<string>();

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
