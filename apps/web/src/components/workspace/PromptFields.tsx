import type { PromptNode } from "@synapse/config-schema";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

export function PromptFields({
  node,
  onChange,
}: {
  node: PromptNode;
  onChange: (updated: PromptNode) => void;
}) {
  function updateArguments(next: PromptNode["arguments"]) {
    onChange({ ...node, arguments: next });
  }

  function addArgument() {
    updateArguments([
      ...node.arguments,
      {
        name: `arg${node.arguments.length + 1}`,
        description: "New argument",
        required: true,
      },
    ]);
  }

  function removeArgument(index: number) {
    updateArguments(node.arguments.filter((_, i) => i !== index));
  }

  function updateArgument(index: number, patch: Partial<PromptNode["arguments"][number]>) {
    updateArguments(
      node.arguments.map((arg, i) => (i === index ? { ...arg, ...patch } : arg))
    );
  }

  return (
    <div className="space-y-3">
      <Label>Arguments</Label>
      {node.arguments.map((arg, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={arg.name}
            onChange={(e) => updateArgument(index, { name: e.target.value })}
            className="flex-1"
          />
          <Input
            value={arg.description}
            placeholder="Description"
            onChange={(e) => updateArgument(index, { description: e.target.value })}
            className="flex-1"
          />
          <label className="flex items-center gap-1.5 text-xs">
            <Switch
              aria-label={`${arg.name} required`}
              checked={arg.required}
              onCheckedChange={(checked) => updateArgument(index, { required: checked })}
            />
            required
          </label>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remove ${arg.name}`}
            onClick={() => removeArgument(index)}
          >
            ×
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addArgument}>
        Add argument
      </Button>
    </div>
  );
}
