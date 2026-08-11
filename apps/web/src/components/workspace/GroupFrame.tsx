import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Trash2, GripVertical } from "lucide-react";
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
  onRename: (name: string) => void;
  [key: string]: unknown;
}

export function GroupFrame({ data }: NodeProps & { data: GroupFrameData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(data.name);

  function startEditing() {
    setDraftName(data.name);
    setIsEditing(true);
  }

  function commitRename() {
    setIsEditing(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== data.name) {
      data.onRename(trimmed);
    } else {
      setDraftName(data.name);
    }
  }

  return (
    <div className="flex h-full w-full cursor-default flex-col rounded-lg border border-border/60 bg-muted/10 p-2">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span
            className="drag-handle flex h-4 w-4 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
            aria-hidden="true"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          {isEditing ? (
            <input
              className="w-24 rounded-full border border-input bg-background px-2 py-0.5 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={draftName}
              autoFocus
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraftName(data.name);
                  setIsEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              type="button"
              className="rounded-full bg-muted px-2 py-0.5 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
            >
              {data.name}
            </button>
          )}
        </div>
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
