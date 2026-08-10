import { X } from "lucide-react";
import type { SynapseNode, SynapseGroup } from "@synapse/config-schema";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { CodeEditor } from "./CodeEditor";
import { ToolFields } from "./ToolFields";
import { ResourceFields } from "./ResourceFields";
import { PromptFields } from "./PromptFields";

const UNGROUPED = "__ungrouped__";

export function NodeEditorPanel({
  node,
  groups,
  onChange,
  onChangeGroup,
  onClose,
}: {
  node: SynapseNode | null;
  groups: SynapseGroup[];
  onChange: (updated: SynapseNode) => void;
  onChangeGroup: (nodeId: string, groupId: string | null) => void;
  onClose: () => void;
}) {
  if (!node) return null;

  const currentGroupId = groups.find((g) => g.nodeIds.includes(node.id))?.id ?? UNGROUPED;

  return (
    <div className="flex h-full w-96 flex-col gap-4 overflow-y-auto border-l bg-background p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          {node.kind}
        </h2>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-name">Name</Label>
        <Input
          id="node-name"
          value={node.name}
          onChange={(e) => onChange({ ...node, name: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-description">Description</Label>
        <Input
          id="node-description"
          value={node.description}
          onChange={(e) => onChange({ ...node, description: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-group">Group</Label>
        <Select
          value={currentGroupId}
          onValueChange={(value) => onChangeGroup(node.id, value === UNGROUPED ? null : value)}
        >
          <SelectTrigger id="node-group" aria-label="Group">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNGROUPED}>Ungrouped</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {node.kind === "tool" && <ToolFields key={node.id} node={node} onChange={onChange} />}
      {node.kind === "resource" && <ResourceFields key={node.id} node={node} onChange={onChange} />}
      {node.kind === "prompt" && <PromptFields key={node.id} node={node} onChange={onChange} />}

      <div className="space-y-1.5">
        <Label>Code</Label>
        <CodeEditor
          value={node.logic.code}
          onChange={(code) =>
            onChange({ ...node, logic: { ...node.logic, code } })
          }
        />
      </div>
    </div>
  );
}
