import type { NodeProps } from "@xyflow/react";
import { Wrench, FileText, MessageSquare, Trash2 } from "lucide-react";
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
  tool: "border-blue-500/60 bg-blue-500/10",
  resource: "border-emerald-500/60 bg-emerald-500/10",
  prompt: "border-purple-500/60 bg-purple-500/10",
} as const;

export interface NodeCardData {
  node: SynapseNode;
  running: boolean;
  onDelete: () => void;
  [key: string]: unknown;
}

export function NodeCard({ data }: NodeProps & { data: NodeCardData }) {
  const Icon = KIND_ICON[data.node.kind];
  return (
    <div
      data-testid={`node-${data.node.id}`}
      data-running={data.running}
      className={cn(
        "group flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm shadow-sm",
        KIND_COLOR[data.node.kind],
        data.running && "animate-pulse"
      )}
    >
      <Icon className="h-4 w-4" />
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
