import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { agents as fallback, type Agent } from "@/lib/agents";

const AvatarStage = lazy(() => import("@/components/avatar-stage"));

export const Route = createFileRoute("/arena")({
  component: ArenaPage,
  head: () => ({
    meta: [
      { title: "ClawCash | Agent arena" },
      { name: "description", content: "Live three.ws avatars on the ClawCash desk. Click one to step in. Drag to orbit." },
    ],
  }),
});

function ArenaPage() {
  const [ready, setReady] = useState(false);
  const [roster, setRoster] = useState<Agent[]>(fallback);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    setReady(true);
    fetch("/api/agents")
      .then((response) => response.json())
      .then((data: { agents?: Agent[] }) => {
        if (Array.isArray(data.agents) && data.agents.every((agent) => typeof agent.glb === "string")) {
          setRoster(data.agents);
        }
      })
      .catch(() => undefined);
  }, []);

  const focused = roster.find((agent) => agent.id === focus);

  return (
    <div className="min-h-dvh">
      <SiteHeader active="arena" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">three.ws avatars</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="max-w-3xl font-display text-5xl leading-none sm:text-6xl">
            {roster.length} agents. <span className="italic text-ember">Step in.</span>
          </h1>
          {focused ? (
            <button
              type="button"
              onClick={() => setFocus(null)}
              className="press rounded-full border border-line px-4 py-2 text-sm font-semibold text-bone hover:border-ember"
            >
              Whole desk
            </button>
          ) : null}
        </div>
        <p className="mt-4 max-w-xl text-soft">
          {focused
            ? `${focused.name} is on the mark. ${focused.role}. Drag to turn them, or pick someone else.`
            : "X-Bot, Michelle, two scans, CZ, Cesium Man, a studio form, and the fox. Click a body or a card. Drag to orbit. No wallet."}
        </p>
        <div className="mt-6 h-[70vh] min-h-96 overflow-hidden rounded-app border border-line bg-ink shadow-dock">
          {ready ? (
            <Suspense fallback={<div className="grid h-96 place-items-center text-sm text-mute">Loading avatars…</div>}>
              <AvatarStage roster={roster} focusId={focus} onFocus={setFocus} />
            </Suspense>
          ) : (
            <div className="grid h-96 place-items-center text-sm text-mute">Loading avatars…</div>
          )}
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {roster.map((agent) => {
            const on = focus === agent.id;
            return (
              <li key={agent.id}>
                <button
                  type="button"
                  onClick={() => setFocus(on ? null : agent.id)}
                  aria-pressed={on}
                  className={`press flex w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left ${
                    on ? "border-ember bg-ember/10" : "border-line bg-panel hover:border-soft"
                  }`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: agent.color }} />
                  <span>
                    <span className="block font-semibold">{agent.name}</span>
                    <span className="block text-sm text-mute">{agent.role}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
