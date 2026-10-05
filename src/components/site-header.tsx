import { Link } from "@tanstack/react-router";
import { brand, roundList, type RoundId } from "@/lib/campaigns";
import { ClawMark, XMark } from "@/components/claw-mark";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type NavId = RoundId | "arena" | "collection" | "token" | "launch" | "world" | "setup" | "board";

const extras = [
  { id: "board" as const, path: "/leaderboard" as const, label: "Board" },
  { id: "world" as const, path: "/world" as const, label: "World" },
  { id: "setup" as const, path: "/setup" as const, label: "Setup" },
  { id: "token" as const, path: "/token" as const, label: "Token" },
  { id: "launch" as const, path: "/launch" as const, label: "Launch" },
  { id: "arena" as const, path: "/arena" as const, label: "Arena" },
  { id: "collection" as const, path: "/collection" as const, label: "Collection" },
];

export function SiteHeader({ active }: { active: NavId }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 sm:px-8 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg" aria-label="ClawCash home">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-background ring-1 ring-border">
              <ClawMark className="h-8 w-8" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Claw<span className="text-primary">Cash</span>
            </span>
          </Link>
          <a href={brand.profile} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "sm" }), "bg-foreground text-background hover:bg-soft lg:hidden")}>
            <XMark />
            Follow
          </a>
        </div>
        <nav aria-label="Sections" className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto no-scrollbar">
          {roundList.map((item) => (
            <Link key={item.id} to={item.path} className={buttonVariants({ variant: item.id === active ? "default" : "ghost", size: "sm" })}>
              {item.label}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden="true" />
          {extras.map((item) => (
            <Link key={item.id} to={item.path} className={buttonVariants({ variant: item.id === active ? "default" : "outline", size: "sm" })}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline">Pre-mainnet</Badge>
            </TooltipTrigger>
            <TooltipContent>Trading is not live. Nothing can be deposited.</TooltipContent>
          </Tooltip>
          <a href={brand.profile} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "sm" }), "bg-foreground text-background hover:bg-soft")}>
            <XMark />
            Follow
          </a>
        </div>
      </div>
    </header>
  );
}
