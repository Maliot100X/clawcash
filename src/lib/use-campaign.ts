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

const SHARED_REF = "clawcash_referrer_v1";

function readSharedRef() {
  try {
    const value = localStorage.getItem(SHARED_REF) ?? "";
    return isHandle(value) ? normalizeHandle(value) : "";
  } catch {
    return "";
  }
}

function writeSharedRef(name: string) {
  try {
    if (name && isHandle(name) && !localStorage.getItem(SHARED_REF)) {
      localStorage.setItem(SHARED_REF, normalizeHandle(name));
    }
  } catch {
    /* private mode */
  }
}

export function useCampaign(round: Round, refHandle?: string) {
  const [state, setState] = useState<CampaignState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored(round.storageKey);
    try {
      const url = new URL(window.location.href);
      const fromPath = refHandle && isHandle(refHandle) ? normalizeHandle(refHandle) : "";
      const fromQuery = url.searchParams.get("ref");
      const raw = fromPath || (fromQuery && isHandle(fromQuery) ? normalizeHandle(fromQuery) : "");
      const shared = readSharedRef();
      const incoming = raw || (!stored.referrer ? shared : "");
      if (incoming && incoming.toLowerCase() !== stored.handle.toLowerCase()) {
        if (!stored.referrer) stored.referrer = incoming;
        writeSharedRef(stored.referrer);
      } else if (stored.referrer) {
        writeSharedRef(stored.referrer);
      }
      localStorage.setItem(round.storageKey, JSON.stringify(stored));
    } catch {
      /* ignore malformed urls or private mode */
    }
    setState(stored);
    setReady(true);
  }, [round.storageKey, refHandle]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(round.storageKey, JSON.stringify(state));
    } catch {
      /* private mode */
    }
  }, [state, ready, round.storageKey]);

  const setHandle = useCallback((handle: string) => {
    setState((prev) => {
      if (handle && readSharedRef().toLowerCase() === handle.toLowerCase()) {
        try {
          localStorage.removeItem(SHARED_REF);
        } catch {
          /* private mode */
        }
      }
      return {
        ...prev,
        handle,
        referrer: prev.referrer.toLowerCase() === handle.toLowerCase() ? "" : prev.referrer,
      };
    });
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
