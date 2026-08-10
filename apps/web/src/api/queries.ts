import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SynapseProject } from "@synapse/config-schema";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  executeNode,
} from "./projects";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({ queryKey: projectKeys.all, queryFn: listProjects });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data: SynapseProject) =>
      queryClient.setQueryData(projectKeys.detail(data.id), data),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useExecuteNode() {
  return useMutation({
    mutationFn: ({
      projectId,
      nodeId,
      input,
    }: {
      projectId: string;
      nodeId: string;
      input: unknown;
    }) => executeNode(projectId, nodeId, input),
  });
}
