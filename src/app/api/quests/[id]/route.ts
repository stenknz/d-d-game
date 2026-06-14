import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { QuestUpdateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const quest = await prisma.quest.findUnique({
    where: { id },
    include: {
      objectives: { orderBy: { order: "asc" } },
      giver: { select: { id: true, name: true, role: true } },
    },
  });
  if (!quest) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    quest: { ...quest, rewards: safeJsonParse(quest.rewards, {}) },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = QuestUpdateSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id: _, ...patch } = parsed.data;
  void _;
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    data[key] = key === "rewards" ? JSON.stringify(value) : value;
  }
  const quest = await prisma.quest.update({
    where: { id },
    data,
    include: { objectives: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ quest: { ...quest, rewards: safeJsonParse(quest.rewards, {}) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await prisma.quest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
