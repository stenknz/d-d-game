import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LoreDetailPage({
  params,
}: {
  params: Promise<{ id: string; loreId: string }>;
}) {
  const { id, loreId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const entry = await prisma.loreEntry.findUnique({ where: { id: loreId } });
  if (!entry || entry.campaignId !== id) notFound();

  const tags = safeJsonParse<string[]>(entry.tags, []);

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/lore`}>&larr; Lore</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl">{entry.title}</CardTitle>
            <Badge>{entry.kind}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.body}</p>
          </div>
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
    </div>
  );
}
