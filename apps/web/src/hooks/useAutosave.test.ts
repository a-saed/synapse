import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { SynapseProject } from "@synapse/config-schema";
import { useAutosave } from "./useAutosave";

const project: SynapseProject = {
  id: "p",
  name: "P",
  nodes: [],
  groups: [],
  exposedGroupIds: [],
  positions: {},
};

describe("useAutosave", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("does not save immediately", () => {
    const save = vi.fn().mockResolvedValue(project);
    renderHook(() => useAutosave(project, save, 500));
    expect(save).not.toHaveBeenCalled();
  });

  it("saves after the debounce delay and reports saved", async () => {
    const save = vi.fn().mockResolvedValue(project);
    const { result } = renderHook(() => useAutosave(project, save, 500));

    act(() => {
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(save).toHaveBeenCalledWith(project);
  });

  it("resets the debounce timer when the project changes again before it fires", async () => {
    const save = vi.fn().mockResolvedValue(project);
    const { rerender } = renderHook(({ p }) => useAutosave(p, save, 500), {
      initialProps: { p: project },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ p: { ...project, name: "P2" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(save).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("reports an error status when save rejects, and retry re-attempts it", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(project);
    const { result } = renderHook(() => useAutosave(project, save, 500));

    act(() => {
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("does nothing when project is undefined", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useAutosave(undefined, save, 500));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });
});
