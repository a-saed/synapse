import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ToolNode } from "@synapse/config-schema";
import { ToolFields } from "./ToolFields";

const node: ToolNode = {
  id: "greet",
  kind: "tool",
  name: "greet",
  description: "",
  inputSchema: {
    type: "object",
    properties: { name: { type: "string", description: "Who to greet" } },
    required: ["name"],
  },
  logic: { type: "code", code: "" },
};

describe("ToolFields", () => {
  it("lists existing input properties", () => {
    render(<ToolFields node={node} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("name")).toBeInTheDocument();
  });

  it("adds a new property", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToolFields node={node} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /add property/i }));
    const lastCall = onChange.mock.calls.at(-1)![0] as ToolNode;
    expect(Object.keys(lastCall.inputSchema.properties)).toHaveLength(2);
  });

  it("removes a property", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToolFields node={node} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /remove name/i }));
    const lastCall = onChange.mock.calls.at(-1)![0] as ToolNode;
    expect(lastCall.inputSchema.properties).not.toHaveProperty("name");
    expect(lastCall.inputSchema.required).not.toContain("name");
  });

  it("toggles a property's required flag", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToolFields node={node} onChange={onChange} />);
    await user.click(screen.getByRole("switch", { name: /name required/i }));
    const lastCall = onChange.mock.calls.at(-1)![0] as ToolNode;
    expect(lastCall.inputSchema.required).not.toContain("name");
  });

  it("keeps the property-name input focused across multiple keystrokes while renaming", async () => {
    // Mirrors how NodeEditorPanel really wires this up (onChange feeds back
    // into a new `node` prop each keystroke) — a stubbed onChange that never
    // re-renders ToolFields wouldn't exercise the bug this guards against.
    function Wrapper() {
      const [current, setCurrent] = useState(node);
      return <ToolFields node={current} onChange={setCurrent} />;
    }
    const user = userEvent.setup();
    render(<Wrapper />);
    const input = screen.getByDisplayValue("name");
    await user.type(input, "-new");
    expect(screen.getByDisplayValue("name-new")).toBeInTheDocument();
  });
});
