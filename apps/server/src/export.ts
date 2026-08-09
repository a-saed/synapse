import archiver from "archiver";
import path from "node:path";
import type { GeneratedFile } from "@synapse/codegen";
import type { SynapseProject } from "@synapse/config-schema";

export function createZipBuffer(files: GeneratedFile[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip");
    const chunks: Buffer[] = [];
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    for (const file of files) {
      archive.append(file.contents, { name: file.path });
    }
    void archive.finalize();
  });
}

export function generateClaudeConfigSnippet(
  project: SynapseProject,
  installPath: string
): string {
  return JSON.stringify(
    {
      mcpServers: {
        [project.id]: {
          command: "npx",
          args: ["tsx", path.join(installPath, "index.ts")],
        },
      },
    },
    null,
    2
  );
}
