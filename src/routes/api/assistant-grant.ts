import { createFileRoute } from "@tanstack/react-router";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 24;

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "local";
}

function allow(key: string) {
  const bucket = (globalThis as typeof globalThis & { __clawGrants?: Map<string, number[]> }).__clawGrants ?? new Map<string, number[]>();
  (globalThis as typeof globalThis & { __clawGrants?: Map<string, number[]> }).__clawGrants = bucket;
  const now = Date.now();
  const recent = (bucket.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= LIMIT) {
    bucket.set(key, recent);
    return false;
  }
  recent.push(now);
  bucket.set(key, recent);
  return true;
}

export const Route = createFileRoute("/api/assistant-grant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!allow(clientKey(request))) {
          return Response.json({ error: "Too many voice sessions. Wait a minute." }, { status: 429 });
        }
        const key = process.env["DEEPGRAM_API_KEY"]?.trim();
        if (!key) {
          return Response.json({ error: "Voice is not configured." }, { status: 503 });
        }
        const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
          method: "POST",
          headers: {
            Authorization: `Token ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ttl_seconds: 180 }),
        });
        if (!response.ok) {
          return Response.json({ error: "Voice could not start." }, { status: 502 });
        }
        const grant = (await response.json()) as { access_token?: string; expires_in?: number };
        if (!grant.access_token) {
          return Response.json({ error: "Voice could not start." }, { status: 502 });
        }
        return Response.json(
          { token: grant.access_token, expiresIn: grant.expires_in ?? 180 },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
