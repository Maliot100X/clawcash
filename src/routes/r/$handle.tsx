import { createFileRoute } from "@tanstack/react-router";
import { CampaignApp } from "@/components/campaign-app";
import { isHandle, normalizeHandle, rounds } from "@/lib/campaigns";

export const Route = createFileRoute("/r/$handle")({
  component: function ReferralPage() {
    const { handle } = Route.useParams();
    const ref = isHandle(handle) ? normalizeHandle(handle) : "";
    return <CampaignApp key={rounds.home.id} round={rounds.home} refHandle={ref} />;
  },
  head: () => ({
    meta: [
      { title: rounds.home.pageTitle },
      { name: "description", content: rounds.home.description },
    ],
  }),
});
