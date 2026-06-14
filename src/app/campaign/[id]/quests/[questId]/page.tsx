import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, "gold" | "success" | "danger" | "secondary"> = {
  active: "gold",
  completed: "success",
  failed: "danger",
  abandoned: "secondary",
};

export default async function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string; questId: string }>;
}) {
  const { id, questId } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: {
      objectives: { orderBy: { order: "asc" } },
      giver: { select: { id: true, name: true, role: true } },
    },
  });
  if (!quest || quest.campaignId !== id) notFound();

  const rewards = safeJsonParse<{ xp: number; gold: number; items: string[] }>(quest.rewards, {
    xp: 0,
    gold: 0,
    items: [],
  });

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/quests`}>&larr; Quests</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl">{quest.title}</CardTitle>
            <Badge variant={STATUS_COLORS[quest.status] ?? "secondary"}>{quest.status}</Badge>
            <Badge variant="outline">{quest.kind}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm">{quest.description}</p>
          {quest.giver && (
            <p className="text-sm text-muted-foreground">
              Given by:{" "}
              <Link
                href={`/campaign/${id}/npcs/${quest.giver.id}`}
                className="text-ember hover:underline"
              >
                {quest.giver.name}
              </Link>
              {quest.giver.role && <> ({quest.giver.role})</>}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          {quest.objectives.length === 0 ? (
            <p className="text-sm text-muted-foreground">No objectives defined.</p>
          ) : (
            <ul className="space-y-2">
              {quest.objectives.map((obj) => (
                <li key={obj.id} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      obj.status === "completed"
                        ? "bg-emerald-700/40 text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {obj.status === "completed" ? "✓" : obj.order + 1}
                  </span>
                  <span
                    className={obj.status === "completed" ? "text-muted-foreground line-through" : ""}
                  >
                    {obj.description}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {(rewards.xp > 0 || rewards.gold > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              {rewards.xp > 0 && <span>{rewards.xp} XP</span>}
              {rewards.gold > 0 && <span>{rewards.gold} GP</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
