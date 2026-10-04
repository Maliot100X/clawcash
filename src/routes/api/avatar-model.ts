import { createFileRoute } from "@tanstack/react-router";

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_HOSTS = new Set(["three.ws", "pub-2534e921bf9c4314addcd4d8a6e98b7b.r2.dev"]);

export const Route = createFileRoute("/api/avatar-model")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get("id") ?? "";
        if (!ID_RE.test(id)) return new Response("Bad avatar id", { status: 400 });

        const meta = await fetch(`https://three.ws/api/avatars/${id}`);
        if (!meta.ok) return new Response("Avatar not found", { status: 404 });
        const json = (await meta.json()) as { avatar?: { model_url?: string; url?: string } };
        const raw = json.avatar?.model_url || json.avatar?.url;
        if (!raw) return new Response("Avatar has no model", { status: 404 });

        let file: URL;
        try {
          file = new URL(raw);
        } catch {
          return new Response("Bad model url", { status: 502 });
        }
        if (file.protocol !== "https:" || !ALLOWED_HOSTS.has(file.hostname)) {
          return new Response("Model host is not allowed", { status: 400 });
        }

        const glb = await fetch(file);
        if (!glb.ok || !glb.body) return new Response("Model failed", { status: 502 });
        return new Response(glb.body, {
          status: 200,
          headers: {
            "content-type": "model/gltf-binary",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
