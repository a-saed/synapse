import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import AdmZip from "adm-zip";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "./app.js";
import { ProjectStorage } from "./storage.js";

describe("server", () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "synapse-app-"));
    app = createApp({ storage: new ProjectStorage(dir) });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns ok status on health check", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("creates and fetches a project", async () => {
    const createRes = await request(app)
      .post("/projects")
      .send({ id: "proj-1", name: "My Project" });
    expect(createRes.status).toBe(201);

    const getRes = await request(app).get("/projects/proj-1");
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual({
      id: "proj-1",
      name: "My Project",
      nodes: [],
      groups: [],
      exposedGroupIds: [],
      positions: {},
    });
  });

  it("returns 404 for a missing project", async () => {
    const res = await request(app).get("/projects/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("lists all projects", async () => {
    await request(app).post("/projects").send({ id: "p1", name: "One" });
    await request(app).post("/projects").send({ id: "p2", name: "Two" });
    const res = await request(app).get("/projects");
    expect(res.body.map((p: { id: string }) => p.id).sort()).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("updates a project with a full valid document, including nodes and groups", async () => {
    await request(app).post("/projects").send({ id: "proj-1", name: "P" });

    const updated = {
      id: "proj-1",
      name: "P",
      nodes: [
        {
          id: "tool-1",
          kind: "tool",
          name: "greet",
          description: "Greets someone",
          inputSchema: {
            type: "object",
            properties: { name: { type: "string" } },
            required: ["name"],
          },
          logic: { type: "code", code: 'return "hi " + input.name;' },
        },
      ],
      groups: [{ id: "g1", name: "default", nodeIds: ["tool-1"] }],
      exposedGroupIds: ["g1"],
      positions: {},
    };

    const putRes = await request(app).put("/projects/proj-1").send(updated);
    expect(putRes.status).toBe(200);

    const getRes = await request(app).get("/projects/proj-1");
    expect(getRes.body).toEqual(updated);
  });

  it("rejects an update with an invalid node", async () => {
    await request(app).post("/projects").send({ id: "proj-1", name: "P" });
    const res = await request(app)
      .put("/projects/proj-1")
      .send({
        id: "proj-1",
        name: "P",
        nodes: [{ id: "bad", kind: "tool" }],
        groups: [],
        exposedGroupIds: [],
      });
    expect(res.status).toBe(400);
  });

  it("returns 400 instead of crashing when creating a project with an invalid id", async () => {
    const res = await request(app)
      .post("/projects")
      .send({ id: "../evil", name: "Bad" });
    expect(res.status).toBe(400);
  });

  it("returns 400 instead of crashing when fetching a project with an invalid id", async () => {
    const res = await request(app).get("/projects/a%2Fb");
    expect(res.status).toBe(400);
  });

  it("returns 400 instead of crashing when updating a project with an invalid id", async () => {
    const res = await request(app)
      .put("/projects/a%2Fb")
      .send({
        id: "a/b",
        name: "P",
        nodes: [],
        groups: [],
        exposedGroupIds: [],
      });
    expect(res.status).toBe(400);
  });

  it("executes a tool node's code and returns the result", async () => {
    const project = {
      id: "proj-1",
      name: "P",
      nodes: [
        {
          id: "tool-1",
          kind: "tool",
          name: "greet",
          description: "Greets someone",
          inputSchema: {
            type: "object",
            properties: { name: { type: "string" } },
            required: ["name"],
          },
          logic: { type: "code", code: 'return "hello " + input.name;' },
        },
      ],
      groups: [],
      exposedGroupIds: [],
    };
    await request(app).post("/projects").send({ id: "proj-1", name: "P" });
    await request(app).put("/projects/proj-1").send(project);

    const res = await request(app)
      .post("/projects/proj-1/nodes/tool-1/execute")
      .send({ input: { name: "world" } });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, result: "hello world" });
  });

  it("returns 404 when executing a node on a missing project", async () => {
    const res = await request(app)
      .post("/projects/missing/nodes/tool-1/execute")
      .send({ input: {} });
    expect(res.status).toBe(404);
  });

  it("returns 404 when executing a missing node", async () => {
    await request(app).post("/projects").send({ id: "proj-1", name: "P" });
    const res = await request(app)
      .post("/projects/proj-1/nodes/missing/execute")
      .send({ input: {} });
    expect(res.status).toBe(404);
  });

  it("returns a Claude config snippet for a project", async () => {
    await request(app).post("/projects").send({ id: "proj-1", name: "P" });
    const res = await request(app).get("/projects/proj-1/export/snippet");
    expect(res.status).toBe(200);
    expect(res.body.mcpServers["proj-1"].command).toBe("npx");
  });

  it("returns a zip archive for a project", async () => {
    await request(app).post("/projects").send({ id: "proj-1", name: "P" });
    const res = await request(app)
      .get("/projects/proj-1/export/archive")
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/zip");
    expect(res.body.length).toBeGreaterThan(0);

    // Entries are nested under the project id so that extracting the archive
    // produces exactly the path the config snippet references.
    const entries = new AdmZip(res.body)
      .getEntries()
      .map((e) => e.entryName)
      .sort();
    expect(entries).toEqual([
      "proj-1/README.md",
      "proj-1/index.ts",
      "proj-1/package.json",
    ]);

    const snippetRes = await request(app).get("/projects/proj-1/export/snippet");
    const snippetPath = snippetRes.body.mcpServers["proj-1"].args[1];
    expect(entries).toContain(snippetPath);
  });

  it("deletes a project", async () => {
    await request(app).post("/projects").send({ id: "proj-1", name: "P" });
    expect((await request(app).get("/projects/proj-1")).status).toBe(200);

    const delRes = await request(app).delete("/projects/proj-1");
    expect(delRes.status).toBe(204);

    expect((await request(app).get("/projects/proj-1")).status).toBe(404);
  });

  it("returns 404 when deleting a project that does not exist", async () => {
    const res = await request(app).delete("/projects/does-not-exist");
    expect(res.status).toBe(404);
  });
});
