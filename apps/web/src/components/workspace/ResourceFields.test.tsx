import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ResourceNode } from "@synapse/config-schema";
import { ResourceFields } from "./ResourceFields";

const node: ResourceNode = {
  id: "readme",
  kind: "resource",
  name: "readme",
  description: "",
  uri: "synapse://readme",
  logic: { type: "code", code: "" },
};

describe("ResourceFields", () => {
  it("shows the current URI", () => {
    render(<ResourceFields node={node} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("synapse://readme")).toBeInTheDocument();
  });

  it("calls onChange with an updated URI", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ResourceFields node={node} onChange={onChange} />);
    await user.type(screen.getByDisplayValue("synapse://readme"), "-v2");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ uri: "synapse://readme-v2" })
    );
  });
});
