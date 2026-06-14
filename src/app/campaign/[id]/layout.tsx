import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CampaignNav } from "@/components/campaign/campaign-nav";

export const dynamic = "force-dynamic";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) notFound();

  return (
    <main className="container mx-auto max-w-7xl py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">&larr; Back</Link>
            </Button>
            <h1 className="font-display text-2xl">{c.name}</h1>
          </div>
          {c.summary && (
            <p className="mt-1 text-sm text-muted-foreground">{c.summary}</p>
          )}
        </div>
      </header>
      <CampaignNav campaignId={id} current="" />
      {children}
    </main>
  );
}
