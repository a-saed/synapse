import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  executeNode,
  getExportSnippet,
  exportArchiveUrl,
} from "./projects";
import { ApiError } from "./client";

const sampleProject = {
  id: "proj-1",
  name: "P",
  nodes: [],
  groups: [],
  exposedGroupIds: [],
  positions: {},
};

const server = setupServer(
  http.get("/api/projects", () => HttpResponse.json([sampleProject])),
  http.get("/api/projects/proj-1", () => HttpResponse.json(sampleProject)),
  http.post("/api/projects", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...sampleProject, ...(body as object) }, { status: 201 });
  }),
  http.put("/api/projects/proj-1", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),
  http.delete("/api/projects/proj-1", () => new HttpResponse(null, { status: 204 })),
  http.post("/api/projects/proj-1/nodes/tool-1/execute", () =>
    HttpResponse.json({ ok: true, result: "hi" })
  ),
  http.get("/api/projects/proj-1/export/snippet", () =>
    HttpResponse.json({ mcpServers: { "proj-1": { command: "npx", args: ["tsx", "proj-1/index.ts"] } } })
  ),
  http.get("/api/projects/missing", () =>
    HttpResponse.json({ error: "project not found" }, { status: 404 })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("projects API client", () => {
  it("lists projects", async () => {
    expect(await listProjects()).toEqual([sampleProject]);
  });

  it("gets a project by id", async () => {
    expect(await getProject("proj-1")).toEqual(sampleProject);
  });

  it("creates a project", async () => {
    const created = await createProject({ id: "proj-1", name: "P" });
    expect(created.id).toBe("proj-1");
  });

  it("updates a project", async () => {
    const updated = await updateProject(sampleProject);
    expect(updated).toEqual(sampleProject);
  });

  it("deletes a project", async () => {
    await expect(deleteProject("proj-1")).resolves.toBeUndefined();
  });

  it("executes a node", async () => {
    const result = await executeNode("proj-1", "tool-1", { name: "Ada" });
    expect(result).toEqual({ ok: true, result: "hi" });
  });

  it("fetches the Claude config snippet", async () => {
    const snippet = await getExportSnippet("proj-1");
    expect(snippet.mcpServers["proj-1"].command).toBe("npx");
  });

  it("builds the export archive URL without fetching", () => {
    expect(exportArchiveUrl("proj-1")).toBe("/api/projects/proj-1/export/archive");
  });

  it("throws ApiError with the status and body on a 404", async () => {
    await expect(getProject("missing")).rejects.toMatchObject({
      status: 404,
      body: { error: "project not found" },
    });
    await expect(getProject("missing")).rejects.toBeInstanceOf(ApiError);
  });
});
