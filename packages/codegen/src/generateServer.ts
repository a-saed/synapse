import type { SynapseNode, SynapseProject, ToolNode } from "@synapse/config-schema";

export interface GeneratedFile {
  path: string;
  contents: string;
}

function exposedNodes(project: SynapseProject): SynapseNode[] {
  const exposedGroups = project.groups.filter((g) =>
    project.exposedGroupIds.includes(g.id)
  );
  const exposedNodeIds = new Set(exposedGroups.flatMap((g) => g.nodeIds));
  return project.nodes.filter((n) => exposedNodeIds.has(n.id));
}

function generateToolRegistration(node: ToolNode): string {
  return `
server.registerTool(
  ${JSON.stringify(node.name)},
  {
    description: ${JSON.stringify(node.description)},
    inputSchema: ${JSON.stringify(node.inputSchema)},
  },
  async (input) => {
    const result = await (async () => {
${node.logic.code}
    })();
    return { content: [{ type: "text", text: result }] };
  }
);`;
}

export function generateServer(project: SynapseProject): GeneratedFile[] {
  const tools = exposedNodes(project).filter(
    (n): n is ToolNode => n.kind === "tool"
  );

  const indexTs = `
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: ${JSON.stringify(project.name)}, version: "1.0.0" });
${tools.map(generateToolRegistration).join("\n")}

const transport = new StdioServerTransport();
await server.connect(transport);
`.trimStart();

  const packageJson = JSON.stringify(
    {
      name: project.id,
      version: "1.0.0",
      type: "module",
      dependencies: {
        "@modelcontextprotocol/sdk": "^1.0.0",
        zod: "^3.23.0",
      },
      devDependencies: {
        tsx: "^4.19.0",
      },
    },
    null,
    2
  );

  return [
    { path: "index.ts", contents: indexTs },
    { path: "package.json", contents: packageJson },
  ];
}
