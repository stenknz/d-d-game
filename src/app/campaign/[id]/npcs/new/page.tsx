import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import { NPCForm } from "@/components/npc/npc-form";

export const dynamic = "force-dynamic";

export default async function NewNPCPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/npcs`}>&larr; NPCs</Link>
        </Button>
      </div>
      <h2 className="mb-4 font-display text-xl">New NPC</h2>
      <NPCForm campaignId={id} />
    </div>
  );
}
