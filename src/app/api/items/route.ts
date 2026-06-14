import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { ItemCreateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }
  const items = await prisma.item.findMany({
    where: { campaignId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    items: items.map((i) => ({ ...i, properties: safeJsonParse(i.properties, {}) })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ItemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const item = await prisma.item.create({
    data: {
      campaignId: d.campaignId,
      name: d.name,
      kind: d.kind,
      rarity: d.rarity,
      attunement: d.attunement,
      properties: JSON.stringify(d.properties),
      description: d.description,
    },
  });
  return NextResponse.json(
    { item: { ...item, properties: safeJsonParse(item.properties, {}) } },
    { status: 201 },
  );
}
