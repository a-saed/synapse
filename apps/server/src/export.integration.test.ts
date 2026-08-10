import { describe, it, expect } from "vitest";
import request from "supertest";
import AdmZip from "adm-zip";
import { execSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { SynapseProject } from "@synapse/config-schema";
import { createApp } from "./app.js";
import { ProjectStorage } from "./storage.js";

/**
 * End-to-end coverage of the *shipping* export path: a project goes in over
 * HTTP, the zip comes back out of `GET /projects/:id/export/archive`, and the
 * server that falls out of that archive is installed and driven by a real MCP
 * client over stdio.
 *
 * This is deliberately broader than packages/codegen's integration test, which
 * calls generateServer() directly and only exercises a tool node. Here all
 * three node kinds are exercised — the generated registerResource/registerPrompt
 * call shapes had previously only been verified by reading the SDK's types.
 */
const project: SynapseProject = {
  id: "export-e2e",
  name: "export-e2e",
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
      logic: { type: "code", code: 'return "Hello, " + input.name + "!";' },
    },
    {
      id: "readme",
      kind: "resource",
      name: "readme",
      uri: "synapse://readme",
      description: "The project readme",
      logic: { type: "code", code: 'return "readme contents";' },
    },
    {
      id: "summarize",
      kind: "prompt",
      name: "summarize",
      description: "Summarize a topic",
      arguments: [
        { name: "topic", description: "What to summarize", required: true },
      ],
      logic: { type: "code", code: 'return "Summarize: " + input.topic;' },
    },
    {
      id: "hidden",
      kind: "tool",
      name: "hidden",
      description: "Not exposed to clients",
      inputSchema: { type: "object", properties: {} },
      logic: { type: "code", code: 'return "should not appear";' },
    },
  ],
  groups: [
    { id: "g1", name: "default", nodeIds: ["greet", "readme", "summarize"] },
  ],
  exposedGroupIds: ["g1"],
  positions: {},
};

describe("exported archive end-to-end", () => {
  it(
    "serves an archive whose server answers tool, resource and prompt calls",
    async () => {
      const dataDir = await mkdtemp(path.join(tmpdir(), "synapse-export-e2e-"));
      const app = createApp({ storage: new ProjectStorage(dataDir) });

      try {
        const createRes = await request(app).post("/projects").send(project);
        expect(createRes.status).toBe(201);

        // `responseType("blob")` is required: without it superagent has no
        // parser for application/zip and decodes the body as utf-8 text,
        // leaving `res.body` an empty object and the extraction a silent no-op.
        const archiveRes = await request(app)
          .get(`/projects/${project.id}/export/archive`)
          .responseType("blob");
        expect(archiveRes.status).toBe(200);
        expect(Buffer.isBuffer(archiveRes.body)).toBe(true);

        // Extract the real zip bytes the HTTP route produced. Entries are
        // nested under the project id, so the runnable server lives in a
        // subdirectory — the same path the config snippet points at.
        new AdmZip(archiveRes.body).extractAllTo(dataDir, true);
        const serverDir = path.join(dataDir, project.id);
        // Fail loudly here rather than letting a missing directory surface
        // downstream as an opaque `spawnSync /bin/sh ENOENT` from execSync.
        expect(existsSync(path.join(serverDir, "index.ts"))).toBe(true);

        execSync("npm install", { cwd: serverDir, stdio: "inherit" });

        const transport = new StdioClientTransport({
          command: "npx",
          args: ["tsx", path.join(serverDir, "index.ts")],
        });
        const client = new Client({
          name: "synapse-export-test-client",
          version: "1.0.0",
        });
        await client.connect(transport);

        try {
          const toolResult = await client.callTool({
            name: "greet",
            arguments: { name: "Ada" },
          });
          expect(toolResult.content).toMatchObject([
            { type: "text", text: "Hello, Ada!" },
          ]);

          const resourceResult = await client.readResource({
            uri: "synapse://readme",
          });
          expect(resourceResult.contents).toMatchObject([
            { uri: "synapse://readme", text: "readme contents" },
          ]);

          const promptResult = await client.getPrompt({
            name: "summarize",
            arguments: { topic: "otters" },
          });
          expect(promptResult.messages).toMatchObject([
            {
              role: "user",
              content: { type: "text", text: "Summarize: otters" },
            },
          ]);

          // Nodes outside an exposed group must not reach the client at all.
          const tools = await client.listTools();
          expect(tools.tools.map((t) => t.name)).toEqual(["greet"]);
        } finally {
          await client.close();
        }
      } finally {
        await rm(dataDir, { recursive: true, force: true });
      }
    },
    120_000
  );
});
