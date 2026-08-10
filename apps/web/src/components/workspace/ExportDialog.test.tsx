import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportDialog } from "./ExportDialog";

const server = setupServer(
  http.get("/api/projects/proj-1/export/snippet", () =>
    HttpResponse.json({
      mcpServers: { "proj-1": { command: "npx", args: ["tsx", "proj-1/index.ts"] } },
    })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("ExportDialog", () => {
  it("links to the archive download endpoint", async () => {
    const user = userEvent.setup();
    render(<ExportDialog projectId="proj-1" />);
    await user.click(screen.getByRole("button", { name: /export/i }));
    expect(screen.getByRole("link", { name: /download/i })).toHaveAttribute(
      "href",
      "/api/projects/proj-1/export/archive"
    );
  });

  it("copies the Claude config snippet to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<ExportDialog projectId="proj-1" />);
    await user.click(screen.getByRole("button", { name: /export/i }));
    await user.click(screen.getByRole("button", { name: /copy claude/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = JSON.parse(writeText.mock.calls[0][0]);
    expect(copied.mcpServers["proj-1"].command).toBe("npx");
  });
});
