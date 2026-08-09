import archiver from "archiver";
import path from "node:path";
import type { GeneratedFile } from "@synapse/codegen";
import type { SynapseProject } from "@synapse/config-schema";

/**
 * Packages generated files into a zip buffer.
 *
 * `rootDir`, when given, becomes a single top-level directory inside the
 * archive. The export route passes the project id so the extracted tree is
 * `<project.id>/index.ts` — which is exactly the path the Claude config
 * snippet points at (`./<project.id>/index.ts`). Without it the archive
 * extracted flat and the snippet referenced a directory that never existed.
 */
export function createZipBuffer(
  files: GeneratedFile[],
  rootDir?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip");
    const chunks: Buffer[] = [];
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    for (const file of files) {
      const name = rootDir ? path.posix.join(rootDir, file.path) : file.path;
      archive.append(file.contents, { name });
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
