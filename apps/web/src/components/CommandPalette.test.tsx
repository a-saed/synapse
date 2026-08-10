import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "./CommandPalette";

describe("CommandPalette", () => {
  it("is closed by default", () => {
    render(<CommandPalette actions={[{ id: "a", label: "Do A", run: vi.fn() }]} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on Cmd+K and runs the selected action", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<CommandPalette actions={[{ id: "a", label: "Do A", run }]} />);

    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByText("Do A"));
    expect(run).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters actions by typed text", async () => {
    const user = userEvent.setup();
    render(
      <CommandPalette
        actions={[
          { id: "a", label: "Open playground", run: vi.fn() },
          { id: "b", label: "Trigger export", run: vi.fn() },
        ]}
      />
    );
    await user.keyboard("{Meta>}k{/Meta}");
    await user.type(screen.getByRole("textbox"), "export");

    expect(screen.getByText("Trigger export")).toBeInTheDocument();
    expect(screen.queryByText("Open playground")).not.toBeInTheDocument();
  });
});
