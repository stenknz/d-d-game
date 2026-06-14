import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import { QuestForm } from "@/components/quest/quest-form";

export const dynamic = "force-dynamic";

export default async function NewQuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const npcs = await prisma.nPC.findMany({
    where: { campaignId: id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/quests`}>&larr; Quests</Link>
        </Button>
      </div>
      <h2 className="mb-4 font-display text-xl">New Quest</h2>
      <QuestForm campaignId={id} npcOptions={npcs} />
    </div>
  );
}
