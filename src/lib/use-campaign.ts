import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isHandle,
  normalizeHandle,
  tasks,
  type Round,
  type TaskId,
} from "@/lib/campaigns";

export type FlagMap = Record<TaskId, boolean>;

export type CampaignState = {
  handle: string;
  referrer: string;
  done: FlagMap;
  opened: FlagMap;
};

function emptyFlags(): FlagMap {
  const flags = {} as FlagMap;
  for (const task of tasks) flags[task.id] = false;
  return flags;
}

function emptyState(): CampaignState {
  return { handle: "", referrer: "", done: emptyFlags(), opened: emptyFlags() };
}

function readStored(key: string): CampaignState {
  const base = emptyState();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<CampaignState>;
    return {
      handle: typeof parsed.handle === "string" ? parsed.handle : "",
      referrer: typeof parsed.referrer === "string" ? parsed.referrer : "",
      done: { ...emptyFlags(), ...(parsed.done ?? {}) },
      opened: { ...emptyFlags(), ...(parsed.opened ?? {}) },
    };
  } catch {
    return base;
  }
}

export function useCampaign(round: Round) {
  const [state, setState] = useState<CampaignState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored(round.storageKey);
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (ref && isHandle(ref)) {
        const name = normalizeHandle(ref);
        if (!stored.referrer && name.toLowerCase() !== stored.handle.toLowerCase()) {
          stored.referrer = name;
        }
      }
      localStorage.setItem(round.storageKey, JSON.stringify(stored));
      if (ref !== null) {
        url.searchParams.delete("ref");
        const next = url.pathname + (url.search ? url.search : "") + url.hash;
        window.history.replaceState(window.history.state, "", next);
      }
    } catch {
      /* ignore malformed urls or private mode */
    }
    setState(stored);
    setReady(true);
  }, [round.storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(round.storageKey, JSON.stringify(state));
    } catch {
      /* private mode */
    }
  }, [state, ready, round.storageKey]);

  const setHandle = useCallback((handle: string) => {
    setState((prev) => ({
      ...prev,
      handle,
      referrer: prev.referrer.toLowerCase() === handle.toLowerCase() ? "" : prev.referrer,
    }));
  }, []);

  const markOpened = useCallback((id: TaskId) => {
    setState((prev) => ({ ...prev, opened: { ...prev.opened, [id]: true } }));
  }, []);

  const markDone = useCallback((id: TaskId) => {
    setState((prev) => ({ ...prev, done: { ...prev.done, [id]: true } }));
  }, []);

  const doneCount = useMemo(
    () => tasks.filter((task) => state.done[task.id]).length,
    [state.done],
  );

  const complete = Boolean(state.handle) && doneCount === tasks.length;

  return { state, ready, setHandle, markOpened, markDone, doneCount, complete };
}

export function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);

  return value;
}
