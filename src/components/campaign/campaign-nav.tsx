import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: (id: string) => `/campaign/${id}` },
  { label: "NPCs", href: (id: string) => `/campaign/${id}/npcs` },
  { label: "Locations", href: (id: string) => `/campaign/${id}/locations` },
  { label: "Quests", href: (id: string) => `/campaign/${id}/quests` },
  { label: "Lore", href: (id: string) => `/campaign/${id}/lore` },
  { label: "Items", href: (id: string) => `/campaign/${id}/items` },
  { label: "Settings", href: () => "/settings" },
] as const;

export function CampaignNav({ campaignId, current }: { campaignId: string; current: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-border pb-2">
      {NAV_ITEMS.map((item) => {
        const href = item.href(campaignId);
        const isActive =
          (current === "" && href === `/campaign/${campaignId}`) ||
          href.endsWith(`/${current}`);
        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              "rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-border border-b-0 border bg-card text-ember"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
