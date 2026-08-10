import type { NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";

export interface GroupFrameData {
  name: string;
  exposed: boolean;
  onToggleExposed: () => void;
  onDelete: () => void;
  [key: string]: unknown;
}

export function GroupFrame({ data }: NodeProps & { data: GroupFrameData }) {
  return (
    <div className="flex h-full w-full flex-col rounded-lg border-2 border-dashed border-muted-foreground/40 p-2">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{data.name}</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5">
            <span>Exposed</span>
            <Switch checked={data.exposed} onCheckedChange={data.onToggleExposed} />
          </label>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${data.name}`}
                className="h-5 w-5"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Delete {data.name}?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Member nodes are kept, just ungrouped. This can&apos;t be undone.
              </p>
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
      </div>
    </div>
  );
}
