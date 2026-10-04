import { createFileRoute } from "@tanstack/react-router";
import { isHandle, normalizeHandle, type RoundId } from "@/lib/campaigns";
import { TASKS_TOTAL } from "@/lib/board";
import { readBoard, readPrice, saveProgress } from "@/lib/board-store.server";

const ROUNDS = new Set<RoundId>(["home", "claim", "airdrop"]);

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/leaderboard")({
  server: {
    handlers: {
      GET: async () => {
        const [players, price] = await Promise.all([readBoard(), readPrice()]);
        return json({ players, price, tasksTotal: TASKS_TOTAL, updatedAt: Date.now() });
      },
      POST: async ({ request }) => {
        const text = await request.text();
        if (text.length > 4000) return json({ error: "Too large" }, 413);
        let body: { handle?: unknown; referrer?: unknown; round?: unknown; tasks?: unknown };
        try {
          body = JSON.parse(text) as typeof body;
        } catch {
          return json({ error: "Bad JSON" }, 400);
        }
        const handle = typeof body.handle === "string" ? normalizeHandle(body.handle) : "";
        const referrer = typeof body.referrer === "string" ? normalizeHandle(body.referrer) : "";
        const round = typeof body.round === "string" ? body.round : "";
        const tasks = Array.isArray(body.tasks) ? body.tasks.filter((id): id is string => typeof id === "string") : [];
        if (!isHandle(handle) || !ROUNDS.has(round as RoundId) || tasks.length === 0) {
          return json({ error: "Need a handle, a round, and at least one task" }, 400);
        }
        const you = await saveProgress({ handle, referrer, round, tasks });
        return json({ ok: Boolean(you), you });
      },
    },
  },
});
