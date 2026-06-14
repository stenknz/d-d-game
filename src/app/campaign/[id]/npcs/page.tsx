import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NPCPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const npcs = await prisma.nPC.findMany({
    where: { campaignId: id },
    orderBy: { name: "asc" },
    include: { location: { select: { name: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl">NPCs</h2>
        <Button asChild variant="ember" size="sm">
          <Link href={`/campaign/${id}/npcs/new`}>+ New NPC</Link>
        </Button>
      </div>
      {npcs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No NPCs yet. Create one to populate the world.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {npcs.map((npc) => {
            const personality = safeJsonParse<{ traits?: string[] }>(npc.personality, {});
            return (
              <Link key={npc.id} href={`/campaign/${id}/npcs/${npc.id}`} className="block">
                <Card className="h-full transition-colors hover:border-ember/60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{npc.name}</CardTitle>
                      {npc.role && <Badge variant="outline">{npc.role}</Badge>}
                    </div>
                    <CardDescription>
                      {npc.species ?? "Unknown species"}
                      {npc.location ? ` · ${npc.location.name}` : ""}
                    </CardDescription>
                  </CardHeader>
                  {personality.traits && personality.traits.length > 0 && (
                    <CardContent>
                      <p className="text-xs italic text-muted-foreground">
                        &ldquo;{personality.traits.slice(0, 2).join(", ")}&rdquo;
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
