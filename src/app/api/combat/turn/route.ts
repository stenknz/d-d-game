import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/db/client";
import { nextTurn, restoreActionEconomy, snapshotActionEconomy } from "@/engine/combat";
import type { CombatEncounterDTO, CombatantDTO } from "@/lib/types";

const Schema = z.object({
  encounterId: z.string().min(1),
  action: z.enum(["next", "prev", "end"]),
});

async function loadEncounter(encounterId: string) {
  const enc = await prisma.combatEncounter.findUnique({
    where: { id: encounterId },
    include: { combatants: { orderBy: { order: "asc" } } },
  });
  if (!enc) return null;
  return enc;
}

function toDTO(enc: NonNullable<Awaited<ReturnType<typeof loadEncounter>>>): CombatEncounterDTO {
  return {
    id: enc.id,
    campaignId: enc.campaignId,
    name: enc.name,
    status: enc.status as CombatEncounterDTO["status"],
    round: enc.round,
    turnIndex: enc.turnIndex,
    combatants: enc.combatants.map<CombatantDTO>((c) => ({
      id: c.id,
      name: c.name,
      side: c.side as CombatantDTO["side"],
      initiative: c.initiative,
      hp: c.hp,
      maxHp: c.maxHp,
      tempHp: c.tempHp,
      ac: c.ac,
      initMod: c.initMod,
      conditions: JSON.parse(c.conditions) as string[],
      actionUsed: c.actionUsed,
      bonusUsed: c.bonusUsed,
      reactionUsed: c.reactionUsed,
      movementUsed: c.movementUsed,
      speed: c.speed,
      isDead: c.isDead,
      characterId: c.characterId,
      npcId: c.npcId,
    })),
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const enc = await loadEncounter(parsed.data.encounterId);
  if (!enc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let dto = toDTO(enc);

  if (parsed.data.action === "end") {
    await prisma.combatEncounter.update({
      where: { id: enc.id },
      data: { status: "ended", endedAt: new Date() },
    });
    await prisma.actionEconomySnapshot.deleteMany({ where: { encounterId: enc.id } });
    return NextResponse.json({ ok: true, status: "ended" });
  }

  if (parsed.data.action === "next") {
    // Snapshot the current (about-to-leave) turn so a future "prev" can restore it.
    const snap = snapshotActionEconomy(dto);
    await prisma.actionEconomySnapshot.upsert({
      where: { encounterId_round_turnIndex: { encounterId: enc.id, round: snap.round, turnIndex: snap.turnIndex } },
      update: { payload: JSON.stringify(snap) },
      create: {
        encounterId: enc.id,
        turnIndex: snap.turnIndex,
        round: snap.round,
        payload: JSON.stringify(snap),
      },
    });
    dto = nextTurn(dto);
  } else if (parsed.data.action === "prev") {
    // Find the most recent snapshot before the current (turnIndex, round).
    const candidates = await prisma.actionEconomySnapshot.findMany({
      where: { encounterId: enc.id },
      orderBy: [{ round: "desc" }, { turnIndex: "desc" }],
    });
    // current position is (dto.round, dto.turnIndex); pick the first entry strictly before it
    // in turn order, wrapping to previous round.
    const curKey = (r: number, ti: number) => r * 10000 + ti;
    const target = candidates.find((s) => curKey(s.round, s.turnIndex) < curKey(dto.round, dto.turnIndex));
    if (target) {
      const snap = JSON.parse(target.payload);
      dto = restoreActionEconomy(dto, snap);
    } else {
      // Nothing earlier on record; just step back without restoring state.
      let ti = dto.turnIndex - 1;
      let rd = dto.round;
      if (ti < 0) {
        ti = dto.combatants.length - 1;
        rd = Math.max(1, rd - 1);
      }
      dto = { ...dto, turnIndex: ti, round: rd };
    }
  }

  await prisma.$transaction([
    prisma.combatEncounter.update({
      where: { id: enc.id },
      data: { round: dto.round, turnIndex: dto.turnIndex, status: dto.status },
    }),
    ...dto.combatants.map((c) =>
      prisma.combatant.update({
        where: { id: c.id },
        data: {
          hp: c.hp,
          tempHp: c.tempHp,
          isDead: c.isDead,
          actionUsed: c.actionUsed,
          bonusUsed: c.bonusUsed,
          reactionUsed: c.reactionUsed,
          movementUsed: c.movementUsed,
          conditions: JSON.stringify(c.conditions),
        },
      }),
    ),
  ]);

  return NextResponse.json({ encounter: dto });
}
