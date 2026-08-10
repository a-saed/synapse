import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { SynapseProject } from "@synapse/config-schema";
import { ProjectStorage } from "./storage.js";

const sampleProject: SynapseProject = {
  id: "proj-1",
  name: "Test",
  nodes: [],
  groups: [],
  exposedGroupIds: [],
  positions: {},
};

describe("ProjectStorage", () => {
  let dir: string;
  let storage: ProjectStorage;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "synapse-storage-"));
    storage = new ProjectStorage(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns null for a project that does not exist", async () => {
    expect(await storage.load("missing")).toBeNull();
  });

  it("round-trips a saved project", async () => {
    await storage.save(sampleProject);
    expect(await storage.load("proj-1")).toEqual(sampleProject);
  });

  it("lists all saved projects", async () => {
    await storage.save(sampleProject);
    await storage.save({ ...sampleProject, id: "proj-2", name: "Second" });
    const all = await storage.list();
    expect(all.map((p) => p.id).sort()).toEqual(["proj-1", "proj-2"]);
  });

  it("deletes a project", async () => {
    await storage.save(sampleProject);
    await storage.delete("proj-1");
    expect(await storage.load("proj-1")).toBeNull();
  });

  // Finding 1: Path traversal protection
  it("rejects projectId with path traversal attempts", async () => {
    await expect(storage.load("../evil")).rejects.toThrow(
      "Invalid projectId"
    );
  });

  it("rejects projectId with slashes", async () => {
    await expect(storage.load("a/b")).rejects.toThrow("Invalid projectId");
  });

  it("accepts valid projectId with hyphens and underscores", async () => {
    const validProject: SynapseProject = {
      id: "proj-with_valid-chars",
      name: "Valid",
      nodes: [],
      groups: [],
      exposedGroupIds: [],
      positions: {},
    };
    await storage.save(validProject);
    expect(await storage.load("proj-with_valid-chars")).toEqual(validProject);
  });

  // Finding 2: Per-file error isolation in list()
  it("skips corrupted JSON file and returns valid projects", async () => {
    await storage.save(sampleProject);
    await storage.save({ ...sampleProject, id: "proj-2", name: "Second" });
    // Write a corrupted JSON file directly
    const corruptPath = path.join(dir, "corrupt.json");
    await (await import("node:fs/promises")).writeFile(
      corruptPath,
      "not valid json {",
      "utf-8"
    );
    const all = await storage.list();
    expect(all.map((p) => p.id).sort()).toEqual(["proj-1", "proj-2"]);
  });

  it("skips schema-invalid file and returns valid projects", async () => {
    await storage.save(sampleProject);
    // Write a file with valid JSON but invalid schema (missing required fields)
    const invalidPath = path.join(dir, "invalid-schema.json");
    await (await import("node:fs/promises")).writeFile(
      invalidPath,
      JSON.stringify({ id: "invalid" }),
      "utf-8"
    );
    const all = await storage.list();
    expect(all.map((p) => p.id)).toEqual(["proj-1"]);
  });

  it("throws on load with invalid JSON", async () => {
    const filePath = path.join(dir, "proj-bad.json");
    await (await import("node:fs/promises")).writeFile(
      filePath,
      "not valid json {",
      "utf-8"
    );
    await expect(storage.load("proj-bad")).rejects.toThrow();
  });

  it("throws on load with schema-invalid content", async () => {
    const filePath = path.join(dir, "proj-invalid-schema.json");
    await (await import("node:fs/promises")).writeFile(
      filePath,
      JSON.stringify({ id: "proj-invalid-schema" }),
      "utf-8"
    );
    await expect(storage.load("proj-invalid-schema")).rejects.toThrow();
  });
});
