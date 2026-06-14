import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { safeJsonParse } from "@/lib/utils";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const s = await prisma.session.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    session: {
      id: s.id,
      campaignId: s.campaignId,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() ?? null,
      summary: s.summary,
      messages: s.messages.map((m) => ({
        id: m.id,
        role: m.role,
        kind: m.kind,
        content: m.content,
        refs: m.refs ? safeJsonParse(m.refs, null) : null,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
}
