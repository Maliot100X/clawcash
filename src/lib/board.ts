import {
  filmVideo,
  inviteLink,
  isHandle,
  normalizeHandle,
  rounds,
  shareImage,
  shareOrigin,
  tasks,
  type RoundId,
  type TaskId,
} from "@/lib/campaigns";
import { mint } from "@/lib/launch";

export const TASKS_TOTAL = tasks.length;
export const PLAYER_CAP = 2000;
export const tokenMint = mint;

const TASK_IDS = new Set<TaskId>(tasks.map((task) => task.id));
const ROUND_IDS = new Set<RoundId>(["home", "claim", "airdrop"]);

export type StoredPlayer = {
  handle: string;
  referrer: string;
  rounds: Partial<Record<RoundId, TaskId[]>>;
  updatedAt: number;
};

export type BoardRow = {
  rank: number;
  handle: string;
  tasksDone: number;
  tasksTotal: number;
  refs: number;
  score: number;
  earnedUsd: number;
  complete: boolean;
  updatedAt: number;
};

export type PriceQuote = {
  usd: number | null;
  change24h: number | null;
  marketCap: number | null;
  symbol: "CLAWRENA";
};

export type BoardSnapshot = {
  players: BoardRow[];
  price: PriceQuote;
  tasksTotal: number;
  updatedAt: number;
};

export function formatTokenPrice(usd: number | null | undefined) {
  if (usd == null || !Number.isFinite(usd) || usd <= 0) return "";
  if (usd < 0.0001) return `$${usd.toFixed(8)}`;
  if (usd < 1) return `$${usd.toFixed(6)}`;
  return usd.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function formatUsd(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function uniqueTasks(player: StoredPlayer) {
  const seen = new Set<TaskId>();
  for (const list of Object.values(player.rounds)) {
    for (const id of list ?? []) if (TASK_IDS.has(id)) seen.add(id);
  }
  return tasks.map((task) => task.id).filter((id) => seen.has(id));
}

export function earnedUsd(player: StoredPlayer) {
  let total = 0;
  for (const round of Object.values(rounds)) {
    const done = new Set(player.rounds[round.id] ?? []);
    if (tasks.every((task) => done.has(task.id))) total += round.rewardUsd;
  }
  return total;
}

export function scoreOf(tasksDone: number, refs: number, earned: number, complete: boolean) {
  return tasksDone * 100 + refs * 250 + Math.round(earned) + (complete ? 500 : 0);
}

export function projectRows(players: StoredPlayer[]): BoardRow[] {
  const visible = players.filter((player) => uniqueTasks(player).length > 0);
  const refCounts = new Map<string, number>();
  for (const player of visible) {
    const ref = player.referrer.trim().toLowerCase();
    if (!ref || ref === player.handle.toLowerCase()) continue;
    refCounts.set(ref, (refCounts.get(ref) ?? 0) + 1);
  }
  const rows = visible.map((player) => {
    const done = uniqueTasks(player);
    const earned = earnedUsd(player);
    const refs = refCounts.get(player.handle.toLowerCase()) ?? 0;
    const complete = done.length === TASKS_TOTAL;
    return {
      rank: 0,
      handle: player.handle,
      tasksDone: done.length,
      tasksTotal: TASKS_TOTAL,
      refs,
      score: scoreOf(done.length, refs, earned, complete),
      earnedUsd: earned,
      complete,
      updatedAt: player.updatedAt,
    };
  });
  rows.sort(
    (a, b) =>
      b.score - a.score ||
      b.tasksDone - a.tasksDone ||
      b.refs - a.refs ||
      a.updatedAt - b.updatedAt ||
      a.handle.localeCompare(b.handle),
  );
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });
  return rows;
}

export function applyProgress(
  players: StoredPlayer[],
  input: { handle: string; referrer: string; round: string; tasks: string[]; now: number },
): StoredPlayer[] {
  const handle = normalizeHandle(input.handle);
  if (!isHandle(handle) || !ROUND_IDS.has(input.round as RoundId)) return players;
  const round = input.round as RoundId;
  const incoming = new Set(input.tasks.filter((id): id is TaskId => TASK_IDS.has(id as TaskId)));
  if (incoming.size === 0) return players;
  const key = handle.toLowerCase();
  const next = players.map((player) => ({ ...player, rounds: { ...player.rounds } }));
  let player = next.find((item) => item.handle.toLowerCase() === key);
  if (!player) {
    if (next.length >= PLAYER_CAP) return players;
    player = { handle, referrer: "", rounds: {}, updatedAt: input.now };
    next.push(player);
  }
  const merged = new Set(player.rounds[round] ?? []);
  for (const id of incoming) merged.add(id);
  player.rounds[round] = tasks.map((task) => task.id).filter((id) => merged.has(id));
  const ref = normalizeHandle(input.referrer);
  if (!player.referrer && ref && isHandle(ref) && ref.toLowerCase() !== key) player.referrer = ref;
  player.handle = player.handle || handle;
  player.updatedAt = input.now;
  return next.filter((item) => uniqueTasks(item).length > 0);
}

export function sharePost(input: {
  handle: string;
  tasksDone: number;
  tasksTotal: number;
  refs: number;
  score: number;
  earnedUsd: number;
  rank: number | null;
  priceUsd: number | null;
  complete: boolean;
}) {
  const link = inviteLink(input.handle);
  const opener = input.complete
    ? "Just completed the ClawCash tasks."
    : `Working the ClawCash tasks. ${input.tasksDone}/${input.tasksTotal} done.`;
  const price = formatTokenPrice(input.priceUsd);
  return [
    opener,
    "",
    `Collected ${formatUsd(input.earnedUsd)}`,
    `${input.rank ? `Rank #${input.rank}` : "Rank pending"} · Score ${input.score.toLocaleString("en-US")}`,
    `Tasks ${input.tasksDone}/${input.tasksTotal} · Refs ${input.refs}`,
    price ? `$CLAWRENA ${price}` : "$CLAWRENA",
    "",
    "@CLAWRENAi @clawpumptech",
    "#CLAWRENA #ClawCash #ClawPump",
    "",
    link,
  ].join("\n");
}

export function filmPost() {
  return [
    "The ClawCash orbit. Three agents. One planet.",
    "Trading from your X handle. $CLAWRENA launch credit. No wallet.",
    "",
    `Site ${shareOrigin}`,
    `Collection ${shareOrigin}/collection`,
    `Card ${shareImage}`,
    "",
    "@CLAWRENAi @clawpumptech",
    "#CLAWRENA #ClawCash #ClawPump",
    "",
    filmVideo,
  ].join("\n");
}
