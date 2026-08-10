import type { ToolNode } from "@synapse/config-schema";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";

const PROPERTY_TYPES = ["string", "number", "boolean", "object", "array"] as const;

export function ToolFields({
  node,
  onChange,
}: {
  node: ToolNode;
  onChange: (updated: ToolNode) => void;
}) {
  const properties = node.inputSchema.properties;
  const required = node.inputSchema.required ?? [];

  function updateProperties(
    next: typeof properties,
    nextRequired: string[]
  ) {
    onChange({
      ...node,
      inputSchema: { ...node.inputSchema, properties: next, required: nextRequired },
    });
  }

  function addProperty() {
    let name = "property";
    let n = 1;
    while (name in properties) {
      name = `property${n++}`;
    }
    updateProperties({ ...properties, [name]: { type: "string" } }, required);
  }

  function removeProperty(name: string) {
    const { [name]: _removed, ...rest } = properties;
    updateProperties(rest, required.filter((r) => r !== name));
  }

  function renameProperty(oldName: string, newName: string) {
    if (!newName || newName === oldName || newName in properties) return;
    const { [oldName]: prop, ...rest } = properties;
    const nextRequired = required.map((r) => (r === oldName ? newName : r));
    updateProperties({ ...rest, [newName]: prop }, nextRequired);
  }

  function setPropertyType(name: string, type: (typeof PROPERTY_TYPES)[number]) {
    updateProperties({ ...properties, [name]: { ...properties[name], type } }, required);
  }

  function toggleRequired(name: string) {
    const isRequired = required.includes(name);
    updateProperties(
      properties,
      isRequired ? required.filter((r) => r !== name) : [...required, name]
    );
  }

  return (
    <div className="space-y-3">
      <Label>Input properties</Label>
      {Object.entries(properties).map(([name, prop]) => (
        <div key={name} className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => renameProperty(name, e.target.value)}
            className="flex-1"
          />
          <Select
            value={prop.type}
            onValueChange={(value) =>
              setPropertyType(name, value as (typeof PROPERTY_TYPES)[number])
            }
          >
            <SelectTrigger aria-label={`${name} type`} className="w-28 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1.5 text-xs">
            <Switch
              aria-label={`${name} required`}
              checked={required.includes(name)}
              onCheckedChange={() => toggleRequired(name)}
            />
            required
          </label>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remove ${name}`}
            onClick={() => removeProperty(name)}
          >
            ×
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addProperty}>
        Add property
      </Button>
    </div>
  );
}
