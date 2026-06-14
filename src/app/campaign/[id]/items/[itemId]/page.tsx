import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_COLORS: Record<string, "ember" | "gold" | "default" | "secondary" | "success"> = {
  weapon: "ember",
  armor: "default",
  wondrous: "gold",
  consumable: "success",
  treasure: "secondary",
};

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.campaignId !== id) notFound();

  const properties = safeJsonParse<Record<string, unknown>>(item.properties, {});

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/items`}>&larr; Items</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl">{item.name}</CardTitle>
            <Badge variant={KIND_COLORS[item.kind] ?? "secondary"}>{item.kind}</Badge>
            {item.rarity && <Badge variant="outline">{item.rarity}</Badge>}
            {item.attunement && <Badge variant="outline">Requires Attunement</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {item.description && (
            <p className="whitespace-pre-wrap text-sm italic">{item.description}</p>
          )}
          {Object.keys(properties).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Properties</p>
              <pre className="rounded bg-muted p-3 text-xs">
                {JSON.stringify(properties, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
