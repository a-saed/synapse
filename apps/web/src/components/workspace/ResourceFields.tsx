import { useEffect, useState } from "react";
import type { ResourceNode } from "@synapse/config-schema";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function ResourceFields({
  node,
  onChange,
}: {
  node: ResourceNode;
  onChange: (updated: ResourceNode) => void;
}) {
  const [uri, setUri] = useState(node.uri);

  // Keep local state in sync when a different node is selected.
  useEffect(() => {
    setUri(node.uri);
  }, [node.uri]);

  function handleChange(value: string) {
    setUri(value);
    onChange({ ...node, uri: value });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="resource-uri">URI</Label>
      <Input id="resource-uri" value={uri} onChange={(e) => handleChange(e.target.value)} />
    </div>
  );
}
