import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddMenu } from "./AddMenu";

describe("AddMenu", () => {
  it("renders the four addable kinds", () => {
    render(<AddMenu position={{ x: 0, y: 0 }} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("menuitem", { name: /tool/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /resource/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /prompt/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /group/i })).toBeInTheDocument();
  });

  it("calls onSelect with the clicked kind", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AddMenu position={{ x: 0, y: 0 }} onSelect={onSelect} onClose={vi.fn()} />);
    await user.click(screen.getByRole("menuitem", { name: /resource/i }));
    expect(onSelect).toHaveBeenCalledWith("resource");
  });

  it("calls onClose when clicking outside the menu", () => {
    const onClose = vi.fn();
    render(
      <div>
        <button>outside</button>
        <AddMenu position={{ x: 0, y: 0 }} onSelect={vi.fn()} onClose={onClose} />
      </div>
    );
    fireEvent.mouseDown(screen.getByText("outside"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<AddMenu position={{ x: 0, y: 0 }} onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
