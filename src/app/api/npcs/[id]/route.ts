import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { NPCUpdateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const npc = await prisma.nPC.findUnique({ where: { id } });
  if (!npc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    npc: {
      ...npc,
      stats: safeJsonParse(npc.stats, {}),
      personality: safeJsonParse(npc.personality, {}),
      reputation: safeJsonParse(npc.reputation, {}),
      secrets: safeJsonParse(npc.secrets, []),
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = NPCUpdateSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id: _, ...patch } = parsed.data;
  void _;
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (["stats", "personality", "reputation", "secrets"].includes(key)) {
      data[key] = JSON.stringify(value);
    } else {
      data[key] = value;
    }
  }
  const npc = await prisma.nPC.update({ where: { id }, data });
  return NextResponse.json({
    npc: {
      ...npc,
      stats: safeJsonParse(npc.stats, {}),
      personality: safeJsonParse(npc.personality, {}),
      reputation: safeJsonParse(npc.reputation, {}),
      secrets: safeJsonParse(npc.secrets, []),
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await prisma.nPC.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
