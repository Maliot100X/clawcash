import { Link } from "@tanstack/react-router";
import { brand, roundList, type RoundId } from "@/lib/campaigns";
import { ClawMark, XMark } from "@/components/claw-mark";

export type NavId = RoundId | "arena" | "collection" | "token" | "launch" | "world" | "setup";

const extras = [
  { id: "world" as const, path: "/world" as const, label: "World", hint: "Live" },
  { id: "setup" as const, path: "/setup" as const, label: "Setup", hint: "Embed" },
  { id: "token" as const, path: "/token" as const, label: "Token", hint: "$CLAWRENA" },
  { id: "launch" as const, path: "/launch" as const, label: "Launch", hint: "Agent" },
  { id: "arena" as const, path: "/arena" as const, label: "Arena", hint: "3D" },
  { id: "collection" as const, path: "/collection" as const, label: "Collection", hint: "Film" },
];

export function SiteHeader({ active }: { active: NavId }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 sm:px-8 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg" aria-label="ClawCash home">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-ink ring-1 ring-line">
              <ClawMark className="h-8 w-8" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Claw<span className="text-ember">Cash</span>
            </span>
          </Link>
          <a
            href={brand.profile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-bone px-4 py-2 text-sm font-semibold text-ink transition hover:bg-soft lg:hidden"
          >
            <XMark />
            Follow
          </a>
        </div>
        <nav aria-label="Sections" className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto no-scrollbar">
          {roundList.map((item) => {
            const on = item.id === active;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  on ? "border-bone bg-bone text-ink" : "border-line text-soft hover:border-soft hover:text-bone"
                }`}
              >
                {item.label}
                <span className={on ? "text-ink/70" : "text-mute"}>{item.hint}</span>
              </Link>
            );
          })}
          {extras.map((item) => {
            const on = item.id === active;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  on ? "border-ember bg-ember text-ink" : "border-ember/40 text-ember hover:bg-ember/10"
                }`}
              >
                {item.label}
                <span className={on ? "text-ink/70" : "text-gold"}>{item.hint}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm text-soft">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember" />
            Pre-mainnet
          </span>
          <a
            href={brand.profile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-bone px-4 py-2 text-sm font-semibold text-ink transition hover:bg-soft"
          >
            <XMark />
            Follow
          </a>
        </div>
      </div>
      <div aria-hidden="true" className="h-px bg-linear-to-r from-transparent via-ember/80 to-transparent" />
    </header>
  );
}
