import { z } from "zod";

export const codeBlockSchema = z.object({
  type: z.literal("code"),
  code: z.string().min(1, "code must not be empty"),
});
export type CodeBlock = z.infer<typeof codeBlockSchema>;

const jsonSchemaPropertySchema = z.object({
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  description: z.string().optional(),
});

const jsonSchemaObjectSchema = z.object({
  type: z.literal("object"),
  properties: z.record(jsonSchemaPropertySchema),
  required: z.array(z.string()).optional(),
});
export type JsonSchemaObject = z.infer<typeof jsonSchemaObjectSchema>;

export const toolNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("tool"),
  name: z.string().min(1),
  description: z.string().min(1),
  inputSchema: jsonSchemaObjectSchema,
  logic: codeBlockSchema,
});
export type ToolNode = z.infer<typeof toolNodeSchema>;

export const resourceNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("resource"),
  name: z.string().min(1),
  uri: z.string().min(1),
  description: z.string().min(1),
  logic: codeBlockSchema,
});
export type ResourceNode = z.infer<typeof resourceNodeSchema>;

export const promptArgumentSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean(),
});
export type PromptArgument = z.infer<typeof promptArgumentSchema>;

export const promptNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("prompt"),
  name: z.string().min(1),
  description: z.string().min(1),
  arguments: z.array(promptArgumentSchema),
  logic: codeBlockSchema,
});
export type PromptNode = z.infer<typeof promptNodeSchema>;

export const synapseNodeSchema = z.discriminatedUnion("kind", [
  toolNodeSchema,
  resourceNodeSchema,
  promptNodeSchema,
]);
export type SynapseNode = z.infer<typeof synapseNodeSchema>;

export const synapseGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nodeIds: z.array(z.string()),
});
export type SynapseGroup = z.infer<typeof synapseGroupSchema>;

export const synapseProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nodes: z.array(synapseNodeSchema),
  groups: z.array(synapseGroupSchema),
  exposedGroupIds: z.array(z.string()),
});
export type SynapseProject = z.infer<typeof synapseProjectSchema>;
