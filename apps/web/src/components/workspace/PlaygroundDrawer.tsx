import { useState } from "react";
import type { SynapseProject } from "@synapse/config-schema";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { useExecuteNode } from "../../api/queries";
import { useWorkspaceStore } from "../../store/workspaceStore";

function inputFieldNames(project: SynapseProject, nodeId: string): string[] {
  const node = project.nodes.find((n) => n.id === nodeId);
  if (!node) return [];
  if (node.kind === "tool") return Object.keys(node.inputSchema.properties);
  if (node.kind === "prompt") return node.arguments.map((a) => a.name);
  return [];
}

export function PlaygroundDrawer({
  project,
  onRunStart,
  onRunEnd,
}: {
  project: SynapseProject;
  onRunStart: (nodeId: string) => void;
  onRunEnd: () => void;
}) {
  const open = useWorkspaceStore((s) => s.playgroundOpen);
  const [nodeId, setNodeId] = useState(project.nodes[0]?.id ?? "");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const executeNode = useExecuteNode();

  if (!open) return null;

  const fields = inputFieldNames(project, nodeId);

  async function handleRun() {
    onRunStart(nodeId);
    try {
      await executeNode.mutateAsync({ projectId: project.id, nodeId, input: fieldValues });
    } finally {
      onRunEnd();
    }
  }

  return (
    <div className="flex h-64 flex-col gap-3 border-t bg-background p-4 animate-slide-in-up">
      <div className="flex items-center gap-3">
        <Label htmlFor="playground-node">Node</Label>
        <Select
          value={nodeId}
          onValueChange={(value) => {
            setNodeId(value);
            setFieldValues({});
            executeNode.reset();
          }}
        >
          <SelectTrigger id="playground-node" aria-label="node" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {project.nodes.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleRun} disabled={executeNode.isPending}>
          Run
        </Button>
      </div>

      <div className="flex gap-2">
        {fields.map((field) => (
          <div key={field} className="space-y-1">
            <Label htmlFor={`field-${field}`}>{field}</Label>
            <Input
              id={`field-${field}`}
              aria-label={field}
              value={fieldValues[field] ?? ""}
              onChange={(e) =>
                setFieldValues((v) => ({ ...v, [field]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>

      {executeNode.data && (
        <div className="rounded-md border p-3 text-sm">
          {executeNode.data.ok ? (
            <pre className="whitespace-pre-wrap">{executeNode.data.result}</pre>
          ) : (
            <p className="text-destructive">{executeNode.data.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
