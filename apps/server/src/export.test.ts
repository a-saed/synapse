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
});

describe("generateClaudeConfigSnippet", () => {
  it("produces a valid mcpServers config block", () => {
    const project: SynapseProject = {
      id: "greet-server",
      name: "greet-server",
      nodes: [],
      groups: [],
      exposedGroupIds: [],
    };
    const snippet = generateClaudeConfigSnippet(project, "./greet-server");
    const parsed = JSON.parse(snippet);
    expect(parsed.mcpServers["greet-server"]).toEqual({
      command: "npx",
      args: ["tsx", "greet-server/index.ts"],
    });
  });
});
