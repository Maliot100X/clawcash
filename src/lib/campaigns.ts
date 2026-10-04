import { links } from "@/lib/launch";

export const brand = {
  name: "ClawCash",
  handle: "CLAWRENAi",
  postUrl: "https://x.com/CLAWRENAi/status/2090038397502882268",
  profile: "https://x.com/CLAWRENAi",
} as const;

export type TaskId = "like" | "repost" | "comment" | "notify" | "token" | "announce" | "follow";

export type Task = {
  id: TaskId;
  title: string;
  detail: string;
  action: string;
};

export const announceText = `$CLAWRENA

$4K mcap
1.07 SOL earned in creator fees

Token trading fees, paid to your agent wallet.

${links.clawpump}

@clawpumptech`;

export const tasks: Task[] = [
  {
    id: "like",
    title: "Like the latest post",
    detail: "One like on the ClawCash announcement.",
    action: "Like",
  },
  {
    id: "repost",
    title: "Repost it",
    detail: "Share the announcement with your followers.",
    action: "Repost",
  },
  {
    id: "comment",
    title: "Reply to the post",
    detail: "Your reply is filled in: $CLAWRENA on @clawpumptech.",
    action: "Reply",
  },
  {
    id: "notify",
    title: "Turn on notifications",
    detail: "Tap the bell on @CLAWRENAi so mainnet reaches you first.",
    action: "Open profile",
  },
  {
    id: "token",
    title: "Open the ClawPump token",
    detail: "Open the live $CLAWRENA page on clawpump.tech, then mark it done.",
    action: "Open token",
  },
  {
    id: "announce",
    title: "Post the launch note",
    detail: "A full post is filled in: $4K mcap, 1.07 SOL in creator fees, and the token link.",
    action: "Post",
  },
  {
    id: "follow",
    title: "Follow @clawpumptech",
    detail: "Follow the desk that pays token trading fees to the agent wallet.",
    action: "Follow",
  },
];

export type RoundId = "home" | "claim" | "airdrop";

export type Round = {
  id: RoundId;
  path: "/" | "/claim" | "/airdrop";
  label: string;
  hint: string;
  pageTitle: string;
  description: string;
  kicker: string;
  titleBefore: string;
  titleAccent: string;
  titleAfter: string;
  lede: string;
  rewardUsd: number;
  rewardTokens: number;
  tokenSymbol: string;
  storageKey: string;
};

const taskCount = tasks.length;

export const rounds = {
  home: {
    id: "home",
    path: "/",
    label: "Campaign",
    hint: "$50",
    pageTitle: "ClawCash | Pre-mainnet campaign",
    description:
      "ClawCash is a trading app for your X handle. Join the pre-mainnet campaign and reserve a $50 launch credit. No deposits, no wallet.",
    kicker: "Pre-mainnet",
    titleBefore: "Trading, from your",
    titleAccent: "X handle.",
    titleAfter: "",
    lede: `ClawCash is the trading app for the Clawrena. ${taskCount} quick tasks reserve a $50 launch credit for @CLAWRENAi’s mainnet.`,
    rewardUsd: 50,
    rewardTokens: 0,
    tokenSymbol: "CLAW",
    storageKey: "clawcash_campaign_v1",
  },
  claim: {
    id: "claim",
    path: "/claim",
    label: "Claim",
    hint: "$35",
    pageTitle: "ClawCash | Claim your $35 launch credit",
    description: `A new ClawCash pre-mainnet round. ${taskCount} quick tasks reserve a $35 launch credit. No deposits, no wallet.`,
    kicker: "Claim round",
    titleBefore: "Claim your",
    titleAccent: "$35",
    titleAfter: "launch credit.",
    lede: `A new round of the ClawCash pre-mainnet campaign. ${taskCount} tasks on the latest post reserve a $35 launch credit.`,
    rewardUsd: 35,
    rewardTokens: 0,
    tokenSymbol: "CLAW",
    storageKey: "clawcash_claim_v1",
  },
  airdrop: {
    id: "airdrop",
    path: "/airdrop",
    label: "Airdrop",
    hint: "$CLAW",
    pageTitle: "ClawCash | Claim $35 + 200,000 $CLAW",
    description: `${taskCount} tasks reserve a $35 launch credit and 200,000 $CLAW for your X account. Trading is not live.`,
    kicker: "Airdrop round",
    titleBefore: "Claim your",
    titleAccent: "$35",
    titleAfter: "and 200,000 $CLAW.",
    lede: `A new round for @CLAWRENAi. ${taskCount} tasks reserve a $35 launch credit and 200,000 $CLAW for your X account.`,
    rewardUsd: 35,
    rewardTokens: 200000,
    tokenSymbol: "CLAW",
    storageKey: "clawcash_airdrop_v1",
  },
} as const satisfies Record<RoundId, Round>;

export const roundList: Round[] = [rounds.home, rounds.claim, rounds.airdrop];

export const coming = [
  {
    title: "Trade from your handle",
    line: "Your X name is the account",
  },
  {
    title: "Copy the feed",
    line: "Follow traders you already read",
  },
  {
    title: "Dollars in, dollars out",
    line: "Fund and cash out in USD",
  },
] as const;

export const storyPoints = [
  {
    title: "Your X handle is your account",
    text: "Sign in with the username you already use. No new identity to build.",
  },
  {
    title: "Trade what you read",
    text: "See a token in the feed, check it, and act without leaving the conversation.",
  },
  {
    title: "Dollars in, dollars out",
    text: "Deposit and withdraw in USD, so you never have to think about bridges.",
  },
  {
    title: "Perps and copy trading",
    text: "Follow traders you trust and go long or short once the core app is stable.",
  },
] as const;

export const timeline = [
  {
    when: "Now",
    title: "Pre-mainnet campaign",
    text: "Reserve your launch credit with your X username.",
  },
  {
    when: "Date announced on X",
    title: "Mainnet launch",
    text: "The app opens. People who joined the campaign get in first.",
  },
  {
    when: "At launch",
    title: "Credits added",
    text: "Reserved credits land on the accounts they were reserved for.",
  },
] as const;

export function faqs(round: Round) {
  const tokenLine =
    round.rewardTokens > 0
      ? ` This round also reserves ${round.rewardTokens.toLocaleString("en-US")} $${round.tokenSymbol}.`
      : "";
  return [
    {
      q: "Is trading live?",
      a: `No. During the campaign nothing can be bought, sold, or deposited. The ${brand.name} app opens at mainnet.`,
    },
    {
      q: `How do I get the $${round.rewardUsd} credit?`,
      a: `Enter your X username and finish all ${tasks.length} tasks. The credit is reserved for that username and added when the app opens at mainnet.${tokenLine}`,
    },
    {
      q: "Do I need a wallet?",
      a: "Not for the campaign. Your X username is all you need. Never share a seed phrase with anyone claiming to be us.",
    },
    {
      q: "When is mainnet?",
      a: `The date will be announced on @${brand.handle}. Turn on notifications to hear it first.`,
    },
    {
      q: `Is ${brand.name} part of X?`,
      a: `No. ${brand.name} is an independent project for @${brand.handle}. It is not affiliated with, endorsed by, or connected to X Corp. or X Money.`,
    },
  ];
}

export function tweetId() {
  const match = brand.postUrl.match(/status\/(\d+)/);
  return match?.[1] ?? "";
}

export const replyText = "$CLAWRENA on @clawpumptech";

export function taskUrl(id: TaskId) {
  const idStr = tweetId();
  if (id === "like" && idStr) return `https://x.com/intent/like?tweet_id=${idStr}`;
  if (id === "repost" && idStr) return `https://x.com/intent/retweet?tweet_id=${idStr}`;
  if (id === "comment" && idStr) {
    return `https://x.com/intent/tweet?in_reply_to=${idStr}&text=${encodeURIComponent(replyText)}`;
  }
  if (id === "notify") return brand.profile;
  if (id === "token") return links.clawpump;
  if (id === "announce") return `https://x.com/intent/tweet?text=${encodeURIComponent(announceText)}`;
  if (id === "follow") return "https://x.com/intent/follow?screen_name=clawpumptech";
  return brand.postUrl;
}

const HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/;

export function normalizeHandle(raw: string) {
  return raw.trim().replace(/^@/, "");
}

export function isHandle(raw: string) {
  return HANDLE_RE.test(raw.trim());
}

export const shareOrigin = "https://clawcash.vercel.app";
export const shareImage = `${shareOrigin}/og.jpg`;
export const filmVideo = `${shareOrigin}/collection/orbit.mp4`;

export function inviteLink(handle: string, _path?: string) {
  const name = normalizeHandle(handle);
  if (!name || !isHandle(name)) return "";
  return `${shareOrigin}/r/${encodeURIComponent(name)}`;
}
