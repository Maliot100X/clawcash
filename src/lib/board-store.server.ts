import { readFile, writeFile } from "node:fs/promises";
import { get, put } from "@vercel/blob";
import { applyProgress, projectRows, tokenMint, type BoardRow, type PriceQuote, type StoredPlayer } from "@/lib/board";

const BLOB_PATH = "leaderboard.json";
const FILE_PATH = "/tmp/clawcash-leaderboard.json";

type FileShape = { players: StoredPlayer[] };

const emptyPrice = (): PriceQuote => ({
  usd: null,
  change24h: null,
  marketCap: null,
  symbol: "CLAWRENA",
});

const globalCache = globalThis as typeof globalThis & {
  __clawPrice?: { at: number; quote: PriceQuote };
};

function parsePlayers(text: string): StoredPlayer[] {
  try {
    const parsed = JSON.parse(text) as { players?: StoredPlayer[] };
    return Array.isArray(parsed.players) ? parsed.players : [];
  } catch {
    return [];
  }
}

async function readStore(): Promise<FileShape> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!result?.stream) return { players: [] };
    return { players: parsePlayers(await new Response(result.stream).text()) };
  }
  try {
    return { players: parsePlayers(await readFile(FILE_PATH, "utf8")) };
  } catch {
    return { players: [] };
  }
}

async function writeStore(data: FileShape) {
  const body = JSON.stringify(data);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(BLOB_PATH, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return;
  }
  await writeFile(FILE_PATH, body);
}

export async function readBoard(): Promise<BoardRow[]> {
  const stored = await readStore();
  return projectRows(stored.players);
}

export async function saveProgress(input: {
  handle: string;
  referrer: string;
  round: string;
  tasks: string[];
}): Promise<BoardRow | null> {
  const wanted = new Set(input.tasks);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await readStore();
    const now = Date.now();
    const next = applyProgress(current.players, { ...input, now });
    if (next === current.players) return projectRows(next).find((row) => row.handle.toLowerCase() === input.handle.toLowerCase()) ?? null;
    await writeStore({ players: next });
    const check = await readStore();
    const saved = check.players.find(
      (player) => player.handle.toLowerCase() === input.handle.trim().replace(/^@/, "").toLowerCase(),
    );
    const roundTasks = new Set((saved?.rounds as Record<string, string[] | undefined>)?.[input.round] ?? []);
    const kept = [...wanted].every((id) => roundTasks.has(id));
    if (kept) {
      return projectRows(check.players).find((row) => row.handle.toLowerCase() === saved?.handle.toLowerCase()) ?? null;
    }
  }
  return null;
}

export async function readPrice(): Promise<PriceQuote> {
  const cached = globalCache.__clawPrice;
  if (cached && Date.now() - cached.at < 20_000) return cached.quote;
  const quote = emptyPrice();
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`, {
      headers: { accept: "application/json" },
    });
    if (response.ok) {
      const json = (await response.json()) as {
        pairs?: Array<{
          priceUsd?: string;
          marketCap?: number;
          fdv?: number;
          priceChange?: { h24?: number };
          liquidity?: { usd?: number };
          baseToken?: { symbol?: string };
        }>;
      };
      const pairs = (json.pairs ?? []).slice().sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
      const pair = pairs[0];
      const usd = Number(pair?.priceUsd);
      if (Number.isFinite(usd) && usd > 0) quote.usd = usd;
      if (typeof pair?.priceChange?.h24 === "number") quote.change24h = pair.priceChange.h24;
      const cap = pair?.marketCap ?? pair?.fdv;
      if (typeof cap === "number" && Number.isFinite(cap)) quote.marketCap = cap;
    }
  } catch {
    /* price is optional; the board still renders */
  }
  globalCache.__clawPrice = { at: Date.now(), quote };
  return quote;
}
