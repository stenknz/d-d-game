import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LocationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const locations = await prisma.location.findMany({
    where: { campaignId: id, parentId: null },
    orderBy: { name: "asc" },
    include: {
      children: { select: { id: true, name: true, kind: true } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl">Locations</h2>
        <Button asChild variant="ember" size="sm">
          <Link href={`/campaign/${id}/locations/new`}>+ New Location</Link>
        </Button>
      </div>
      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No locations yet. Build the world.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => {
            const tags = safeJsonParse<string[]>(loc.tags, []);
            return (
              <Link key={loc.id} href={`/campaign/${id}/locations/${loc.id}`} className="block">
                <Card className="h-full transition-colors hover:border-ember/60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{loc.name}</CardTitle>
                      <Badge variant="outline">{loc.kind}</Badge>
                    </div>
                    {loc.description && (
                      <CardDescription>
                        {loc.description.length > 120
                          ? loc.description.slice(0, 120) + "…"
                          : loc.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {(loc.children.length > 0 || tags.length > 0) && (
                    <CardContent className="flex flex-wrap gap-1">
                      {loc.children.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {loc.children.length} sub-location
                          {loc.children.length === 1 ? "" : "s"}
                        </span>
                      )}
                      {tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
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
