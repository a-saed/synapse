import type { NodeProps } from "@xyflow/react";
import { Switch } from "../ui/switch";

export interface GroupFrameData {
  name: string;
  exposed: boolean;
  onToggleExposed: () => void;
  [key: string]: unknown;
}

export function GroupFrame({ data }: NodeProps & { data: GroupFrameData }) {
  return (
    <div className="flex h-full w-full flex-col rounded-lg border-2 border-dashed border-muted-foreground/40 p-2">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{data.name}</span>
        <label className="flex items-center gap-1.5">
          <span>Exposed</span>
          <Switch checked={data.exposed} onCheckedChange={data.onToggleExposed} />
        </label>
      </div>
    </div>
  );
}
