export const threeWs = {
  home: "https://three.ws/",
  docs: "https://three.ws/docs",
  marketplace: "https://three.ws/marketplace",
  leaderboard: "https://three.ws/leaderboard",
  forge: "https://three.ws/3d",
  embed: "https://three.ws/#embed",
  script: "https://three.ws/agent-3d/latest/agent-3d.js",
  weld: "https://three.ws/avatars/7271d471-7142-4e7b-81ef-d76bb953d59a",
} as const;

export type StudioAvatar = {
  id: string;
  name: string;
  note: string;
};

/** Public three.ws avatar records. src is https://three.ws/api/avatars/<id>. */
export const studioAvatars: StudioAvatar[] = [
  { id: "7fcc3672-172d-4ca7-b229-7cff9698543e", name: "Robot", note: "Expressive · clip test" },
  { id: "536e37b8-6584-4bef-aa3f-2be5fc51e29b", name: "Clay", note: "Marketplace" },
  { id: "0d3d1d1f-62ad-4795-9d32-b8e820c984a9", name: "Bull", note: "Marketplace" },
  { id: "75de4b8a-e842-463a-9791-a0f9b6e73357", name: "Grim", note: "Marketplace" },
  { id: "13f259c7-7024-4d68-b1f0-dbbf52c06209", name: "Michelle", note: "Dancer" },
  { id: "72bc0b6d-7888-4923-a532-16b0b4d7b58b", name: "CZ", note: "Marketplace" },
  { id: "6ad7482d-56c2-4048-bc10-d9b441b50f37", name: "CZ scan", note: "Second CZ" },
  { id: "de9c8444-4f24-4b5b-8564-56b4a6935905", name: "Fox", note: "Sample rig" },
  { id: "7271d471-7142-4e7b-81ef-d76bb953d59a", name: "Weld", note: "Studio · heavier" },
  { id: "a4bad2f5-8a07-43cf-82e5-b6ba1314441e", name: "Selfie Girl", note: "Heavy file" },
];

export const worldBooths = studioAvatars.filter((avatar) =>
  ["Robot", "Clay", "Bull", "Grim", "Fox"].includes(avatar.name),
);

export const testClips = [
  { id: "idle", label: "Idle" },
  { id: "wave", label: "Wave" },
  { id: "dance", label: "Dance" },
  { id: "capoeira", label: "Capoeira" },
  { id: "jump", label: "Jump" },
  { id: "thriller", label: "Thriller" },
  { id: "celebrate", label: "Celebrate" },
] as const;

export type ClipId = (typeof testClips)[number]["id"];
export type EmbedMode = "inline" | "widget";
export type EmbedBackground = "transparent" | "dark" | "light";
export type EmbedFlavor = "html" | "react" | "vue";

export type EmbedConfig = {
  avatarId: string;
  mode: EmbedMode;
  background: EmbedBackground;
  responsive: boolean;
  namePlate: boolean;
  chat: boolean;
  eager: boolean;
  name: string;
};

export function avatarSrc(id: string) {
  return `https://three.ws/api/avatars/${id}`;
}

export function previewBody(id: string) {
  return `/api/avatar-model?id=${encodeURIComponent(id)}`;
}

export function readAvatarId(raw: string) {
  const trimmed = raw.trim();
  const fromUrl = trimmed.match(/avatars\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (fromUrl?.[1]) return fromUrl[1];
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return trimmed;
  return "";
}

export function embedCode(config: EmbedConfig, flavor: EmbedFlavor) {
  const attrs: string[] = [`src="${avatarSrc(config.avatarId)}"`];
  if (config.mode !== "inline") attrs.push(`mode="${config.mode}"`);
  if (config.background !== "transparent") attrs.push(`background="${config.background}"`);
  attrs.push(config.responsive ? "responsive" : 'responsive="false"');
  if (config.namePlate) attrs.push('name-plate="on"');
  if (config.chat) attrs.push('avatar-chat="on"');
  if (config.eager) attrs.push("eager");
  const pad = flavor === "html" ? "  " : "    ";
  const body = attrs.map((attr) => pad + attr).join("\n");
  if (flavor === "react") {
    return `import '${threeWs.script}';

export default function MyAgent() {
  return (
    <agent-3d
${body}
    />
  );
}`;
  }
  if (flavor === "vue") {
    return `<script setup>
import '${threeWs.script}';
</script>

<template>
  <agent-3d
${body}
  />
</template>`;
  }
  return `<script type="module"
  src="${threeWs.script}"
></script>

<agent-3d
${body}
></agent-3d>`;
}

let scriptPromise: Promise<void> | null = null;

export function loadAgentScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("agent-3d")) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const finish = () => {
        customElements
          .whenDefined("agent-3d")
          .then(() => resolve())
          .catch(reject);
      };
      const existing = document.querySelector<HTMLScriptElement>("script[data-claw-agent-3d]");
      if (existing) {
        finish();
        return;
      }
      const script = document.createElement("script");
      script.type = "module";
      script.src = threeWs.script;
      script.dataset.clawAgent3d = "1";
      script.onload = finish;
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("agent-3d failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export type AgentNode = HTMLElement & {
  playClip?: (name: string, options?: { userInitiated?: boolean }) => void;
  play?: (name: string, options?: { loop?: boolean; fade_ms?: number }) => void;
};

export function applyAgentAttributes(node: HTMLElement, config: EmbedConfig) {
  // Their /api/avatars response has no CORS header, so the live tag loads the
  // GLB through this app. The copied snippet still uses the public three.ws src.
  node.setAttribute("body", previewBody(config.avatarId));
  node.setAttribute("name", config.name || "Agent");
  if (config.mode !== "inline") node.setAttribute("mode", config.mode);
  if (config.background !== "transparent") node.setAttribute("background", config.background);
  node.setAttribute("responsive", config.responsive ? "" : "false");
  if (config.namePlate) node.setAttribute("name-plate", "on");
  if (config.chat) node.setAttribute("avatar-chat", "on");
  else node.setAttribute("kiosk", "");
  if (config.eager) node.setAttribute("eager", "");
}

export function playAgentClip(node: AgentNode | null, clip: string) {
  if (!node) return false;
  if (typeof node.playClip === "function") {
    node.playClip(clip, { userInitiated: true });
    return true;
  }
  if (typeof node.play === "function") {
    node.play(clip, { loop: clip === "idle", fade_ms: 400 });
    return true;
  }
  return false;
}
