import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { QuestCreateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }
  const quests = await prisma.quest.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    include: {
      objectives: { orderBy: { order: "asc" } },
      giver: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({
    quests: quests.map((q) => ({
      ...q,
      rewards: safeJsonParse(q.rewards, { xp: 0, gold: 0, items: [] }),
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = QuestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const quest = await prisma.quest.create({
    data: {
      campaignId: d.campaignId,
      title: d.title,
      kind: d.kind,
      description: d.description,
      status: d.status,
      giverId: d.giverId,
      rewards: JSON.stringify(d.rewards),
      objectives: { create: d.objectives },
    },
    include: { objectives: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(
    { quest: { ...quest, rewards: safeJsonParse(quest.rewards, {}) } },
    { status: 201 },
  );
}
