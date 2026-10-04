import { createFileRoute } from "@tanstack/react-router";
import { CampaignApp } from "@/components/campaign-app";
import { rounds } from "@/lib/campaigns";

export const Route = createFileRoute("/")({
  component: function Home() {
    return <CampaignApp key={rounds.home.id} round={rounds.home} />;
  },
  head: () => ({
    meta: [
      { title: rounds.home.pageTitle },
      { name: "description", content: rounds.home.description },
    ],
  }),
});
