export interface SandboxResult {
  ok: boolean;
  result?: string;
  error?: string;
}

export interface ClaudeConfigSnippet {
  mcpServers: Record<string, { command: string; args: string[] }>;
}
