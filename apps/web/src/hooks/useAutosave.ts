import { useEffect, useRef, useState, useCallback } from "react";
import type { SynapseProject } from "@synapse/config-schema";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave(
  project: SynapseProject | undefined,
  save: (project: SynapseProject) => Promise<SynapseProject>,
  delayMs = 500
): { status: SaveStatus; retry: () => void } {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const lastAttempted = useRef<SynapseProject | undefined>(undefined);

  const attemptSave = useCallback(
    (p: SynapseProject) => {
      lastAttempted.current = p;
      setStatus("saving");
      save(p)
        .then(() => setStatus("saved"))
        .catch(() => setStatus("error"));
    },
    [save]
  );

  useEffect(() => {
    if (!project) return;
    const timer = setTimeout(() => attemptSave(project), delayMs);
    return () => clearTimeout(timer);
  }, [project, delayMs, attemptSave]);

  const retry = useCallback(() => {
    if (lastAttempted.current) attemptSave(lastAttempted.current);
  }, [attemptSave]);

  return { status, retry };
}
