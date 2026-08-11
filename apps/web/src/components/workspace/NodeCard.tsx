import type { NodeProps } from "@xyflow/react";
import { Wrench, FileText, MessageSquare, Trash2, GripVertical } from "lucide-react";
import type { SynapseNode } from "@synapse/config-schema";
import { cn } from "../../lib/cn";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";

const KIND_ICON = { tool: Wrench, resource: FileText, prompt: MessageSquare } as const;
const KIND_COLOR = {
  tool: "border-node-tool/60 bg-node-tool/10",
  resource: "border-node-resource/60 bg-node-resource/10",
  prompt: "border-node-prompt/60 bg-node-prompt/10",
} as const;

const KIND_BADGE = {
  tool: "bg-node-tool/20 text-node-tool",
  resource: "bg-node-resource/20 text-node-resource",
  prompt: "bg-node-prompt/20 text-node-prompt",
} as const;

export interface NodeCardData {
  node: SynapseNode;
  running: boolean;
  onDelete: () => void;
  [key: string]: unknown;
}

export function NodeCard({ data, dragging }: NodeProps & { data: NodeCardData }) {
  const Icon = KIND_ICON[data.node.kind];
  return (
    <div
      data-testid={`node-${data.node.id}`}
      data-running={data.running}
      className={cn(
        "group flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm shadow-resting transition-shadow duration-150 hover:shadow-hover",
        data.running ? "animate-pulse" : "animate-scale-in",
        dragging && "shadow-drag hover:shadow-drag",
        KIND_COLOR[data.node.kind]
      )}
    >
      <span
        className="drag-handle flex h-4 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
        aria-hidden="true"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", KIND_BADGE[data.node.kind])}>
        <Icon className="h-3 w-3" />
      </span>
      <span>{data.node.name}</span>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${data.node.name}`}
            className="h-5 w-5 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete {data.node.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This can&apos;t be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="default" onClick={data.onDelete}>
                Delete
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
