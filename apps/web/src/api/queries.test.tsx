import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useExecuteNode,
} from "./queries";

const sampleProject = { id: "proj-1", name: "P", nodes: [], groups: [], exposedGroupIds: [] };

const server = setupServer(
  http.get("/api/projects", () => HttpResponse.json([sampleProject])),
  http.get("/api/projects/proj-1", () => HttpResponse.json(sampleProject)),
  http.post("/api/projects", async ({ request }) =>
    HttpResponse.json({ ...sampleProject, ...(await request.json() as object) }, { status: 201 })
  ),
  http.put("/api/projects/proj-1", async ({ request }) => HttpResponse.json(await request.json())),
  http.post("/api/projects/proj-1/nodes/tool-1/execute", () =>
    HttpResponse.json({ ok: true, result: "hi" })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("query hooks", () => {
  it("useProjects loads the project list", async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([sampleProject]);
  });

  it("useProject loads a single project", async () => {
    const { result } = renderHook(() => useProject("proj-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleProject);
  });

  it("useCreateProject creates and resolves", async () => {
    const { result } = renderHook(() => useCreateProject(), { wrapper });
    result.current.mutate({ id: "proj-1", name: "P" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useUpdateProject updates and resolves", async () => {
    const { result } = renderHook(() => useUpdateProject(), { wrapper });
    result.current.mutate(sampleProject);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useExecuteNode runs a node", async () => {
    const { result } = renderHook(() => useExecuteNode(), { wrapper });
    result.current.mutate({ projectId: "proj-1", nodeId: "tool-1", input: {} });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ ok: true, result: "hi" });
  });
});
