import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const entries = await prisma.loreEntry.findMany({
    where: { campaignId: id },
    orderBy: { importance: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl">Lore & History</h2>
        <Button asChild variant="ember" size="sm">
          <Link href={`/campaign/${id}/lore/new`}>+ New Entry</Link>
        </Button>
      </div>
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No lore yet. The world awaits its history.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => {
            const tags = safeJsonParse<string[]>(entry.tags, []);
            return (
              <Link key={entry.id} href={`/campaign/${id}/lore/${entry.id}`} className="block">
                <Card className="h-full transition-colors hover:border-ember/60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{entry.title}</CardTitle>
                      <Badge variant="outline">{entry.kind}</Badge>
                    </div>
                    {entry.body && (
                      <CardDescription>
                        {entry.body.length > 150
                          ? entry.body.slice(0, 150) + "…"
                          : entry.body}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {tags.length > 0 && (
                    <CardContent className="flex flex-wrap gap-1">
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
