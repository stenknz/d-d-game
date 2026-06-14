import { CharacterCreator } from "@/components/character/creator";
import { prisma } from "@/db/client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) notFound();
  return (
    <main className="container mx-auto max-w-5xl py-10">
      <h1 className="mb-2 font-display text-3xl">New Character</h1>
      <p className="mb-6 text-muted-foreground">In the campaign <span className="text-foreground">{c.name}</span></p>
      <CharacterCreator campaignId={id} />
    </main>
  );
}
