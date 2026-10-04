import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { collection } from "@/lib/agents";
import { filmPost } from "@/lib/board";
import { filmVideo, shareOrigin } from "@/lib/campaigns";

export const Route = createFileRoute("/collection")({
  component: CollectionPage,
  head: () => ({
    meta: [
      { title: "ClawCash | Collection" },
      { name: "description", content: "Stills and a short film of the ClawCash agents and their planet." },
    ],
  }),
});

type Piece = (typeof collection)[number];

function CollectionPage() {
  const [open, setOpen] = useState<Piece | null>(null);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const strip = [...collection, ...collection];
  const post = filmPost();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-dvh">
      <SiteHeader active="collection" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">Collection</p>
        <h1 className="rise mt-3 max-w-3xl font-display text-5xl leading-none sm:text-6xl">
          Stills, then the <span className="italic text-ember">orbit.</span>
        </h1>
        <p className="mt-4 max-w-xl text-soft">
          Five pieces from the ClawCash world, and a six-second pass around the planet. Open a still. The live version is in the arena.
        </p>

        <figure className="rise rise-late mt-8 overflow-hidden rounded-app border border-line bg-panel p-3 shadow-dock sm:p-4">
          <div className="flex gap-3">
            <FilmEdge />
            <div className="min-w-0 flex-1 overflow-hidden rounded-3xl border border-line">
              <video
                className="aspect-video w-full bg-ink"
                src="/collection/orbit.mp4"
                poster="/collection/planet.jpg"
                controls
                playsInline
                preload="metadata"
              />
            </div>
            <FilmEdge />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-3 px-2 pt-4">
            <div>
              <p className="font-semibold">Orbit</p>
              <p className="text-sm text-mute">Six seconds. Three agents. One planet.</p>
            </div>
            <Link to="/arena" className="press inline-flex items-center gap-2 rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink">
              Open the arena
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </figcaption>
        </figure>

        <section className="mt-4 rounded-3xl border border-line bg-panel p-5">
          <p className="font-semibold">Share the full film</p>
          <p className="mt-1 text-sm text-mute">
            The post ends on the video file, so X attaches the whole orbit. Site, collection, and card stay in the text.
          </p>
          <p className="mt-3 truncate text-sm text-soft" title={filmVideo}>
            {filmVideo}
          </p>
          <textarea
            readOnly
            value={post}
            rows={12}
            aria-label="Collection post for X"
            className="mt-3 w-full resize-none rounded-2xl border border-line bg-ink px-3 py-3 text-sm leading-relaxed text-soft"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(post).then(
                  () => {
                    setCopied("ok");
                    window.setTimeout(() => setCopied(""), 2000);
                  },
                  () => setCopied("fail"),
                );
              }}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              {copied === "ok" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "ok" ? "Post copied" : "Copy post"}
            </button>
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(post)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex items-center rounded-xl bg-bone px-4 py-2.5 text-sm font-semibold text-ink"
            >
              Post on X
            </a>
            <a
              href={shareOrigin}
              className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-ember"
            >
              {shareOrigin.replace("https://", "")}
            </a>
          </div>
          {copied === "fail" ? <p className="mt-2 text-xs text-danger">Select the text and copy it.</p> : null}
        </section>

        <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-ink">
          <div className="reel-track flex w-max gap-3 py-3">
            {strip.map((piece, index) => (
              <button
                key={`${piece.src}-${index}`}
                type="button"
                onClick={() => setOpen(piece)}
                className="press w-40 shrink-0 overflow-hidden rounded-2xl border border-line sm:w-52"
                aria-label={`Open ${piece.title}`}
              >
                <img src={piece.src} alt="" className="aspect-4/3 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collection.map((piece) => (
            <li key={piece.src}>
              <button
                type="button"
                onClick={() => setOpen(piece)}
                className="press group w-full overflow-hidden rounded-3xl border border-line bg-panel text-left"
              >
                <img src={piece.src} alt={piece.title} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="block px-4 py-4">
                  <span className="block font-semibold">{piece.title}</span>
                  <span className="mt-1 block text-sm text-mute">{piece.text}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-5 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={() => setOpen(null)}
        >
          <figure className="w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <img src={open.src} alt={open.title} className="max-h-[70vh] w-full rounded-3xl object-contain" />
            <figcaption className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{open.title}</p>
                <p className="text-sm text-mute">{open.text}</p>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="press grid h-11 w-11 place-items-center rounded-full bg-bone text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}

function FilmEdge() {
  return (
    <div aria-hidden="true" className="hidden w-4 shrink-0 flex-col justify-between py-2 sm:flex">
      {Array.from({ length: 7 }, (_, index) => (
        <span key={index} className="mx-auto h-3 w-3 rounded-full bg-ink ring-1 ring-line" />
      ))}
    </div>
  );
}
