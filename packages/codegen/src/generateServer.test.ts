import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { PromptArgument, SynapseProject } from "@synapse/config-schema";
import { generateServer } from "./generateServer.js";

const project: SynapseProject = {
  id: "greet-server",
  name: "greet-server",
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
    {
      id: "tool-2",
      kind: "tool",
      name: "hidden",
      description: "Not exposed",
      inputSchema: { type: "object", properties: {} },
      logic: { type: "code", code: 'return "should not appear";' },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["tool-1"] }],
  exposedGroupIds: ["g1"],
  positions: {},
};

describe("generateServer", () => {
  it("generates an index.ts registering only exposed tools", () => {
    const files = generateServer(project);
    const index = files.find((f) => f.path === "index.ts");
    expect(index).toBeDefined();
    expect(index!.contents).toContain('"greet"');
    expect(index!.contents).toContain('return "hi " + input.name;');
    expect(index!.contents).not.toContain("should not appear");
  });

  it("generates a package.json with the MCP SDK dependency", () => {
    const files = generateServer(project);
    const pkg = files.find((f) => f.path === "package.json");
    expect(pkg).toBeDefined();
    const parsed = JSON.parse(pkg!.contents);
    expect(parsed.dependencies["@modelcontextprotocol/sdk"]).toBeDefined();
  });

  it("generates a README documenting how to install and run the server", () => {
    const files = generateServer(project);
    const readme = files.find((f) => f.path === "README.md");
    expect(readme).toBeDefined();
    expect(readme!.contents).toContain("greet-server");
    expect(readme!.contents).toContain("npm install");
    expect(readme!.contents).toContain("tsx");
    expect(readme!.contents).toContain("mcpServers");
  });

  it("registers tools with a Zod raw shape inputSchema, not raw JSON Schema", () => {
    const files = generateServer(project);
    const index = files.find((f) => f.path === "index.ts");
    expect(index).toBeDefined();
    expect(index!.contents).toContain("jsonSchemaToZodShape(");
    expect(index!.contents).not.toContain('inputSchema: {"type":"object"');
    expect(index!.contents).toContain('import { z } from "zod";');
  });
});

const projectWithAllKinds: SynapseProject = {
  ...project,
  nodes: [
    ...project.nodes,
    {
      id: "resource-1",
      kind: "resource",
      name: "readme",
      uri: "synapse://readme",
      description: "Project readme",
      logic: { type: "code", code: 'return "readme contents";' },
    },
    {
      id: "prompt-1",
      kind: "prompt",
      name: "summarize",
      description: "Summarize something",
      arguments: [
        { name: "topic", description: "What to summarize", required: true },
      ],
      logic: { type: "code", code: 'return "Summarize: " + input.topic;' },
    },
  ],
  groups: [{ id: "g1", name: "default", nodeIds: ["tool-1", "resource-1", "prompt-1"] }],
};

describe("generateServer with resources and prompts", () => {
  it("registers exposed resource nodes", () => {
    const files = generateServer(projectWithAllKinds);
    const index = files.find((f) => f.path === "index.ts")!;
    expect(index.contents).toContain("server.registerResource(");
    expect(index.contents).toContain('"readme"');
    expect(index.contents).toContain("synapse://readme");
  });

  it("registers exposed prompt nodes with their arguments", () => {
    const files = generateServer(projectWithAllKinds);
    const index = files.find((f) => f.path === "index.ts")!;
    expect(index.contents).toContain("server.registerPrompt(");
    expect(index.contents).toContain('"summarize"');
    // The argument name is an object-literal key, so it must be emitted as a
    // quoted string literal — valid identifiers get quoted too, which is fine.
    expect(index.contents).toContain('"topic": z.string()');
    expect(index.contents).toContain('.describe("What to summarize")');
  });
});

/**
 * Checks that a generated index.ts is syntactically valid ES module source by
 * handing it to a fresh `node --check`. The generated file is plain JS (no type
 * annotations), uses ESM imports and top-level await, so `.mjs` is the right
 * parse mode. Throws with node's syntax error if the source does not parse.
 */
function assertParsesAsEsModule(source: string): void {
  const file = path.join(
    mkdtempSync(path.join(tmpdir(), "synapse-syntax-")),
    "index.mjs"
  );
  writeFileSync(file, source, "utf-8");
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } finally {
    rmSync(path.dirname(file), { recursive: true, force: true });
  }
}

describe("generateServer prompt argument names", () => {
  function projectWithPromptArgs(args: PromptArgument[]): SynapseProject {
    return {
      id: "prompt-server",
      name: "prompt-server",
      nodes: [
        {
          id: "prompt-1",
          kind: "prompt",
          name: "summarize",
          description: "Summarize something",
          arguments: args,
          logic: { type: "code", code: 'return "Summarize: " + input["my-arg"];' },
        },
      ],
      groups: [{ id: "g1", name: "default", nodeIds: ["prompt-1"] }],
      exposedGroupIds: ["g1"],
      positions: {},
    };
  }

  it("emits valid syntax for argument names that are not JS identifiers", () => {
    const files = generateServer(
      projectWithPromptArgs([
        { name: "my-arg", description: "A hyphenated argument", required: true },
        { name: "2nd", description: "A digit-leading argument", required: false },
      ])
    );
    const index = files.find((f) => f.path === "index.ts")!;

    expect(index.contents).toContain('"my-arg": z.string()');
    expect(index.contents).toContain('"2nd": z.string().optional()');
    // Bare `my-arg:` / `2nd:` keys would be a hard syntax error.
    expect(index.contents).not.toContain("my-arg: z.string()");
    expect(index.contents).not.toContain("2nd: z.string()");
    assertParsesAsEsModule(index.contents);
  });

  it("emits valid syntax for a prompt with no arguments", () => {
    const files = generateServer(projectWithPromptArgs([]));
    const index = files.find((f) => f.path === "index.ts")!;
    expect(index.contents).toContain("argsSchema: {  },");
    assertParsesAsEsModule(index.contents);
  });
});
