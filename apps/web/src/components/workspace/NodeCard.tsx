import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Wrench, FileText, MessageSquare } from "lucide-react";
import type { SynapseNode } from "@synapse/config-schema";
import { cn } from "../../lib/cn";

const KIND_ICON = { tool: Wrench, resource: FileText, prompt: MessageSquare } as const;
const KIND_COLOR = {
  tool: "border-blue-500/60 bg-blue-500/10",
  resource: "border-emerald-500/60 bg-emerald-500/10",
  prompt: "border-purple-500/60 bg-purple-500/10",
} as const;

export interface NodeCardData {
  node: SynapseNode;
  running: boolean;
  [key: string]: unknown;
}

export function NodeCard({ data }: NodeProps & { data: NodeCardData }) {
  const Icon = KIND_ICON[data.node.kind];
  return (
    <div
      data-testid={`node-${data.node.id}`}
      data-running={data.running}
      className={cn(
        "flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm shadow-sm",
        KIND_COLOR[data.node.kind],
        data.running && "animate-pulse"
      )}
    >
      <Handle type="target" position={Position.Left} />
      <Icon className="h-4 w-4" />
      <span>{data.node.name}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
