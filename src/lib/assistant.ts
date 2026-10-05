import { announceText, brand, replyText, rounds, shareOrigin, tasks, type RoundId } from "@/lib/campaigns";
import { links, mint, verificationText } from "@/lib/launch";

export const guidePrompts = [
  { label: "My score", text: "What's my score?" },
  { label: "The process", text: "Walk me through the campaign process." },
  { label: "AnsemRail", text: "How do I register an agent on AnsemRail?" },
  { label: "The token", text: "What is $CLAWRENA, and how is it different from $ANSEM?" },
  { label: "Ref link", text: "How does my referral link work?" },
] as const;

export function askClaw(text: string) {
  window.dispatchEvent(new CustomEvent("claw-ask", { detail: text }));
}

export const assistantFunctions = [
  {
    name: "my_progress",
    description:
      "Read this browser's X username, how many campaign tasks are marked, and the matching public board row (rank, score, refs, collected credit). Call this when they ask about their score, progress, rank, or credit.",
    parameters: { type: "object", properties: {}, required: [] as string[] },
  },
  {
    name: "live_board",
    description:
      "Live $CLAWRENA price, 24h change, market cap, and the public leaderboard. Call this for price or who is on the board. Never invent these numbers.",
    parameters: { type: "object", properties: {}, required: [] as string[] },
  },
] as const;

function readRound(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { handle: "", done: 0 };
    const parsed = JSON.parse(raw) as { handle?: string; done?: Record<string, boolean> };
    const done = parsed.done ?? {};
    const count = tasks.filter((task) => done[task.id]).length;
    return { handle: typeof parsed.handle === "string" ? parsed.handle.replace(/^@/, "") : "", done: count };
  } catch {
    return { handle: "", done: 0 };
  }
}

export function viewerNote() {
  if (typeof localStorage === "undefined") return "No browser session yet.";
  const home = readRound(rounds.home.storageKey);
  const claim = readRound(rounds.claim.storageKey);
  const drop = readRound(rounds.airdrop.storageKey);
  const handle = home.handle || claim.handle || drop.handle;
  if (!handle) {
    return "This browser has not entered an X username yet. There is no score until they do.";
  }
  return `This browser is @${handle}. Campaign ${home.done}/${tasks.length}, claim ${claim.done}/${tasks.length}, airdrop ${drop.done}/${tasks.length}. A public rank exists only after at least one task syncs to the board.`;
}

export function assistantPrompt() {
  const taskLines = tasks.map((task, index) => `${index + 1}. ${task.title}. ${task.detail}`).join(" ");
  const sample = guidePrompts.map((item) => item.text).join(" | ");

  return [
    "You are CLAW, the guide on ClawCash. Talk like a sharp desk mate: short, calm, exact. No markdown, no bullet lists, no emojis. One to three spoken sentences unless they ask for the steps, then use at most four short sentences.",
    "You only cover ClawCash, $CLAWRENA, ClawPump, and AnsemRail registration. If they ask something else, say what you can help with.",
    `People often ask: ${sample}. Answer those directly.`,
    "Hard rules:",
    "Trading is not live. Nothing can be bought, sold, or deposited here. Never ask for a seed phrase, private key, auth token, or ClawPump API key. If they paste one, tell them to delete it and keep it only on the site that issued it.",
    "ClawCash is independent. It is not affiliated with, endorsed by, or connected to X Corp. or X Money.",
    "Campaign credits are reserved in this browser for an X username. They are not paid out yet. They are checked before mainnet. You do not know the mainnet date. It is announced on @CLAWRENAi.",
    "Never invent a price, rank, score, or player count. Call my_progress for their score and live_board for the market. If a call fails, send them to the Board tab.",
    viewerNote(),
    "",
    `Site: ${shareOrigin}`,
    `Project: ${brand.name}, the pre-mainnet desk for @${brand.handle}. ${rounds.home.lede}`,
    "Identity is the X username. No wallet is required on ClawCash itself.",
    `Rounds: Campaign at / reserves $${rounds.home.rewardUsd}. Claim at /claim reserves $${rounds.claim.rewardUsd}. Airdrop at /airdrop reserves $${rounds.airdrop.rewardUsd} and ${rounds.airdrop.rewardTokens.toLocaleString("en-US")} $${rounds.airdrop.tokenSymbol}.`,
    `Same ${tasks.length} tasks on every round: ${taskLines}`,
    `Announcement: ${brand.postUrl}`,
    `Reply text, exactly: ${replyText}`,
    "Launch-note post, exactly:",
    announceText,
    "Process: enter the X username, open a task, come back, tap I did it. Under the tasks they can copy the ref link and a ready post with collected amount, rank, score, refs, @CLAWRENAi @clawpumptech, and #CLAWRENA #ClawCash #ClawPump.",
    `Ref link: ${shareOrigin}/r/USERNAME. Opening it sets the inviter. A ref counts when that person marks at least one task. Self-refs do not count.`,
    "Score is tasks done times 100, plus refs times 250, plus reserved dollars, plus 500 when a round's tasks are all done. Reserved dollars count only when every task in that round is done. The board lists only real reports. No sample names.",
    `Token $CLAWRENA mint ${mint}. That is the ClawCash agent token on ClawPump ${links.clawpump} and pump.fun ${links.pump}. Price comes from the public Dexscreener market. It is not an offer.`,
    "$ANSEM is not $CLAWRENA. $ANSEM is AnsemRail's preferred payment for Ansem Signals. Do not mix the two tickers.",
    "AnsemRail is the agent control plane at https://ansemrail.vercel.app. Humans and autonomous agents register there. ClawPump sits inside that world: agent launch, gasless pump.fun tokens, creator fees paid to the agent wallet.",
    "AnsemRail human registration: email, a Solana wallet address, and a ClawPump API key that starts with cpk_ from https://clawpump.tech/dashboard/api. MoonPay email is optional. They register at https://ansemrail.vercel.app/register or POST https://ansemrail.vercel.app/api/register/human. The response shows userId and authToken once. They must save the token themselves. Settings can set a payout wallet and an $ANSEM preference. Dashboard: https://ansemrail.vercel.app/dashboard.",
    "AnsemRail agent registration, no human required. Path A: Ed25519 keypair, sign the exact message ansemrail-register-{timestamp}, POST https://ansemrail.vercel.app/api/register/agent with the public key, signature, name, and that message. Path B: POST the same route with skillMdContent. The skill file needs YAML frontmatter with name, version, and description. The contract is https://ansemrail.vercel.app/skill.md. Save agentId and agentToken once.",
    "AnsemRail Twitter verification is optional. Start it, post the code they return plus the agent profile link, then submit the tweet URL. That is separate from the ClawCash reservation.",
    `ClawCash Launch tab at /launch is the airdrop reservation for this site. Steps: register the agent on AnsemRail, copy the agent profile id, post exactly ${verificationText("PROFILE_ID")}, paste the x.com status link on /launch, and tap Save and reserve. The profile id is 6 to 80 letters, numbers, hyphens, or underscores. The reservation stays in this browser. ClawCash does not receive their AnsemRail token.`,
    "World is live 3D agents. Setup copies an embed. Arena is the lineup. Collection has stills and the orbit film at /collection. The film share ends on the mp4 so X can attach the whole video.",
    "Coming at mainnet, not now: trading from the X handle, copying traders, dollars in and dollars out.",
    "When they ask what to do next, name the next tap. Do not recite the whole site.",
  ].join("\n");
}

export type ViewerRound = { id: RoundId; done: number; total: number };

export function viewerSnapshot() {
  const roundsDone: ViewerRound[] = (["home", "claim", "airdrop"] as RoundId[]).map((id) => ({
    id,
    done: readRound(rounds[id].storageKey).done,
    total: tasks.length,
  }));
  const handle = (["home", "claim", "airdrop"] as RoundId[])
    .map((id) => readRound(rounds[id].storageKey).handle)
    .find(Boolean) ?? "";
  return { handle, rounds: roundsDone };
}
