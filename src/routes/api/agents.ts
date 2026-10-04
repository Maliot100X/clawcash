import { createFileRoute } from "@tanstack/react-router";
import { agents } from "@/lib/agents";

export const Route = createFileRoute("/api/agents")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          agents,
          planet: "clawcash",
          mode: "pre-mainnet",
        }),
    },
  },
});
