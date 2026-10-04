export const mint = "7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene";

export const links = {
  clawpump: `https://clawpump.tech/tokens/${mint}`,
  pump: `https://pump.fun/coin/${mint}`,
  rail: "https://ansemrail.vercel.app/",
  skill: "https://ansemrail.vercel.app/skill.md",
  register: "https://ansemrail.vercel.app/register",
} as const;

const STORAGE_KEY = "clawcash_launch_v1";
const PROFILE_RE = /^[A-Za-z0-9_-]{6,80}$/;

export type LaunchRecord = {
  profileId: string;
  tweetUrl: string;
};

export function verificationText(profileId: string) {
  return `$CLAWRENA agent ${profileId} on @clawpumptech`;
}

export function verificationIntent(profileId: string) {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(verificationText(profileId))}`;
}

export function isProfileId(value: string) {
  return PROFILE_RE.test(value.trim());
}

export function isTweetUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "x.com" && host !== "twitter.com") return false;
    return /\/status\/\d+/.test(url.pathname);
  } catch {
    return false;
  }
}

export function readLaunch(): LaunchRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LaunchRecord>;
    if (typeof parsed.profileId !== "string" || typeof parsed.tweetUrl !== "string") return null;
    if (!isProfileId(parsed.profileId) || !isTweetUrl(parsed.tweetUrl)) return null;
    return { profileId: parsed.profileId, tweetUrl: parsed.tweetUrl };
  } catch {
    return null;
  }
}

export function saveLaunch(record: LaunchRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}
