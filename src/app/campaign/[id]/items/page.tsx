import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const KIND_COLORS: Record<string, "ember" | "gold" | "default" | "secondary" | "success"> = {
  weapon: "ember",
  armor: "default",
  wondrous: "gold",
  consumable: "success",
  treasure: "secondary",
};

export default async function ItemsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const items = await prisma.item.findMany({
    where: { campaignId: id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl">Items</h2>
        <Button asChild variant="ember" size="sm">
          <Link href={`/campaign/${id}/items/new`}>+ New Item</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No items yet. Add treasure, weapons, and magic items.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            return (
              <Link key={item.id} href={`/campaign/${id}/items/${item.id}`} className="block">
                <Card className="h-full transition-colors hover:border-ember/60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{item.name}</CardTitle>
                      <Badge variant={KIND_COLORS[item.kind] ?? "secondary"}>{item.kind}</Badge>
                    </div>
                    {item.description && (
                      <CardDescription>
                        {item.description.length > 120
                          ? item.description.slice(0, 120) + "…"
                          : item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1">
                    {item.rarity && (
                      <Badge variant="outline" className="text-[10px]">
                        {item.rarity}
                      </Badge>
                    )}
                    {item.attunement && (
                      <Badge variant="outline" className="text-[10px]">
                        Attunement
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
