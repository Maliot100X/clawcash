import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bell,
  Check,
  ExternalLink,
  Heart,
  Home,
  ListChecks,
  Lock,
  Megaphone,
  MessageCircle,
  Repeat2,
  Ticket,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Atmosphere } from "@/components/atmosphere";
import { ClawMark, XMark } from "@/components/claw-mark";
import { SiteHeader } from "@/components/site-header";
import { ShareKit } from "@/components/share-kit";
import {
  brand,
  coming,
  faqs,
  inviteLink,
  isHandle,
  normalizeHandle,
  storyPoints,
  taskUrl,
  tasks,
  timeline,
  type Round,
  type TaskId,
} from "@/lib/campaigns";
import { askClaw, guidePrompts } from "@/lib/assistant";
import { useCampaign, useCountUp } from "@/lib/use-campaign";
import { Button, buttonVariants } from "@/components/ui/button";

type TabId = "campaign" | "reward" | "mainnet";
type SectionId = "home" | "tasks" | "mainnet" | "reward" | "you";

const taskIcons: Record<TaskId, typeof Heart> = {
  like: Heart,
  repost: Repeat2,
  comment: MessageCircle,
  notify: Bell,
  token: ExternalLink,
  announce: Megaphone,
  follow: UserPlus,
};

function moneyParts(amount: number) {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const dollars = Math.floor(safe);
  const cents = String(Math.round((safe - dollars) * 100)).padStart(2, "0");
  return { dollars: dollars.toLocaleString("en-US"), cents };
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CampaignApp({ round, refHandle }: { round: Round; refHandle?: string }) {
  const { state, ready, setHandle, markOpened, markDone, doneCount, complete } = useCampaign(round, refHandle);
  const [tab, setTab] = useState<TabId>("campaign");
  const [section, setSection] = useState<SectionId>("home");
  const [copied, setCopied] = useState(false);
  const amount = useCountUp(round.rewardUsd, complete && ready);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const wasComplete = useRef<boolean | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (wasComplete.current === false && complete) {
      setTab("reward");
      setSection("reward");
    }
    wasComplete.current = complete;
  }, [complete, ready]);

  useEffect(() => {
    if (!ready || !state.handle) return;
    const done = tasks.filter((task) => state.done[task.id]).map((task) => task.id);
    if (done.length === 0) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/leaderboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle: state.handle,
          referrer: state.referrer,
          round: round.id,
          tasks: done,
        }),
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [ready, round.id, state.done, state.handle, state.referrer]);

  function scrollToCard() {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openTasks() {
    setTab("campaign");
    setSection("tasks");
    scrollToCard();
    if (!state.handle) {
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 420);
    }
  }

  function onPrimary() {
    if (complete) {
      const link = inviteLink(state.handle, round.path);
      void copyText(link).then((ok) => {
        if (!ok) {
          setTab("reward");
          scrollToCard();
          return;
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      });
      return;
    }
    openTasks();
  }

  function onGo(id: SectionId) {
    setSection(id);
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (id === "tasks" || id === "you") {
      openTasks();
      return;
    }
    if (id === "reward") {
      setTab("reward");
      scrollToCard();
      return;
    }
    const story = document.getElementById("mainnet");
    if (story) story.scrollIntoView({ behavior: "smooth" });
    else {
      setTab("mainnet");
      scrollToCard();
    }
  }

  const primaryLabel = complete
    ? copied
      ? "Copied"
      : "Copy link"
    : state.handle
      ? "Continue"
      : "Join";

  const panels: Record<TabId, ReactNode> = {
    campaign: (
      <TaskPanel
        round={round}
        handle={state.handle}
        referrer={state.referrer}
        done={state.done}
        opened={state.opened}
        doneCount={doneCount}
        inputRef={inputRef}
        onHandle={setHandle}
        onOpen={(id) => {
          window.open(taskUrl(id), "_blank", "noopener,noreferrer");
          markOpened(id);
        }}
        onDone={markDone}
      />
    ),
    reward: (
      <RewardPanel
        round={round}
        complete={complete}
        handle={state.handle}
        doneCount={doneCount}
        amount={amount}
        onTasks={openTasks}
      />
    ),
    mainnet: <MainnetPanel />,
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden pb-28 lg:pb-0">
      <Atmosphere />
      <SiteHeader active={round.id} />

      <main id="top" className="relative">
        <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1fr_460px] lg:items-start lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="rise lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">{round.kicker}</p>
            <h1 className="mt-3 max-w-xl font-display text-4xl leading-none text-bone sm:text-6xl lg:mt-4 lg:text-7xl">
              {round.titleBefore} <span className="italic text-ember">{round.titleAccent}</span>{" "}
              {round.titleAfter}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-soft lg:hidden">{round.lede}</p>
            <p className="mt-5 hidden max-w-xl text-lg leading-relaxed text-soft lg:block">{round.lede}</p>
            <a
              href={brand.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-ember/40 bg-ember/10 px-3 py-2 text-sm font-semibold text-ember transition hover:bg-ember/20"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
              <span className="truncate">Tasks use this post</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </a>
            <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
              <Button type="button" size="lg" onClick={openTasks}>
                {complete ? "View your credit" : "Join the campaign"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("mainnet")?.scrollIntoView({ behavior: "smooth" })}
              >
                What arrives at mainnet
              </Button>
            </div>
            <p className="mt-5 text-sm text-mute">Trading is not live yet. No deposits, no wallet needed.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {guidePrompts.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => askClaw(item.text)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Ask CLAW · {item.label}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={cardRef}
            onPointerMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
              event.currentTarget.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
            }}
            className="card-spot rise rise-late scroll-mt-24 min-w-0 rounded-app border border-line bg-card p-5 shadow-dock sm:p-7"
          >
            <Balance
              round={round}
              ready={ready}
              complete={complete}
              amount={amount}
              label={primaryLabel}
              onPrimary={onPrimary}
            />
            <div className="mt-8 flex items-center gap-2">
              <Lock className="h-4 w-4 text-mute" />
              <h2 className="text-lg font-semibold">Coming at mainnet</h2>
            </div>
            <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto no-scrollbar pb-1">
              {coming.map((item) => (
                <article
                  key={item.title}
                  className="w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl border border-line bg-panel sm:w-60"
                >
                  <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-ember/15 text-ember">
                      <ClawMark className="h-4 w-4" />
                    </span>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                  </div>
                  <p className="flex items-center gap-2 px-4 py-4 text-sm font-medium text-gain">
                    <span className="h-2 w-2 rounded-full bg-gain" />
                    {item.line}
                  </p>
                </article>
              ))}
            </div>

            <div
              role="tablist"
              aria-label="Campaign"
              className="mt-7 grid grid-cols-3 border-b border-line"
              onKeyDown={(event) => {
                const ids: TabId[] = ["campaign", "reward", "mainnet"];
                const index = ids.indexOf(tab);
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  const next = event.key === "ArrowRight" ? (index + 1) % 3 : (index + 2) % 3;
                  setTab(ids[next] ?? "campaign");
                }
              }}
            >
              {(
                [
                  ["campaign", "Campaign"],
                  ["reward", "Reward"],
                  ["mainnet", "Mainnet"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  aria-controls={`panel-${id}`}
                  tabIndex={tab === id ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={`relative flex items-center justify-center gap-2 pb-3 pt-1 text-base font-semibold transition ${
                    tab === id ? "text-bone" : "text-mute hover:text-soft"
                  }`}
                >
                  {label}
                  {id === "mainnet" ? (
                    <span className="rounded-md bg-ember/15 px-1.5 py-0.5 text-xs font-semibold text-ember">Soon</span>
                  ) : null}
                  {tab === id ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ember" /> : null}
                </button>
              ))}
            </div>
            <div className="pt-5" id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
              {ready ? panels[tab] : <CardSkeleton />}
            </div>
          </div>
        </section>

        <section id="mainnet" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_400px] lg:gap-20 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-sm font-medium text-ember">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                Coming to mainnet
              </span>
              <h2 className="mt-5 max-w-xl font-display text-5xl leading-none sm:text-6xl">
                The app opens at mainnet.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft">
                {brand.name} is in its pre-mainnet campaign. Trading is not live, and nothing can be bought, sold, or
                deposited yet. When mainnet launches, the app opens to everyone, starting with the people who joined.
              </p>
              <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {storyPoints.map((point) => (
                  <li key={point.title} className="border-l-2 border-ember/70 pl-4">
                    <p className="font-semibold">{point.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-mute">{point.text}</p>
                  </li>
                ))}
              </ul>
              <ol className="mt-12 space-y-0">
                {timeline.map((step, index) => (
                  <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
                    {index < timeline.length - 1 ? (
                      <span className="absolute top-9 left-4 bottom-0 w-px bg-line" aria-hidden="true" />
                    ) : null}
                    <span
                      className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        index === 0 ? "bg-ember text-ink" : "border border-line bg-panel text-mute"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gold">{step.when}</p>
                      <p className="mt-1 font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-mute">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={openTasks} className="rounded-2xl bg-ember px-5 py-3 text-sm font-semibold text-ink shadow-ember">
                  Join the campaign
                </button>
                <a
                  href={brand.profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-line px-5 py-3 text-sm font-semibold"
                >
                  Get the launch date on X
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
            <LockedDesk />
          </div>
        </section>

        <Faq round={round} />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-mute sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="inline-flex items-center gap-2 font-semibold text-bone">
            <ClawMark className="h-5 w-5 text-ember" />
            {brand.name}
          </span>
          <p className="max-w-2xl leading-relaxed">
            {brand.name} is an independent project for @{brand.handle} and is not affiliated with, endorsed by, or
            connected to X Corp. or X Money. Credits stay reserved in this browser until mainnet. Nothing is deposited.
          </p>
          <a href={brand.profile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-soft hover:text-bone">
            <XMark /> @{brand.handle}
          </a>
        </div>
      </footer>

      <nav
        aria-label="Sections"
        className="fixed inset-x-3 bottom-3 z-40 rounded-app border border-bone/10 bg-card/90 p-1.5 shadow-dock backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {(
            [
              ["home", "Home", <Home key="h" className="h-6 w-6" />],
              ["tasks", "Tasks", <ListChecks key="t" className="h-6 w-6" />],
              ["mainnet", "Mainnet", <ClawMark key="m" className="h-6 w-6" />],
              ["reward", "Reward", <Ticket key="r" className="h-6 w-6" />],
              [
                "you",
                state.handle ? `@${state.handle}` : "Your username",
                state.handle ? (
                  <span key="y" className="grid h-8 w-8 place-items-center rounded-full bg-ember text-sm font-bold text-ink">
                    {state.handle.slice(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <UserRound key="u" className="h-6 w-6" />
                ),
              ],
            ] as const
          ).map(([id, label, icon]) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onGo(id)}
                aria-label={label}
                aria-current={section === id ? "page" : undefined}
                className={`relative grid h-14 w-full place-items-center rounded-3xl transition ${
                  section === id ? "text-bone" : "text-mute"
                }`}
              >
                {section === id ? <span className="absolute inset-0 rounded-3xl border border-bone/10 bg-bone/10" /> : null}
                <span className="relative">{icon}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Balance({
  round,
  ready,
  complete,
  amount,
  label,
  onPrimary,
}: {
  round: Round;
  ready: boolean;
  complete: boolean;
  amount: number;
  label: string;
  onPrimary: () => void;
}) {
  const shown = ready && complete ? amount : 0;
  const parts = moneyParts(shown);
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-5xl font-semibold leading-none tracking-tight tabular-nums sm:text-6xl" aria-live="polite">
          ${parts.dollars}
          <span className="text-bone/30">.{parts.cents}</span>
        </p>
        <p className={`mt-2 text-base font-medium ${complete ? "text-gain" : "text-mute"}`}>
          {complete ? `+$${round.rewardUsd} reserved for mainnet` : "+$0 reserved"}
        </p>
        {round.rewardTokens > 0 ? (
          <p className={`text-sm ${complete ? "text-gold" : "text-mute"}`}>
            {complete
              ? `+${round.rewardTokens.toLocaleString("en-US")} $${round.tokenSymbol} reserved`
              : `${round.rewardTokens.toLocaleString("en-US")} $${round.tokenSymbol} in this round`}
          </p>
        ) : null}
      </div>
      <Button type="button" size="lg" onClick={onPrimary} className="shrink-0">
        {label}
      </Button>
    </div>
  );
}

function TaskPanel({
  round,
  handle,
  referrer,
  done,
  opened,
  doneCount,
  inputRef,
  onHandle,
  onOpen,
  onDone,
}: {
  round: Round;
  handle: string;
  referrer: string;
  done: Record<TaskId, boolean>;
  opened: Record<TaskId, boolean>;
  doneCount: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onHandle: (handle: string) => void;
  onOpen: (id: TaskId) => void;
  onDone: (id: TaskId) => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const locked = !handle || editing;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    if (!next) {
      setError("Enter your X username to start.");
      return;
    }
    if (!isHandle(next)) {
      setError("X usernames use letters, numbers, and underscores, up to 15 characters.");
      return;
    }
    setError("");
    onHandle(normalizeHandle(next));
    setEditing(false);
  }

  return (
    <div className="space-y-3">
      {handle && !editing ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ember/15 text-sm font-bold text-ember uppercase">
              {handle.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-mute">Taking part as</p>
              <p className="truncate font-semibold">@{handle}</p>
              {referrer ? <p className="truncate text-xs text-mute">Invited by @{referrer}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(handle);
              setEditing(true);
              window.setTimeout(() => inputRef.current?.focus(), 40);
            }}
            className="rounded-full px-3 py-2 text-sm text-soft hover:bg-bone/5 hover:text-bone"
          >
            Change
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="rounded-2xl border border-line bg-panel p-4">
          {referrer ? (
            <p className="mb-3 inline-flex rounded-full bg-ember/15 px-3 py-1 text-xs font-semibold text-ember">
              Invited by @{referrer}
            </p>
          ) : null}
          <label htmlFor="handle" className="block text-sm font-semibold">
            Your X username
          </label>
          <p className="mt-0.5 text-sm text-mute">Your launch credit is reserved for this account.</p>
          <div className="mt-3 flex gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-line bg-ink px-3 focus-within:border-ember">
              <span className="text-mute">@</span>
              <input
                id="handle"
                ref={inputRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (error) setError("");
                }}
                placeholder="username"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={16}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "handle-error" : undefined}
                className="w-full bg-transparent px-1.5 py-3 text-base text-bone outline-none placeholder:text-mute"
              />
            </div>
            <button type="submit" className="shrink-0 rounded-xl bg-ember px-4 font-semibold text-ink shadow-ember">
              Continue
            </button>
          </div>
          {error ? (
            <p id="handle-error" role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </form>
      )}

      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gain shadow-[0_0_12px_var(--color-gain)] transition-[width] duration-300"
            style={{ width: `${(doneCount / tasks.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-soft tabular-nums" aria-live="polite">
          {doneCount} of {tasks.length} done
        </p>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => {
          const Icon = taskIcons[task.id];
          const finished = done[task.id];
          const seen = opened[task.id];
          return (
            <li
              key={task.id}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-[border-color,background-color,opacity] duration-200 ${
                finished ? "border-gain/40 bg-gain/10" : "border-line bg-panel"
              } ${locked ? "opacity-50" : ""}`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  finished ? "bg-gain text-ink" : "bg-bone/10 text-bone"
                }`}
              >
                {finished ? <Check className="h-5 w-5" strokeWidth={3} /> : locked ? <Lock className="h-4 w-4 text-mute" /> : <Icon className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${finished ? "text-soft" : ""}`}>{task.title}</p>
                <p className="text-sm leading-snug text-mute">{task.detail}</p>
                {seen && !finished ? (
                  <button type="button" onClick={() => onOpen(task.id)} className="mt-1 text-xs text-soft underline underline-offset-2">
                    {task.id === "token" ? "Open the page again" : "Open X again"}
                  </button>
                ) : null}
              </div>
              <div className="shrink-0">
                {finished ? (
                  <span className="text-sm font-semibold text-gain">Done</span>
                ) : seen ? (
                  <button
                    type="button"
                    onClick={() => onDone(task.id)}
                    className="rounded-full bg-bone px-4 py-2 text-sm font-semibold text-ink"
                  >
                    I did it
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onOpen(task.id)}
                    aria-label={
                      task.id === "token"
                        ? `${task.action} (opens clawpump.tech in a new tab)`
                        : `${task.action} (opens X in a new tab)`
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bone/5 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed"
                  >
                    <XMark className="h-3 w-3" />
                    {task.action}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="px-1 text-xs leading-relaxed text-mute">
        {handle
          ? "Like, repost, reply, follow, and the launch note open X. The token task opens clawpump.tech. Come back and tap “I did it”. "
          : "Enter your username to unlock the tasks. "}
        We check every account before launch credits are issued.
        {round.rewardTokens > 0
          ? ` This round reserves $${round.rewardUsd} and ${round.rewardTokens.toLocaleString("en-US")} $${round.tokenSymbol}.`
          : ` This round reserves $${round.rewardUsd}.`}
      </p>
      {handle ? (
        <ShareKit
          handle={handle}
          doneCount={doneCount}
          complete={doneCount === tasks.length}
          pendingUsd={round.rewardUsd}
        />
      ) : null}
    </div>
  );
}

function RewardPanel({
  round,
  complete,
  handle,
  doneCount,
  amount,
  onTasks,
}: {
  round: Round;
  complete: boolean;
  handle: string;
  doneCount: number;
  amount: number;
  onTasks: () => void;
}) {
  const steps = tasks.length + 1;
  const filled = (handle ? 1 : 0) + doneCount;
  const parts = moneyParts(complete ? amount : round.rewardUsd);

  if (!complete) {
    return (
      <div className="rounded-3xl border border-line bg-panel p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-mute">Launch credit</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-bone/30 tabular-nums">
              ${round.rewardUsd}
              <span className="text-bone/20">.00</span>
            </p>
            {round.rewardTokens > 0 ? (
              <p className="mt-2 text-sm text-bone/30">
                +{round.rewardTokens.toLocaleString("en-US")} ${round.tokenSymbol}
              </p>
            ) : null}
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-bone/5">
            <Lock className="h-5 w-5 text-mute" />
          </span>
        </div>
        <p className="mt-4 text-sm text-soft">
          Finish the campaign to reserve it. You are {filled} of {steps} steps in.
        </p>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: steps }, (_, index) => (
            <span key={index} className={`h-1.5 flex-1 rounded-full ${index < filled ? "bg-gain" : "bg-line"}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={onTasks}
          className="mt-5 w-full rounded-2xl bg-ember py-3.5 font-semibold text-ink shadow-ember"
        >
          {handle ? "Finish the tasks" : "Start the campaign"}
        </button>
        {handle ? <ShareKit handle={handle} doneCount={doneCount} complete={false} pendingUsd={round.rewardUsd} /> : null}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-ember/40 bg-panel p-5">
      <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-ember/20 blur-3xl" />
      <div className="flex items-center justify-between">
        <p className="text-sm text-soft">Launch credit</p>
        <span className="rounded-full bg-gain/15 px-2.5 py-1 text-xs font-semibold text-gain">Reserved</span>
      </div>
      <p className="mt-2 text-5xl font-semibold tracking-tight tabular-nums">
        ${parts.dollars}
        <span className="text-bone/40">.{parts.cents}</span>
      </p>
      <p className="mt-2 text-sm text-soft">
        Reserved for @{handle}. It lands when {brand.name} opens at mainnet.
      </p>
      {round.rewardTokens > 0 ? (
        <p className="mt-2 text-sm font-semibold text-gold">
          {round.rewardTokens.toLocaleString("en-US")} ${round.tokenSymbol} reserved with this round.
        </p>
      ) : null}
      <div className="mt-5 border-t border-dashed border-line pt-4">
        <ShareKit handle={handle} doneCount={doneCount} complete pendingUsd={round.rewardUsd} />
      </div>
    </div>
  );
}

function MainnetPanel() {
  return (
    <div className="rounded-3xl border border-line bg-panel p-5">
      <p className="font-semibold">Trading opens at mainnet</p>
      <p className="mt-1.5 text-sm leading-relaxed text-soft">
        Right now {brand.name} is collecting early members for @{brand.handle}. The app, deposits, and trading open
        when mainnet launches.
      </p>
      <button
        type="button"
        onClick={() => document.getElementById("mainnet")?.scrollIntoView({ behavior: "smooth" })}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-soft"
      >
        See what is coming
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function LockedDesk() {
  return (
    <div className="space-y-3">
      <Link to="/arena" className="group relative block overflow-hidden rounded-app border border-line shadow-dock">
        <img
          src="/collection/planet.jpg"
          alt="Three geometric agents on a dark ember planet"
          className="h-80 w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink via-ink/10 to-transparent" />
        <span className="absolute inset-x-4 bottom-4 inline-flex items-center justify-between gap-3 rounded-full border border-bone/15 bg-ink/80 px-4 py-2.5 text-sm font-semibold backdrop-blur-md">
          Enter the 3D arena
          <ArrowUpRight className="h-4 w-4 text-ember" />
        </span>
      </Link>
      <Link to="/collection" className="flex items-center gap-3 rounded-3xl border border-line bg-panel p-3">
        <img src="/collection/agent.jpg" alt="" className="h-16 w-16 rounded-2xl object-cover" />
        <span>
          <span className="block text-sm font-semibold">Collection</span>
          <span className="block text-xs text-mute">Stills and a six-second orbit</span>
        </span>
      </Link>
    </div>
  );
}

function Faq({ round }: { round: Round }) {
  const items = faqs(round);
  const [open, setOpen] = useState(0);
  return (
    <section aria-labelledby="faq-title" className="border-t border-line">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <h2 id="faq-title" className="font-display text-4xl sm:text-5xl">
          Questions
        </h2>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {items.map((item, index) => {
            const expanded = open === index;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-semibold"
                >
                  {item.q}
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bone/5 transition ${expanded ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                <p className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <span className="overflow-hidden">
                    <span className="block max-w-2xl pb-5 text-sm leading-relaxed text-soft">{item.a}</span>
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-24 rounded-2xl bg-panel" />
      <div className="h-16 rounded-2xl bg-panel" />
      <div className="h-16 rounded-2xl bg-panel" />
    </div>
  );
}
