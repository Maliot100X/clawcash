import { useEffect, useRef, useState } from "react";
import {
  applyAgentAttributes,
  loadAgentScript,
  playAgentClip,
  type AgentNode,
  type EmbedConfig,
} from "@/lib/threews";

export function AgentEmbed({
  config,
  clip = null,
  clipNonce = 0,
}: {
  config: EmbedConfig;
  clip?: string | null;
  clipNonce?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const node = useRef<AgentNode | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "error">("loading");

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let cancelled = false;
    setStatus("loading");
    loadAgentScript()
      .then(() => {
        if (cancelled) return;
        parent.replaceChildren();
        const el = document.createElement("agent-3d") as AgentNode;
        el.style.display = "block";
        el.style.width = "100%";
        el.style.height = "100%";
        applyAgentAttributes(el, config);
        parent.appendChild(el);
        node.current = el;
        setStatus("live");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      node.current = null;
      parent.replaceChildren();
    };
  }, [config]);

  useEffect(() => {
    if (!clip || status !== "live") return;
    playAgentClip(node.current, clip);
  }, [clip, clipNonce, status]);

  return (
    <div className="relative h-full min-h-80">
      <div ref={host} className="h-full min-h-80" />
      {status === "loading" ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-mute">
          Loading agent-3d…
        </p>
      ) : null}
      {status === "error" ? (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-danger">
          The three.ws script did not load. Check the connection and try the page again.
        </p>
      ) : null}
    </div>
  );
}
