import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { formatTokenPrice, formatUsd, type BoardRow, type BoardSnapshot } from "@/lib/board";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "ClawCash | Live board" },
      {
        name: "description",
        content: "Live ClawCash board. Real task progress, referral counts, scores, and the $CLAWRENA price.",
      },
    ],
  }),
});

function formatCap(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function LeaderboardPage() {
  const [data, setData] = useState<BoardSnapshot | null>(null);
  const [error, setError] = useState("");
  const [you, setYou] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("clawcash_campaign_v1");
      const handle = raw ? (JSON.parse(raw) as { handle?: string }).handle : "";
      if (typeof handle === "string") setYou(handle.replace(/^@/, ""));
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const json = (await response.json()) as BoardSnapshot;
        if (!stop) {
          setData(json);
          setError("");
        }
      } catch {
        if (!stop) setError("The board could not refresh. Trying again.");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  const players = data?.players ?? [];
  const price = data?.price;
  const change = price?.change24h;

  return (
    <div className="min-h-dvh bg-ink text-bone">
      <SiteHeader active="board" />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">Live board</p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">Who is actually in.</h1>
        <p className="mt-4 max-w-2xl text-soft">
          Only accounts that marked a campaign task done. No sample rows. Price is the live $CLAWRENA market print.
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <article className="rounded-3xl border border-line bg-panel p-5 sm:col-span-2">
            <p className="text-sm text-mute">$CLAWRENA</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">{formatTokenPrice(price?.usd) || "—"}</p>
            <p className={`mt-2 text-sm font-semibold ${change == null ? "text-mute" : change >= 0 ? "text-gain" : "text-danger"}`}>
              {change == null ? "24h —" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}% 24h`}
            </p>
          </article>
          <article className="rounded-3xl border border-line bg-panel p-5">
            <p className="text-sm text-mute">Market cap</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCap(price?.marketCap ?? null)}</p>
            <p className="mt-2 text-sm text-mute">{players.length} on the board</p>
          </article>
        </section>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        {!data && !error ? <p className="mt-8 text-sm text-mute">Loading the live board…</p> : null}

        {data && players.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-line bg-panel p-8">
            <p className="text-lg font-semibold">No one has finished a task yet.</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-soft">
              The board only lists accounts that marked a real task done. It does not ship with sample names.
            </p>
            <Link to="/" className="mt-5 inline-flex rounded-2xl bg-ember px-5 py-3 text-sm font-semibold text-ink">
              Start the campaign
            </Link>
          </div>
        ) : data ? (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-panel">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rank</th>
                  <th className="px-4 py-3 font-semibold">Player</th>
                  <th className="px-4 py-3 font-semibold">Tasks</th>
                  <th className="px-4 py-3 font-semibold">Refs</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 text-right font-semibold">Collected</th>
                </tr>
              </thead>
              <tbody>
                {players.map((row) => (
                  <BoardLine key={row.handle} row={row} you={you} />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-mute">
          Progress is what each person marks in the campaign. Credits stay reserved until mainnet and are checked before
          they are issued. Trading is not live. The price is read from the public Dexscreener market for the $CLAWRENA
          mint and is not an offer to buy or sell.
        </p>
      </main>
    </div>
  );
}

function BoardLine({ row, you }: { row: BoardRow; you: string }) {
  const mine = you && row.handle.toLowerCase() === you.toLowerCase();
  return (
    <tr className={`border-t border-line ${mine ? "bg-ember/10" : ""}`}>
      <td className="px-4 py-4 font-semibold tabular-nums text-gold">#{row.rank}</td>
      <td className="px-4 py-4 font-semibold">
        @{row.handle}
        {mine ? <span className="ml-2 text-xs font-semibold text-ember">You</span> : null}
      </td>
      <td className="px-4 py-4 tabular-nums">
        {row.tasksDone}/{row.tasksTotal}
      </td>
      <td className="px-4 py-4 tabular-nums">{row.refs}</td>
      <td className="px-4 py-4 tabular-nums">{row.score.toLocaleString("en-US")}</td>
      <td className="px-4 py-4 text-right font-semibold tabular-nums">{formatUsd(row.earnedUsd)}</td>
    </tr>
  );
}
