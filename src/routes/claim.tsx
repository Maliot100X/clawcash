import { createFileRoute } from "@tanstack/react-router";
import { CampaignApp } from "@/components/campaign-app";
import { rounds } from "@/lib/campaigns";

export const Route = createFileRoute("/claim")({
  component: function Claim() {
    return <CampaignApp key={rounds.claim.id} round={rounds.claim} />;
  },
  head: () => ({
    meta: [
      { title: rounds.claim.pageTitle },
      { name: "description", content: rounds.claim.description },
    ],
  }),
});
