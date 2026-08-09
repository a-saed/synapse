import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { SynapseProject } from "@synapse/config-schema";
import { generateServer } from "./generateServer.js";

describe("generated server end-to-end", () => {
  it(
    "responds to a real MCP client tool call over stdio",
    async () => {
      const project: SynapseProject = {
        id: "greet-server",
        name: "greet-server",
        nodes: [
          {
            id: "greet",
            kind: "tool",
            name: "greet",
            description: "Greets a person by name",
            inputSchema: {
              type: "object",
              properties: { name: { type: "string" } },
              required: ["name"],
            },
            logic: {
              type: "code",
              code: 'return "Hello, " + input.name + "!";',
            },
          },
        ],
        groups: [{ id: "g1", name: "default", nodeIds: ["greet"] }],
        exposedGroupIds: ["g1"],
      };

      const files = generateServer(project);
      const dir = await mkdtemp(path.join(tmpdir(), "synapse-e2e-"));

      try {
        for (const file of files) {
          await writeFile(path.join(dir, file.path), file.contents, "utf-8");
        }

        execSync("npm install", { cwd: dir, stdio: "inherit" });

        const transport = new StdioClientTransport({
          command: "npx",
          args: ["tsx", path.join(dir, "index.ts")],
        });
        const client = new Client({
          name: "synapse-test-client",
          version: "1.0.0",
        });
        await client.connect(transport);

        try {
          const result = await client.callTool({
            name: "greet",
            arguments: { name: "Ada" },
          });

          expect(result.content).toMatchObject([
            { type: "text", text: "Hello, Ada!" },
          ]);
        } finally {
          // Always tear the child process down; a failed assertion would
          // otherwise leave the spawned server running and hang the suite.
          await client.close();
        }
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    60_000
  );
});
