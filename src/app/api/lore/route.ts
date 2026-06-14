import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { LoreCreateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }
  const entries = await prisma.loreEntry.findMany({
    where: { campaignId },
    orderBy: { importance: "desc" },
  });
  return NextResponse.json({
    lore: entries.map((e) => ({ ...e, tags: safeJsonParse(e.tags, []) })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoreCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const entry = await prisma.loreEntry.create({
    data: {
      campaignId: d.campaignId,
      kind: d.kind,
      title: d.title,
      body: d.body,
      tags: JSON.stringify(d.tags),
      importance: d.importance,
    },
  });
  return NextResponse.json(
    { lore: { ...entry, tags: safeJsonParse(entry.tags, []) } },
    { status: 201 },
  );
}
