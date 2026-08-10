import { useEffect, useRef, useState, useCallback } from "react";
import type { SynapseProject } from "@synapse/config-schema";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave(
  project: SynapseProject | undefined,
  save: (project: SynapseProject) => Promise<SynapseProject>,
  delayMs = 500
): { status: SaveStatus; retry: () => void } {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveRef = useRef(save);
  saveRef.current = save;
  const projectRef = useRef(project);
  projectRef.current = project;

  // Reads `save`/`project` via refs rather than closing over them directly so
  // this callback's identity never changes, and the debounce effect below
  // never re-arms just because the caller passed a new inline `save` closure
  // or because a save's own pending/success state caused a re-render.
  const attemptSave = useCallback((p: SynapseProject) => {
    setStatus("saving");
    saveRef.current(p)
      .then(() => setStatus("saved"))
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (!project) return;
    const timer = setTimeout(() => attemptSave(project), delayMs);
    return () => clearTimeout(timer);
  }, [project, delayMs, attemptSave]);

  const retry = useCallback(() => {
    if (projectRef.current) attemptSave(projectRef.current);
  }, [attemptSave]);

  return { status, retry };
}
