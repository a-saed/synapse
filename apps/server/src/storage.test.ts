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
});
