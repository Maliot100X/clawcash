import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { agents } from "@/lib/agents";
import { links, mint } from "@/lib/launch";

const AvatarStage = lazy(() => import("@/components/avatar-stage"));

export const Route = createFileRoute("/token")({
  component: TokenPage,
  head: () => ({
    meta: [
      { title: "ClawCash | $CLAWRENA" },
      { name: "description", content: "The CLAWRENA token on ClawPump and Pump.fun. Mint, links, and the agent launch." },
    ],
  }),
});

function TokenPage() {
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const featured = agents[0] ? [agents[0]] : [];

  useEffect(() => {
    setReady(true);
  }, []);

  async function copyMint() {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader active="token" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">ClawPump · Pump.fun</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-none sm:text-6xl">
          $CLAWRENA <span className="italic text-ember">is the agent.</span>
        </h1>
        <p className="mt-4 max-w-xl text-soft">
          The project token lives on ClawPump and Pump.fun. Trading here is not live. The agent launch desk is AnsemRail.
        </p>

        <div className="mt-6 h-80 overflow-hidden rounded-app border border-line bg-ink shadow-dock">
          {ready ? (
            <Suspense fallback={<div className="grid h-full place-items-center text-sm text-mute">Calling the agent…</div>}>
              <AvatarStage roster={featured} />
            </Suspense>
          ) : (
            <div className="grid h-full place-items-center text-sm text-mute">Calling the agent…</div>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-app border border-line bg-card p-5 sm:p-7">
            <p className="text-sm text-mute">Mint</p>
            <p className="mt-2 break-all font-semibold tracking-tight">{mint}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => void copyMint()} className="press rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink">
                {copied ? "Copied" : "Copy mint"}
              </button>
              <a href={links.clawpump} target="_blank" rel="noopener noreferrer" className="press rounded-full border border-line px-4 py-2 text-sm font-semibold">
                Open on ClawPump
              </a>
              <a href={links.pump} target="_blank" rel="noopener noreferrer" className="press rounded-full border border-line px-4 py-2 text-sm font-semibold">
                Open on Pump.fun
              </a>
            </div>
          </section>
          <section className="rounded-app border border-line bg-panel p-5 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">Launch</p>
            <p className="mt-3 text-soft">Agents register on AnsemRail. The airdrop is reserved after the verification post is saved here.</p>
            <Link to="/launch" className="press mt-5 inline-flex rounded-full bg-bone px-4 py-2 text-sm font-semibold text-ink">
              Register an agent
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
