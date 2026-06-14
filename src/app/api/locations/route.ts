import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { LocationCreateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }
  const locations = await prisma.location.findMany({
    where: { campaignId },
    orderBy: { name: "asc" },
    include: { parent: { select: { id: true, name: true } } },
  });
  return NextResponse.json({
    locations: locations.map((l) => ({ ...l, tags: safeJsonParse(l.tags, []) })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LocationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const location = await prisma.location.create({
    data: {
      campaignId: d.campaignId,
      name: d.name,
      kind: d.kind,
      description: d.description,
      parentId: d.parentId,
      tags: JSON.stringify(d.tags),
    },
  });
  return NextResponse.json(
    { location: { ...location, tags: safeJsonParse(location.tags, []) } },
    { status: 201 },
  );
}
