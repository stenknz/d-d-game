import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string; locationId: string }>;
}) {
  const { id, locationId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      parent: { select: { id: true, name: true, kind: true } },
      children: { select: { id: true, name: true, kind: true, description: true } },
      npcs: { select: { id: true, name: true, role: true } },
    },
  });
  if (!location || location.campaignId !== id) notFound();

  const tags = safeJsonParse<string[]>(location.tags, []);

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/locations`}>&larr; Locations</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl">{location.name}</CardTitle>
            <Badge>{location.kind}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {location.parent && (
            <p className="text-sm text-muted-foreground">
              Part of:{" "}
              <Link
                href={`/campaign/${id}/locations/${location.parent.id}`}
                className="text-ember hover:underline"
              >
                {location.parent.name}
              </Link>
            </p>
          )}
          {location.description && (
            <p className="whitespace-pre-wrap text-sm">{location.description}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {location.children.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 font-display text-lg">Sub-Locations</h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {location.children.map((child) => (
              <Link
                key={child.id}
                href={`/campaign/${id}/locations/${child.id}`}
                className="block"
              >
                <Card className="transition-colors hover:border-ember/60">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{child.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        {child.kind}
                      </Badge>
                    </div>
                    {child.description && (
                      <CardDescription>
                        {child.description.length > 100
                          ? child.description.slice(0, 100) + "…"
                          : child.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {location.npcs.length > 0 && (
        <div>
          <h3 className="mb-2 font-display text-lg">NPCs Here</h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {location.npcs.map((npc) => (
              <Link key={npc.id} href={`/campaign/${id}/npcs/${npc.id}`} className="block">
                <Card className="transition-colors hover:border-ember/60">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{npc.name}</CardTitle>
                      {npc.role && <Badge variant="outline">{npc.role}</Badge>}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
