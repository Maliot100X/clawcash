import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { AgentEmbed } from "@/components/agent-embed";
import { SiteHeader } from "@/components/site-header";
import {
  embedCode,
  readAvatarId,
  studioAvatars,
  testClips,
  threeWs,
  type EmbedBackground,
  type EmbedConfig,
  type EmbedFlavor,
  type EmbedMode,
} from "@/lib/threews";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
  head: () => ({
    meta: [
      { title: "ClawCash | three.ws setup" },
      {
        name: "description",
        content: "Live three.ws agent-3d preview. Pick a public avatar, test a clip, and copy the embed.",
      },
    ],
  }),
});

const steps = [
  { n: "01", title: "Load the script", text: "One module from three.ws/agent-3d. No install, no wallet." },
  { n: "02", title: "Point at an avatar", text: "src is a public /api/avatars id. Clay, Bull, Grim, Michelle, CZ, or your own." },
  { n: "03", title: "Test a clip", text: "Idle, wave, dance, capoeira, jump, thriller, celebrate. Then copy the tag." },
] as const;

function SetupPage() {
  const [avatarId, setAvatarId] = useState(studioAvatars[0]?.id ?? "");
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<EmbedMode>("inline");
  const [background, setBackground] = useState<EmbedBackground>("dark");
  const [responsive, setResponsive] = useState(true);
  const [namePlate, setNamePlate] = useState(true);
  const [chat, setChat] = useState(false);
  const [eager, setEager] = useState(true);
  const [flavor, setFlavor] = useState<EmbedFlavor>("html");
  const [clip, setClip] = useState<string | null>(null);
  const [clipNonce, setClipNonce] = useState(0);
  const [copied, setCopied] = useState(false);

  const customId = readAvatarId(custom);
  const activeId = customId || avatarId;
  const activeName = studioAvatars.find((avatar) => avatar.id === activeId)?.name ?? "Agent";
  const config = useMemo<EmbedConfig>(
    () => ({ avatarId: activeId, mode, background, responsive, namePlate, chat, eager, name: activeName }),
    [activeId, mode, background, responsive, namePlate, chat, eager, activeName],
  );
  const code = embedCode(config, flavor);
  const stageBg = background === "light" ? "bg-[#f4ede4]" : "bg-ink";

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader active="setup" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">three.ws · agent-3d</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-none sm:text-6xl">
          Two lines. <span className="italic text-ember">A real body.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-soft">
          The preview runs the official {threeWs.script} component. Their avatar API does not send CORS, so this page streams the GLB itself. The code you copy is still their public tag. No wallet, no key, nothing stored.
        </p>

        <ol className="mt-8 grid gap-3 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="rounded-3xl border border-line bg-panel px-4 py-4">
              <p className="text-xs font-semibold tracking-widest text-gold">{step.n}</p>
              <p className="mt-2 font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-mute">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className={`overflow-hidden rounded-app border border-line shadow-dock ${stageBg}`}>
            <div className="flex items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
              <p className="text-sm font-semibold text-bone">Live preview</p>
              <p className="truncate text-xs text-mute">{activeId}</p>
            </div>
            <div className="h-[68vh] min-h-[28rem]">
              <AgentEmbed config={config} clip={clip} clipNonce={clipNonce} />
            </div>
            <div className="flex gap-2 overflow-x-auto border-t border-line/80 px-3 py-3 no-scrollbar">
              {testClips.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setClip(item.id);
                    setClipNonce((n) => n + 1);
                  }}
                  className={`press shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${
                    clip === item.id ? "bg-ember text-ink" : "border border-line text-bone"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-app border border-line bg-card p-4 sm:p-5">
            <p className="text-sm font-semibold">Avatar</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {studioAvatars.map((avatar) => {
                const on = !customId && avatar.id === avatarId;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setCustom("");
                      setAvatarId(avatar.id);
                    }}
                    className={`press rounded-full border px-3 py-1.5 text-sm font-semibold ${
                      on ? "border-ember bg-ember text-ink" : "border-line text-soft hover:text-bone"
                    }`}
                  >
                    {avatar.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-mute">
              {studioAvatars.find((avatar) => avatar.id === activeId)?.note ?? "Custom id"}
            </p>

            <label htmlFor="avatar-id" className="mt-5 block text-sm font-semibold">
              Or paste an avatar id
            </label>
            <input
              id="avatar-id"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="uuid or https://three.ws/api/avatars/…"
              spellCheck={false}
              className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-3 text-sm text-bone outline-none placeholder:text-mute focus:border-ember"
            />
            {custom && !customId ? (
              <p className="mt-2 text-sm text-danger">That is not a three.ws avatar id yet.</p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="font-semibold">Mode</span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as EmbedMode)}
                  className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 text-bone"
                >
                  <option value="inline">inline</option>
                  <option value="widget">widget</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="font-semibold">Background</span>
                <select
                  value={background}
                  onChange={(event) => setBackground(event.target.value as EmbedBackground)}
                  className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 text-bone"
                >
                  <option value="dark">dark</option>
                  <option value="light">light</option>
                  <option value="transparent">none</option>
                </select>
              </label>
            </div>

            <ul className="mt-4 space-y-2 text-sm">
              <Toggle label="responsive" on={responsive} set={setResponsive} />
              <Toggle label="nameplate" on={namePlate} set={setNamePlate} />
              <Toggle label="chat" on={chat} set={setChat} />
              <Toggle label="eager" on={eager} set={setEager} />
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-mute">
              Chat stays off until you turn it on. It uses three.ws, not ClawCash. Eager makes the body load now instead of waiting.
            </p>
          </section>
        </div>

        <section className="mt-4 overflow-hidden rounded-app border border-line bg-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex gap-2">
              {(["html", "react", "vue"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFlavor(item)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    flavor === item ? "bg-bone text-ink" : "text-mute"
                  }`}
                >
                  {item === "html" ? "HTML" : item === "react" ? "React" : "Vue"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void onCopy()} className="press inline-flex items-center gap-2 rounded-full bg-ember px-3 py-1.5 text-sm font-semibold text-ink">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-soft sm:text-sm">
            <code>{code}</code>
          </pre>
        </section>

        <ul className="mt-6 flex flex-wrap gap-3 text-sm">
          <Out href={threeWs.docs} label="Docs" />
          <Out href={threeWs.marketplace} label="Marketplace" />
          <Out href={threeWs.forge} label="Forge" />
          <Out href={threeWs.leaderboard} label="Leaderboard" />
          <Out href={threeWs.weld} label="Weld" />
          <Out href={threeWs.embed} label="Their embed" />
        </ul>
      </main>
    </div>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (next: boolean) => void }) {
  return (
    <li>
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ink px-3 py-2">
        <span className="font-semibold">{label}</span>
        <input type="checkbox" checked={on} onChange={(event) => set(event.target.checked)} className="h-4 w-4 accent-ember" />
      </label>
    </li>
  );
}

function Out({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer" className="press inline-flex rounded-full border border-line px-3 py-2 font-semibold text-soft hover:text-bone">
        {label}
      </a>
    </li>
  );
}
