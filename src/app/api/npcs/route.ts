import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { NPCCreateSchema } from "@/lib/schemas";
import { safeJsonParse } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }
  const npcs = await prisma.nPC.findMany({
    where: { campaignId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    npcs: npcs.map((n) => ({
      ...n,
      stats: safeJsonParse(n.stats, {}),
      personality: safeJsonParse(n.personality, {}),
      reputation: safeJsonParse(n.reputation, {}),
      secrets: safeJsonParse(n.secrets, []),
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = NPCCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const npc = await prisma.nPC.create({
    data: {
      campaignId: d.campaignId,
      name: d.name,
      species: d.species,
      role: d.role,
      faction: d.faction,
      locationId: d.locationId,
      stats: JSON.stringify(d.stats),
      personality: JSON.stringify(d.personality),
      reputation: JSON.stringify(d.reputation),
      secrets: JSON.stringify(d.secrets),
      notes: d.notes,
      portraitUrl: d.portraitUrl,
    },
  });
  return NextResponse.json(
    {
      npc: {
        ...npc,
        stats: safeJsonParse(npc.stats, {}),
        personality: safeJsonParse(npc.personality, {}),
        reputation: safeJsonParse(npc.reputation, {}),
        secrets: safeJsonParse(npc.secrets, []),
      },
    },
    { status: 201 },
  );
}
