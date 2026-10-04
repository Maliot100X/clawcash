import { createFileRoute } from "@tanstack/react-router";
import { CampaignApp } from "@/components/campaign-app";
import { rounds } from "@/lib/campaigns";

export const Route = createFileRoute("/airdrop")({
  component: function Airdrop() {
    return <CampaignApp key={rounds.airdrop.id} round={rounds.airdrop} />;
  },
  head: () => ({
    meta: [
      { title: rounds.airdrop.pageTitle },
      { name: "description", content: rounds.airdrop.description },
    ],
  }),
});
