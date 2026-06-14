import { NextResponse } from "next/server";
import { CombatStartSchema } from "@/lib/schemas";
import { prisma } from "@/db/client";
import { sortByInitiative } from "@/engine/combat";
import { safeJsonParse } from "@/lib/utils";
import type { CombatantDTO } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CombatStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  // Find or create active session
  let session = await prisma.session.findFirst({
    where: { campaignId: d.campaignId, endedAt: null },
  });
  if (!session) {
    session = await prisma.session.create({ data: { campaignId: d.campaignId } });
  }

  const encounter = await prisma.combatEncounter.create({
    data: {
      campaignId: d.campaignId,
      sessionId: session.id,
      name: d.name ?? null,
      status: "active",
      round: 1,
      turnIndex: 0,
    },
  });

  const sorted = sortByInitiative(
    d.combatants.map<CombatantDTO>((c, i) => ({
      id: `c-${i}`,
      name: c.name,
      side: c.side,
      initiative: c.initiative,
      hp: c.hp,
      maxHp: c.maxHp,
      tempHp: 0,
      ac: c.ac,
      initMod: c.initMod,
      conditions: [],
      actionUsed: false,
      bonusUsed: false,
      reactionUsed: false,
      movementUsed: 0,
      speed: c.speed,
      isDead: false,
      characterId: c.characterId,
      npcId: c.npcId,
    })),
  );

  const combatants = await Promise.all(
    sorted.map((c, idx) =>
      prisma.combatant.create({
        data: {
          encounterId: encounter.id,
          name: c.name,
          side: c.side,
          initiative: c.initiative,
          initMod: c.initMod,
          hp: c.hp,
          maxHp: c.maxHp,
          ac: c.ac,
          speed: c.speed,
          conditions: JSON.stringify([]),
          characterId: c.characterId,
          npcId: c.npcId,
          statblock: JSON.stringify(c),
          order: idx,
        },
      }),
    ),
  );

  return NextResponse.json({ encounterId: encounter.id, combatants: combatants.length });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const encounterId = url.searchParams.get("encounterId");
  if (!encounterId) {
    return NextResponse.json({ error: "encounterId required" }, { status: 400 });
  }
  const enc = await prisma.combatEncounter.findUnique({
    where: { id: encounterId },
    include: { combatants: { orderBy: { order: "asc" } } },
  });
  if (!enc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    encounter: {
      id: enc.id,
      campaignId: enc.campaignId,
      name: enc.name,
      status: enc.status,
      round: enc.round,
      turnIndex: enc.turnIndex,
      combatants: enc.combatants.map((c) => ({
        id: c.id,
        name: c.name,
        side: c.side,
        initiative: c.initiative,
        hp: c.hp,
        maxHp: c.maxHp,
        tempHp: c.tempHp,
        ac: c.ac,
        initMod: c.initMod,
        speed: c.speed,
        conditions: safeJsonParse<string[]>(c.conditions, []),
        actionUsed: c.actionUsed,
        bonusUsed: c.bonusUsed,
        reactionUsed: c.reactionUsed,
        movementUsed: c.movementUsed,
        isDead: c.isDead,
        characterId: c.characterId,
        npcId: c.npcId,
      })),
    },
  });
}

