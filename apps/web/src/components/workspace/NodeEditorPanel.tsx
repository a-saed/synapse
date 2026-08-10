import { X } from "lucide-react";
import type { SynapseNode } from "@synapse/config-schema";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CodeEditor } from "./CodeEditor";
import { ToolFields } from "./ToolFields";
import { ResourceFields } from "./ResourceFields";
import { PromptFields } from "./PromptFields";

export function NodeEditorPanel({
  node,
  onChange,
  onClose,
}: {
  node: SynapseNode | null;
  onChange: (updated: SynapseNode) => void;
  onClose: () => void;
}) {
  if (!node) return null;

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

      {node.kind === "tool" && <ToolFields node={node} onChange={onChange} />}
      {node.kind === "resource" && <ResourceFields node={node} onChange={onChange} />}
      {node.kind === "prompt" && <PromptFields node={node} onChange={onChange} />}

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
