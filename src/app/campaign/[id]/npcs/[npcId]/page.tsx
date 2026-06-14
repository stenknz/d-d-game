import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NPCDetailPage({
  params,
}: {
  params: Promise<{ id: string; npcId: string }>;
}) {
  const { id, npcId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const npc = await prisma.nPC.findUnique({
    where: { id: npcId },
    include: { location: { select: { id: true, name: true } } },
  });
  if (!npc || npc.campaignId !== id) notFound();

  const personality = safeJsonParse<{
    traits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
    voice?: string;
  }>(npc.personality, { traits: [], ideals: [], bonds: [], flaws: [] });

  const secrets = safeJsonParse<string[]>(npc.secrets, []);

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/npcs`}>&larr; NPCs</Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{npc.name}</CardTitle>
              {npc.role && <Badge>{npc.role}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p>Species: {npc.species ?? "Unknown"}</p>
              {npc.faction && <p>Faction: {npc.faction}</p>}
              {npc.location && (
                <p>
                  Location:{" "}
                  <Link
                    href={`/campaign/${id}/locations/${npc.location.id}`}
                    className="text-ember hover:underline"
                  >
                    {npc.location.name}
                  </Link>
                </p>
              )}
              <p>Status: {npc.isAlive ? "Alive" : "Dead"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {personality.traits.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Traits</p>
                <p className="text-sm">{personality.traits.join(", ")}</p>
              </div>
            )}
            {personality.ideals.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Ideals</p>
                <p className="text-sm">{personality.ideals.join(", ")}</p>
              </div>
            )}
            {personality.bonds.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Bonds</p>
                <p className="text-sm">{personality.bonds.join(", ")}</p>
              </div>
            )}
            {personality.flaws.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Flaws</p>
                <p className="text-sm">{personality.flaws.join(", ")}</p>
              </div>
            )}
            {personality.voice && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Voice</p>
                <p className="text-sm italic">{personality.voice}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {secrets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Secrets</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {secrets.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {npc.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{npc.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
