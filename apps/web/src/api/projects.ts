import type { SynapseProject } from "@synapse/config-schema";
import { apiFetch } from "./client";
import type { SandboxResult, ClaudeConfigSnippet } from "./types";

export function listProjects(): Promise<SynapseProject[]> {
  return apiFetch<SynapseProject[]>("/projects");
}

export function getProject(id: string): Promise<SynapseProject> {
  return apiFetch<SynapseProject>(`/projects/${id}`);
}

export function createProject(input: { id: string; name: string }): Promise<SynapseProject> {
  return apiFetch<SynapseProject>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProject(project: SynapseProject): Promise<SynapseProject> {
  return apiFetch<SynapseProject>(`/projects/${project.id}`, {
    method: "PUT",
    body: JSON.stringify(project),
  });
}

export function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/projects/${id}`, { method: "DELETE" });
}

export function executeNode(
  projectId: string,
  nodeId: string,
  input: unknown
): Promise<SandboxResult> {
  return apiFetch<SandboxResult>(`/projects/${projectId}/nodes/${nodeId}/execute`, {
    method: "POST",
    body: JSON.stringify({ input }),
  });
}

export function getExportSnippet(id: string): Promise<ClaudeConfigSnippet> {
  return apiFetch<ClaudeConfigSnippet>(`/projects/${id}/export/snippet`);
}

export function exportArchiveUrl(id: string): string {
  return `/api/projects/${id}/export/archive`;
}
