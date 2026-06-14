import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import { LoreForm } from "@/components/lore/lore-form";

export const dynamic = "force-dynamic";

export default async function NewLorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/lore`}>&larr; Lore</Link>
        </Button>
      </div>
      <h2 className="mb-4 font-display text-xl">New Lore Entry</h2>
      <LoreForm campaignId={id} />
    </div>
  );
}
