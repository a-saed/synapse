import type {
  PromptNode,
  ResourceNode,
  SynapseNode,
  SynapseProject,
  ToolNode,
} from "@synapse/config-schema";

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
    inputSchema: jsonSchemaToZodShape(${JSON.stringify(node.inputSchema)}),
  },
  async (input) => {
    const result = await (async () => {
${node.logic.code}
    })();
    return { content: [{ type: "text", text: result }] };
  }
);`;
}

function generateResourceRegistration(node: ResourceNode): string {
  return `
server.registerResource(
  ${JSON.stringify(node.name)},
  ${JSON.stringify(node.uri)},
  { description: ${JSON.stringify(node.description)} },
  async (uri) => {
    const result = await (async () => {
${node.logic.code}
    })();
    return { contents: [{ uri: uri.href, text: result }] };
  }
);`;
}

function generatePromptRegistration(node: PromptNode): string {
  const argsSchemaSrc = `{ ${node.arguments
    .map(
      (a) =>
        `${a.name}: z.string()${a.required ? "" : ".optional()"}.describe(${JSON.stringify(
          a.description
        )})`
    )
    .join(", ")} }`;

  return `
server.registerPrompt(
  ${JSON.stringify(node.name)},
  {
    description: ${JSON.stringify(node.description)},
    argsSchema: ${argsSchemaSrc},
  },
  async (input) => {
    const result = await (async () => {
${node.logic.code}
    })();
    return { messages: [{ role: "user", content: { type: "text", text: result } }] };
  }
);`;
}

const jsonSchemaToZodShapeHelper = `
function jsonSchemaToZodShape(schema) {
  const required = new Set(schema.required ?? []);
  const shape = {};
  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    let zodType;
    switch (prop.type) {
      case "string": zodType = z.string(); break;
      case "number": zodType = z.number(); break;
      case "boolean": zodType = z.boolean(); break;
      case "object": zodType = z.object({}).passthrough(); break;
      case "array": zodType = z.array(z.any()); break;
      default: zodType = z.any();
    }
    if (prop.description) zodType = zodType.describe(prop.description);
    shape[key] = required.has(key) ? zodType : zodType.optional();
  }
  return shape;
}
`.trim();

export function generateServer(project: SynapseProject): GeneratedFile[] {
  const nodes = exposedNodes(project);
  const tools = nodes.filter((n): n is ToolNode => n.kind === "tool");
  const resources = nodes.filter((n): n is ResourceNode => n.kind === "resource");
  const prompts = nodes.filter((n): n is PromptNode => n.kind === "prompt");

  const indexTs = `
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

${jsonSchemaToZodShapeHelper}

const server = new McpServer({ name: ${JSON.stringify(project.name)}, version: "1.0.0" });
${tools.map(generateToolRegistration).join("\n")}
${resources.map(generateResourceRegistration).join("\n")}
${prompts.map(generatePromptRegistration).join("\n")}

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
