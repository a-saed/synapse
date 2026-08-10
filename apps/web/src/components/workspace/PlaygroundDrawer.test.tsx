import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SynapseProject } from "@synapse/config-schema";
import { PlaygroundDrawer } from "./PlaygroundDrawer";
import { useWorkspaceStore } from "../../store/workspaceStore";

const project: SynapseProject = {
  id: "p",
  name: "P",
  nodes: [
    {
      id: "greet",
      kind: "tool",
      name: "greet",
      description: "",
      inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
      logic: { type: "code", code: "" },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["greet"] }],
  exposedGroupIds: ["g1"],
  positions: {},
};

const server = setupServer(
  http.post("/api/projects/p/nodes/greet/execute", async ({ request }) => {
    const body = (await request.json()) as { input: { name?: string } };
    return HttpResponse.json({ ok: true, result: `hi ${body.input.name}` });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderDrawer(onRunStart = vi.fn(), onRunEnd = vi.fn()) {
  useWorkspaceStore.setState({ playgroundOpen: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    ...render(
      <QueryClientProvider client={client}>
        <PlaygroundDrawer project={project} onRunStart={onRunStart} onRunEnd={onRunEnd} />
      </QueryClientProvider>
    ),
    onRunStart,
    onRunEnd,
  };
}

describe("PlaygroundDrawer", () => {
  it("renders nothing when closed", () => {
    useWorkspaceStore.setState({ playgroundOpen: false });
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <PlaygroundDrawer project={project} onRunStart={vi.fn()} onRunEnd={vi.fn()} />
      </QueryClientProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("runs the selected node and shows the result", async () => {
    const user = userEvent.setup();
    const { onRunStart, onRunEnd } = renderDrawer();

    await user.click(screen.getByRole("combobox", { name: /node/i }));
    await user.click(await screen.findByRole("option", { name: "greet" }));
    await user.type(screen.getByLabelText("name"), "Ada");
    await user.click(screen.getByRole("button", { name: /run/i }));

    expect(onRunStart).toHaveBeenCalledWith("greet");
    await waitFor(() => expect(screen.getByText("hi Ada")).toBeInTheDocument());
    expect(onRunEnd).toHaveBeenCalled();
  });
});
