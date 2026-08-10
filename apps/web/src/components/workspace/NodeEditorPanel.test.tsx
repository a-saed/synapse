import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SynapseNode } from "@synapse/config-schema";
import { NodeEditorPanel } from "./NodeEditorPanel";

vi.mock("@monaco-editor/react", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string | undefined) => void;
  }) => (
    <textarea
      aria-label="code"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const node: SynapseNode = {
  id: "greet",
  kind: "tool",
  name: "greet",
  description: "Greets someone",
  inputSchema: { type: "object", properties: {} },
  logic: { type: "code", code: 'return "hi";' },
};

const groups = [
  { id: "g1", name: "Group One", nodeIds: [] },
  { id: "g2", name: "Group Two", nodeIds: ["greet"] },
];

describe("NodeEditorPanel", () => {
  it("renders nothing when no node is selected", () => {
    const { container } = render(
      <NodeEditorPanel node={null} groups={groups} onChange={vi.fn()} onChangeGroup={vi.fn()} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the node's name, description, and code", () => {
    render(
      <NodeEditorPanel node={node} groups={groups} onChange={vi.fn()} onChangeGroup={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByDisplayValue("greet")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Greets someone")).toBeInTheDocument();
    expect(screen.getByLabelText("code")).toHaveValue('return "hi";');
  });

  it("calls onChange with an updated node when the name changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NodeEditorPanel node={node} groups={groups} onChange={onChange} onChangeGroup={vi.fn()} onClose={vi.fn()} />
    );
    await user.type(screen.getByDisplayValue("greet"), "!");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: "greet!" }));
  });

  it("calls onChange with updated code when the editor changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NodeEditorPanel node={node} groups={groups} onChange={onChange} onChangeGroup={vi.fn()} onClose={vi.fn()} />
    );
    await user.type(screen.getByLabelText("code"), "x");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ logic: { type: "code", code: 'return "hi";x' } })
    );
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <NodeEditorPanel node={node} groups={groups} onChange={vi.fn()} onChangeGroup={vi.fn()} onClose={onClose} />
    );
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the group the node currently belongs to", () => {
    render(
      <NodeEditorPanel node={node} groups={groups} onChange={vi.fn()} onChangeGroup={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByLabelText(/group/i)).toHaveValue("g2");
  });

  it("calls onChangeGroup when a different group is selected", async () => {
    const user = userEvent.setup();
    const onChangeGroup = vi.fn();
    render(
      <NodeEditorPanel
        node={node}
        groups={groups}
        onChange={vi.fn()}
        onChangeGroup={onChangeGroup}
        onClose={vi.fn()}
      />
    );
    await user.selectOptions(screen.getByLabelText(/group/i), "g1");
    expect(onChangeGroup).toHaveBeenCalledWith("greet", "g1");
  });

  it("calls onChangeGroup with null when Ungrouped is selected", async () => {
    const user = userEvent.setup();
    const onChangeGroup = vi.fn();
    render(
      <NodeEditorPanel
        node={node}
        groups={groups}
        onChange={vi.fn()}
        onChangeGroup={onChangeGroup}
        onClose={vi.fn()}
      />
    );
    await user.selectOptions(screen.getByLabelText(/group/i), "");
    expect(onChangeGroup).toHaveBeenCalledWith("greet", null);
  });
});
