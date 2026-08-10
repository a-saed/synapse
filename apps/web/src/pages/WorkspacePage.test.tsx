import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspacePage } from "./WorkspacePage";
import { useWorkspaceStore } from "../store/workspaceStore";

vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="code" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const project = {
  id: "proj-1",
  name: "Greet Server",
  nodes: [
    {
      id: "greet",
      kind: "tool" as const,
      name: "greet",
      description: "",
      inputSchema: { type: "object" as const, properties: {} },
      logic: { type: "code" as const, code: 'return "hi";' },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["greet"] }],
  exposedGroupIds: ["g1"],
};

let putBody: unknown = null;
const server = setupServer(
  http.get("/api/projects/proj-1", () => HttpResponse.json(project)),
  http.put("/api/projects/proj-1", async ({ request }) => {
    putBody = await request.json();
    return HttpResponse.json(putBody as object);
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  putBody = null;
  useWorkspaceStore.setState({ selectedNodeId: null, playgroundOpen: false });
});
afterAll(() => server.close());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/projects/proj-1"]}>
        <Routes>
          <Route path="/projects/:id" element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("WorkspacePage", () => {
  it("loads and displays the project's name and nodes", async () => {
    renderPage();
    expect(await screen.findByText("Greet Server")).toBeInTheDocument();
    expect(screen.getByText("greet")).toBeInTheDocument();
  });

  it("selecting a node opens the editor panel with its code", async () => {
    renderPage();
    const nodeLabel = await screen.findByText("greet");
    // Clicking inside React Flow's canvas tree crashes jsdom's d3-drag
    // handling via userEvent (missing `event.view` on synthetic mousedown),
    // so use fireEvent here instead (established fix from Tasks 9/10).
    fireEvent.click(nodeLabel);
    expect(await screen.findByLabelText("code")).toHaveValue('return "hi";');
  });

  it("editing a node's code autosaves via PUT", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    renderPage();
    const nodeLabel = await screen.findByText("greet");
    fireEvent.click(nodeLabel);
    await user.type(await screen.findByLabelText("code"), "!");

    vi.advanceTimersByTime(600);
    await waitFor(() => expect(putBody).not.toBeNull());
    expect((putBody as { nodes: { logic: { code: string } }[] }).nodes[0].logic.code).toBe(
      'return "hi";!'
    );
    vi.useRealTimers();
  });

  it("adding a Tool via the add button creates and selects a new node", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Greet Server");

    await user.click(screen.getByRole("button", { name: /add node or group/i }));
    await user.click(await screen.findByRole("menuitem", { name: /tool/i }));

    expect(await screen.findByDisplayValue("New Tool")).toBeInTheDocument();
  });

  it("supports the full add → assign to group → render → delete loop", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Greet Server");

    // Add a group.
    await user.click(screen.getByRole("button", { name: /add node or group/i }));
    await user.click(await screen.findByRole("menuitem", { name: /^group$/i }));

    // Add a tool node; it should auto-select and open the editor panel.
    await user.click(screen.getByRole("button", { name: /add node or group/i }));
    await user.click(await screen.findByRole("menuitem", { name: /^tool$/i }));
    await screen.findByDisplayValue("New Tool");

    // Assign it to the new group (option value is the group's id; its
    // rendered label is the group's name, "New Group").
    await user.selectOptions(screen.getByLabelText(/^group$/i), "new-group");
    expect(await screen.findByText("New Tool")).toBeInTheDocument();

    // The group frame is now visible (has a member, so it renders with
    // bounds) — its delete button is a unique marker for its presence,
    // since "New Group" text also appears in the Group <select>'s option.
    expect(await screen.findByRole("button", { name: /delete new group/i })).toBeInTheDocument();

    // Delete the node; the group frame (now empty) disappears.
    fireEvent.click(screen.getByRole("button", { name: /delete new tool/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /delete new group/i })).not.toBeInTheDocument()
    );
  });
});
