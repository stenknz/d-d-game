import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, "gold" | "success" | "danger" | "secondary"> = {
  active: "gold",
  completed: "success",
  failed: "danger",
  abandoned: "secondary",
};

export default async function QuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const quests = await prisma.quest.findMany({
    where: { campaignId: id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      objectives: { where: { status: "active" }, select: { id: true } },
      giver: { select: { id: true, name: true } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl">Quests</h2>
        <Button asChild variant="ember" size="sm">
          <Link href={`/campaign/${id}/quests/new`}>+ New Quest</Link>
        </Button>
      </div>
      {quests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No quests yet. The story awaits.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {quests.map((quest) => (
            <Link key={quest.id} href={`/campaign/${id}/quests/${quest.id}`} className="block">
              <Card className="h-full transition-colors hover:border-ember/60">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{quest.title}</CardTitle>
                    <Badge variant={STATUS_COLORS[quest.status] ?? "secondary"}>
                      {quest.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {quest.description}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{quest.kind}</Badge>
                    {quest.giver && <span>Given by {quest.giver.name}</span>}
                    {quest.objectives.length > 0 && (
                      <span>
                        {quest.objectives.length} active objective
                        {quest.objectives.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
