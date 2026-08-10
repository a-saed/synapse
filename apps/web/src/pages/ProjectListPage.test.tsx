import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectListPage } from "./ProjectListPage";

const server = setupServer(
  http.get("/api/projects", () =>
    HttpResponse.json([
      { id: "greet-server", name: "Greet Server", nodes: [], groups: [], exposedGroupIds: [], positions: {} },
    ])
  ),
  http.post("/api/projects", async ({ request }) => {
    const body = (await request.json()) as { id: string; name: string };
    return HttpResponse.json(
      { ...body, nodes: [], groups: [], exposedGroupIds: [], positions: {} },
      { status: 201 }
    );
  }),
  http.delete("/api/projects/:id", ({ params }) => {
    deletedId = params.id as string;
    return new HttpResponse(null, { status: 204 });
  })
);

let deletedId: string | null = null;

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  deletedId = null;
});
afterAll(() => server.close());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProjectListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProjectListPage", () => {
  it("lists existing projects", async () => {
    renderPage();
    expect(await screen.findByText("Greet Server")).toBeInTheDocument();
  });

  it("creates a project with an auto-slugified id", async () => {
    const user = renderPage() && userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new project/i }));
    await user.type(screen.getByLabelText(/name/i), "My New Tool");

    const idField = screen.getByLabelText(/project id/i) as HTMLInputElement;
    await waitFor(() => expect(idField.value).toBe("my-new-tool"));

    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("deletes a project after confirming", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Greet Server");

    await user.click(screen.getByRole("button", { name: /delete greet server/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(deletedId).toBe("greet-server"));
  });
});
