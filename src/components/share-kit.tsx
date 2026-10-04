import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { inviteLink, shareImage, tasks } from "@/lib/campaigns";
import { scoreOf, sharePost, type BoardSnapshot } from "@/lib/board";

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function ShareKit({
  handle,
  doneCount,
  complete,
  pendingUsd,
}: {
  handle: string;
  doneCount: number;
  complete: boolean;
  pendingUsd: number;
}) {
  const [board, setBoard] = useState<BoardSnapshot | null>(null);
  const [linkState, setLinkState] = useState<"" | "ok" | "fail">("");
  const [postState, setPostState] = useState<"" | "ok" | "fail">("");
  const link = inviteLink(handle);

  useEffect(() => {
    if (!handle) return;
    let stop = false;
    const load = async () => {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!response.ok) return;
        const json = (await response.json()) as BoardSnapshot;
        if (!stop) setBoard(json);
      } catch {
        /* the composer still works from local progress */
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [handle]);

  const mine = board?.players.find((row) => row.handle.toLowerCase() === handle.toLowerCase());
  const tasksDone = mine?.tasksDone ?? doneCount;
  const refs = mine?.refs ?? 0;
  const earned = mine?.earnedUsd ?? (complete ? pendingUsd : 0);
  const finished = mine?.complete ?? (tasksDone === tasks.length);
  const score = mine?.score ?? scoreOf(tasksDone, refs, earned, finished);
  const post = useMemo(
    () =>
      sharePost({
        handle,
        tasksDone,
        tasksTotal: tasks.length,
        refs,
        score,
        earnedUsd: earned,
        rank: mine?.rank ?? null,
        priceUsd: board?.price.usd ?? null,
        complete: finished,
      }),
    [board?.price.usd, earned, finished, handle, mine?.rank, refs, score, tasksDone],
  );

  async function copy(value: string, which: "link" | "post") {
    const ok = await copyText(value);
    const set = which === "link" ? setLinkState : setPostState;
    set(ok ? "ok" : "fail");
    window.setTimeout(() => set(""), 2200);
  }

  return (
    <div className="mt-5 border-t border-dashed border-line pt-4">
      <p className="font-semibold">Your invite link</p>
      <p className="mt-0.5 text-sm text-mute">
        This link is what you post. X reads the card from {shareImage}
      </p>
      <div className="mt-3 flex gap-2">
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-line bg-ink px-3 py-3">
          <span className="truncate text-sm text-soft" title={link}>
            {link}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void copy(link, "link")}
          aria-label="Copy your invite link"
          className="inline-flex w-28 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ember font-semibold text-ink"
        >
          {linkState === "ok" ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy
            </>
          )}
        </button>
      </div>
      <p className="mt-4 text-sm font-semibold">Ready to post</p>
      <textarea
        readOnly
        value={post}
        rows={11}
        className="mt-2 w-full resize-none rounded-2xl border border-line bg-ink px-3 py-3 text-sm leading-relaxed text-soft"
        aria-label="Post text for X"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy(post, "post")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
        >
          {postState === "ok" ? "Post copied" : "Copy post"}
        </button>
        <a
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(post)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-xl bg-bone px-4 py-2.5 text-sm font-semibold text-ink"
        >
          Post on X
        </a>
        <Link to="/leaderboard" className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-ember">
          Open the board
        </Link>
      </div>
      <p role="status" className="mt-2 min-h-5 text-xs text-danger">
        {linkState === "fail" || postState === "fail" ? "Your browser blocked copying. Select the text and copy it." : ""}
      </p>
      <p className="text-xs leading-relaxed text-mute">
        Rank, score, refs, and collected amount come from the live board. One credit per X account. Accounts are checked
        before credits are issued.
      </p>
    </div>
  );
}
