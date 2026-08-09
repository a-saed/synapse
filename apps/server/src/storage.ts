import { promises as fs } from "node:fs";
import path from "node:path";
import {
  synapseProjectSchema,
  type SynapseProject,
} from "@synapse/config-schema";

export class ProjectStorage {
  constructor(private readonly dataDir: string) {}

  private filePath(projectId: string): string {
    return path.join(this.dataDir, `${projectId}.json`);
  }

  async save(project: SynapseProject): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(
      this.filePath(project.id),
      JSON.stringify(project, null, 2),
      "utf-8"
    );
  }

  async load(projectId: string): Promise<SynapseProject | null> {
    try {
      const raw = await fs.readFile(this.filePath(projectId), "utf-8");
      return synapseProjectSchema.parse(JSON.parse(raw));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async list(): Promise<SynapseProject[]> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const files = await fs.readdir(this.dataDir);
    return Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const raw = await fs.readFile(path.join(this.dataDir, f), "utf-8");
          return synapseProjectSchema.parse(JSON.parse(raw));
        })
    );
  }

  async delete(projectId: string): Promise<void> {
    await fs.rm(this.filePath(projectId), { force: true });
  }
}
