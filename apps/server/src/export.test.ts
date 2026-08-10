import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import type { SynapseProject } from "@synapse/config-schema";
import { createZipBuffer, generateClaudeConfigSnippet } from "./export.js";

describe("createZipBuffer", () => {
  it("packages generated files into a zip", async () => {
    const buffer = await createZipBuffer([
      { path: "index.ts", contents: "console.log('hi');" },
      { path: "package.json", contents: "{}" },
    ]);
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries.sort()).toEqual(["index.ts", "package.json"]);
    expect(zip.readAsText("index.ts")).toBe("console.log('hi');");
  });

  it("nests entries under the given root directory", async () => {
    const buffer = await createZipBuffer(
      [
        { path: "index.ts", contents: "console.log('hi');" },
        { path: "package.json", contents: "{}" },
      ],
      "greet-server"
    );
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries.sort()).toEqual([
      "greet-server/index.ts",
      "greet-server/package.json",
    ]);
    // The nested path is what the Claude config snippet points at.
    expect(zip.readAsText("greet-server/index.ts")).toBe("console.log('hi');");
  });
});

describe("generateClaudeConfigSnippet", () => {
  it("produces a valid mcpServers config block", () => {
    const project: SynapseProject = {
      id: "greet-server",
      name: "greet-server",
      nodes: [],
      groups: [],
      exposedGroupIds: [],
      positions: {},
    };
    const snippet = generateClaudeConfigSnippet(project, "./greet-server");
    const parsed = JSON.parse(snippet);
    expect(parsed.mcpServers["greet-server"]).toEqual({
      command: "npx",
      args: ["tsx", "greet-server/index.ts"],
    });
  });
});
