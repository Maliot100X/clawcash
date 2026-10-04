import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AgentEmbed } from "@/components/agent-embed";
import { SiteHeader } from "@/components/site-header";
import { testClips, threeWs, worldBooths, type EmbedConfig } from "@/lib/threews";

export const Route = createFileRoute("/world")({
  component: WorldPage,
  head: () => ({
    meta: [
      { title: "ClawCash | three.ws world" },
      {
        name: "description",
        content: "Clay, Bull, Grim, Robot, and Fox rendered with the official three.ws agent-3d component.",
      },
    ],
  }),
});

const boothConfig = new Map<string, EmbedConfig>(
  worldBooths.map((avatar) => [
    avatar.id,
    {
      avatarId: avatar.id,
      mode: "inline",
      background: "dark",
      responsive: true,
      namePlate: true,
      chat: false,
      eager: true,
      name: avatar.name,
    },
  ]),
);

function WorldPage() {
  const [clip, setClip] = useState<string>("wave");
  const [nonce, setNonce] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string>(worldBooths[0]?.id ?? "");

  function run(id: string, nextClip: string) {
    setActive(id);
    setClip(nextClip);
    setNonce((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader active="world" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">Official component</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-none sm:text-6xl">
          Five bodies. <span className="italic text-ember">Their runtime.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-soft">
          Clay, Bull, Grim, the expressive robot, and the fox. Each booth is a real <span className="text-bone">agent-3d</span> tag pointed at a public three.ws avatar. Hit a clip to test that booth.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {testClips.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => run(active, item.id)}
              className={`press rounded-full px-3 py-2 text-sm font-semibold ${
                clip === item.id ? "bg-ember text-ink" : "border border-line text-bone"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {worldBooths.map((avatar) => {
            const config = boothConfig.get(avatar.id);
            if (!config) return null;
            const on = active === avatar.id;
            return (
              <li key={avatar.id} className={`overflow-hidden rounded-app border bg-ink shadow-dock ${on ? "border-ember" : "border-line"}`}>
                <div className="h-80">
                  <AgentEmbed config={config} clip={on ? clip : null} clipNonce={nonce[avatar.id] ?? 0} />
                </div>
                <button
                  type="button"
                  onClick={() => run(avatar.id, clip)}
                  className="flex w-full items-center justify-between gap-3 border-t border-line px-4 py-3 text-left"
                >
                  <span>
                    <span className="block font-semibold">{avatar.name}</span>
                    <span className="block text-sm text-mute">{avatar.note}</span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gold">{on ? clip : "Stand"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-sm text-mute">
          Script: {threeWs.script}. Change the tag on the{" "}
          <Link to="/setup" className="font-semibold text-ember">
            setup desk
          </Link>
          . Arena stays the local three.js stage.
        </p>
      </main>
    </div>
  );
}
