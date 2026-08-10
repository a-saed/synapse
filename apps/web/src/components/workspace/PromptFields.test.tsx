import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PromptNode } from "@synapse/config-schema";
import { PromptFields } from "./PromptFields";

const node: PromptNode = {
  id: "summarize",
  kind: "prompt",
  name: "summarize",
  description: "",
  arguments: [{ name: "topic", description: "What to summarize", required: true }],
  logic: { type: "code", code: "" },
};

describe("PromptFields", () => {
  it("lists existing arguments", () => {
    render(<PromptFields node={node} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("topic")).toBeInTheDocument();
  });

  it("adds a new argument", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PromptFields node={node} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /add argument/i }));
    const lastCall = onChange.mock.calls.at(-1)![0] as PromptNode;
    expect(lastCall.arguments).toHaveLength(2);
  });

  it("removes an argument", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PromptFields node={node} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /remove topic/i }));
    const lastCall = onChange.mock.calls.at(-1)![0] as PromptNode;
    expect(lastCall.arguments).toHaveLength(0);
  });
});
