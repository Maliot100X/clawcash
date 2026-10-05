import { useEffect, useRef, useState } from "react";
import { Mic, Send, X } from "lucide-react";
import { ClawMark } from "@/components/claw-mark";
import { assistantFunctions, assistantPrompt, guidePrompts, viewerSnapshot } from "@/lib/assistant";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Role = "user" | "assistant";
type Line = { id: number; role: Role; text: string };
type Phase = "idle" | "connecting" | "live";

type CallRequest = {
  type: "FunctionCallRequest";
  functions: Array<{ id: string; name: string; arguments?: string; client_side?: boolean }>;
};

const AGENT_URL = "wss://agent.deepgram.com/v1/agent/converse";

export function ClawAssistant() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const idRef = useRef(1);
  const socketRef = useRef<WebSocket | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const playRef = useRef<AudioContext | null>(null);
  const playAt = useRef(0);
  const sources = useRef<AudioBufferSourceNode[]>([]);
  const queue = useRef<string[]>([]);
  const ready = useRef(false);
  const opening = useRef<Promise<void> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines, open]);

  useEffect(() => {
    return () => {
      hangUp();
    };
    // The session must die with the page, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function push(role: Role, text: string) {
    const clean = text.trim();
    if (!clean) return;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.text === clean) return prev;
      const id = idRef.current++;
      return [...prev.slice(-23), { id, role, text: clean }];
    });
  }

  function stopPlayback() {
    for (const source of sources.current) {
      try {
        source.stop();
      } catch {
        /* already ended */
      }
    }
    sources.current = [];
    playAt.current = 0;
  }

  function playPcm(buffer: ArrayBuffer) {
    const ctx = playRef.current;
    if (!ctx) return;
    const samples = new Int16Array(buffer);
    if (!samples.length) return;
    const floats = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i += 1) floats[i] = samples[i] / 32768;
    const audio = ctx.createBuffer(1, floats.length, 24000);
    audio.copyToChannel(floats, 0);
    const source = ctx.createBufferSource();
    source.buffer = audio;
    source.connect(ctx.destination);
    const start = Math.max(ctx.currentTime, playAt.current);
    source.start(start);
    playAt.current = start + audio.duration;
    sources.current.push(source);
  }

  function hangUp() {
    ready.current = false;
    queue.current = [];
    stopPlayback();
    socketRef.current?.close();
    socketRef.current = null;
    micRef.current?.getTracks().forEach((track) => track.stop());
    micRef.current = null;
    void audioRef.current?.close();
    audioRef.current = null;
    void playRef.current?.close();
    playRef.current = null;
    setListening(false);
    setPhase("idle");
  }

  async function ensureSession() {
    if (socketRef.current && ready.current) return;
    if (opening.current) return opening.current;
    const job = openSession();
    opening.current = job;
    try {
      await job;
    } finally {
      opening.current = null;
    }
  }

  async function openSession() {
    if (socketRef.current && ready.current) return;
    if (socketRef.current && phase === "connecting") return;
    setError("");
    setPhase("connecting");
    const response = await fetch("/api/assistant-grant", { method: "POST" });
    const grant = (await response.json()) as { token?: string; error?: string };
    if (!response.ok || !grant.token) {
      setPhase("idle");
      throw new Error(grant.error || "Voice could not start.");
    }
    const play = new AudioContext();
    playRef.current = play;
    await play.resume();
    const socket = new WebSocket(AGENT_URL, ["bearer", grant.token]);
    socket.binaryType = "arraybuffer";
    socketRef.current = socket;
    ready.current = false;

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        playPcm(event.data as ArrayBuffer);
        return;
      }
      let message: { type?: string; role?: Role; content?: string };
      try {
        message = JSON.parse(event.data) as typeof message;
      } catch {
        return;
      }
      if (message.type === "Welcome") {
        socket.send(
          JSON.stringify({
            type: "Settings",
            audio: {
              input: { encoding: "linear16", sample_rate: 16000 },
              output: { encoding: "linear16", sample_rate: 24000, container: "none" },
            },
            agent: {
              greeting: "Hey. I'm CLAW. Ask me about the tasks, your ref link, or the token.",
              listen: {
                provider: {
                  type: "deepgram",
                  version: "v2",
                  model: "flux-general-en",
                  eot_threshold: 0.7,
                  eot_timeout_ms: 2800,
                  keyterms: ["ClawCash", "CLAWRENA", "clawpump", "CLAWRENAi"],
                },
              },
              think: {
                provider: {
                  type: "google",
                  version: "ai-studio-v1beta",
                  model: "gemini-3.1-flash-lite",
                  temperature: 0.4,
                },
                prompt: assistantPrompt(),
                functions: assistantFunctions,
              },
              speak: { provider: { type: "deepgram", version: "v2", model: "flux-hannah-en" } },
            },
          }),
        );
        return;
      }
      if (message.type === "SettingsApplied") {
        ready.current = true;
        setPhase("live");
        for (const text of queue.current) {
          socket.send(JSON.stringify({ type: "InjectUserMessage", content: text }));
        }
        queue.current = [];
        return;
      }
      if (message.type === "ConversationText" && message.content && message.role) {
        push(message.role, message.content);
        return;
      }
      if (message.type === "UserStartedSpeaking") {
        stopPlayback();
        return;
      }
      if (message.type === "FunctionCallRequest") {
        void answerCall(socket, message as CallRequest);
        return;
      }
      if (message.type === "Error") {
        setError("CLAW lost the line. Try again.");
        hangUp();
      }
    });

    socket.addEventListener("close", () => {
      if (socketRef.current === socket) {
        ready.current = false;
        socketRef.current = null;
        setListening(false);
        setPhase("idle");
      }
    });

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("Voice timed out.")), 12000);
      socket.addEventListener("open", () => {
        window.clearTimeout(timer);
        resolve();
      });
      socket.addEventListener("error", () => {
        window.clearTimeout(timer);
        reject(new Error("Voice could not connect."));
      });
    });
  }

  async function answerCall(socket: WebSocket, message: CallRequest) {
    for (const call of message.functions ?? []) {
      let content = '{"error":"unknown"}';
      if (call.name === "my_progress") {
        const local = viewerSnapshot();
        try {
          const response = await fetch("/api/leaderboard", { cache: "no-store" });
          const board = (await response.json()) as {
            players?: Array<{ rank: number; handle: string; tasksDone: number; refs: number; score: number; earnedUsd: number; complete: boolean }>;
          };
          const row = local.handle
            ? (board.players ?? []).find((player) => player.handle.toLowerCase() === local.handle.toLowerCase())
            : undefined;
          content = JSON.stringify({
            handle: local.handle || null,
            markedInBrowser: local.rounds,
            board: row
              ? { rank: row.rank, tasks: row.tasksDone, refs: row.refs, score: row.score, collected: row.earnedUsd, complete: row.complete }
              : null,
          });
        } catch {
          content = JSON.stringify({ handle: local.handle || null, markedInBrowser: local.rounds, board: null });
        }
      }
      if (call.name === "live_board") {
        try {
          const response = await fetch("/api/leaderboard", { cache: "no-store" });
          const board = (await response.json()) as {
            price?: { usd?: number | null; change24h?: number | null; marketCap?: number | null };
            players?: Array<{ rank: number; handle: string; tasksDone: number; refs: number; score: number; earnedUsd: number }>;
          };
          content = JSON.stringify({
            priceUsd: board.price?.usd ?? null,
            change24h: board.price?.change24h ?? null,
            marketCap: board.price?.marketCap ?? null,
            players: (board.players ?? []).slice(0, 8).map((row) => ({
              rank: row.rank,
              handle: row.handle,
              tasks: row.tasksDone,
              refs: row.refs,
              score: row.score,
              collected: row.earnedUsd,
            })),
          });
        } catch {
          content = '{"error":"board unavailable"}';
        }
      }
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "FunctionCallResponse", id: call.id, name: call.name, content }));
      }
    }
  }

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    micRef.current = stream;
    const ctx = new AudioContext();
    audioRef.current = ctx;
    await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    source.connect(processor);
    processor.connect(mute);
    mute.connect(ctx.destination);
    processor.onaudioprocess = (event) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN || !ready.current) return;
      const input = event.inputBuffer.getChannelData(0);
      const ratio = ctx.sampleRate / 16000;
      const length = Math.floor(input.length / ratio);
      const pcm = new Int16Array(length);
      for (let i = 0; i < length; i += 1) {
        const sample = input[Math.min(input.length - 1, Math.floor(i * ratio))] ?? 0;
        pcm[i] = Math.max(-1, Math.min(1, sample)) * 0x7fff;
      }
      socket.send(pcm.buffer);
    };
    setListening(true);
  }

  async function talk() {
    try {
      if (listening) {
        micRef.current?.getTracks().forEach((track) => track.stop());
        micRef.current = null;
        void audioRef.current?.close();
        audioRef.current = null;
        setListening(false);
        return;
      }
      await ensureSession();
      await startMic();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Microphone blocked.");
      setPhase("idle");
    }
  }

  async function sendText(next?: string) {
    const text = (next ?? draft).trim();
    if (!text) return;
    if (!next) setDraft("");
    else setDraft("");
    push("user", text);
    try {
      if (!socketRef.current || !ready.current) {
        queue.current.push(text);
        await ensureSession();
        return;
      }
      socketRef.current.send(JSON.stringify({ type: "InjectUserMessage", content: text }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Message failed.");
    }
  }

  useEffect(() => {
    function onAsk(event: Event) {
      const text = String((event as CustomEvent<string>).detail ?? "").trim();
      if (!text) return;
      setOpen(true);
      void sendText(text);
    }
    window.addEventListener("claw-ask", onAsk);
    return () => window.removeEventListener("claw-ask", onAsk);
  }, []);

  return (
    <div className="fixed right-4 bottom-24 z-50 lg:right-6 lg:bottom-6">
      {open ? (
        <section
          className="mb-3 flex h-[min(36rem,74dvh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-line bg-ink/95 shadow-dock ring-1 ring-bone/10 backdrop-blur-xl"
          aria-label="CLAW assistant"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className={`grid h-10 w-10 place-items-center rounded-2xl bg-ember/15 ring-1 ring-ember/30 ${listening ? "animate-pulse" : ""}`}>
              <ClawMark className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-none">CLAW</p>
              <p className="mt-1 text-xs text-mute">{phase === "live" ? (listening ? "Listening" : "On the line") : phase === "connecting" ? "Connecting" : "Guide"}</p>
            </div>
            <span className="rounded-full border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">Live</span>
            <button type="button" onClick={() => { hangUp(); setOpen(false); }} className="grid h-9 w-9 place-items-center rounded-full text-soft hover:bg-bone/10" aria-label="Close CLAW">
              <X className="h-4 w-4" />
            </button>
          </header>
          <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            {lines.length === 0 ? (
              <div>
                <p className="text-sm leading-relaxed text-soft">
                  Tap a question or type your own. I can also talk.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {guidePrompts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void sendText(item.text)}
                      className={buttonVariants({ variant: "outline", size: "sm", className: "h-auto py-1.5 text-xs" })}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {lines.map((line) => (
              <p
                key={line.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  line.role === "user" ? "ml-auto bg-ember text-ink" : "bg-panel text-bone"
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
          {error ? <p className="px-4 pb-2 text-xs text-danger">{error}</p> : null}
          <form
            className="flex items-end gap-2 border-t border-line p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendText();
            }}
          >
            <button
              type="button"
              onClick={() => void talk()}
              aria-pressed={listening}
              aria-label={listening ? "Stop microphone" : "Talk to CLAW"}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${listening ? "bg-danger text-ink" : "bg-ember text-ink"}`}
            >
              <Mic className="h-4 w-4" />
            </button>
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask CLAW"
              maxLength={500}
              className="h-11 min-w-0 flex-1 rounded-full px-4 text-sm"
            />
            <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bone text-ink" aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto grid h-14 w-14 place-items-center rounded-2xl border border-ember/50 bg-ink shadow-ember ring-1 ring-bone/10"
        aria-label={open ? "Hide CLAW" : "Open CLAW"}
      >
        <ClawMark className="h-9 w-9" />
      </button>
    </div>
  );
}
