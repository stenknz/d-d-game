import { NextResponse } from "next/server";
import { DMActionSchema } from "@/lib/schemas";
import { prisma } from "@/db/client";
import { safeJsonParse } from "@/lib/utils";
import { abilityCheck, attackRoll, savingThrow, skillCheck } from "@/engine/rules";
import { formatRoll, roll } from "@/engine/dice";
import type { AITurnOutput, MessageDTO } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = DMActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (!d.characterId) {
    return NextResponse.json({ error: "characterId required" }, { status: 400 });
  }
  const char = await prisma.character.findUnique({ where: { id: d.characterId } });
  if (!char) {
    return NextResponse.json({ error: "character_not_found" }, { status: 404 });
  }
  const abilityScores = safeJsonParse(char.abilityScores, {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  });
  const skillProfs = safeJsonParse<string[]>(char.skillProfs, []);
  const saveProfs = safeJsonParse<string[]>(char.saveProfs, []);
  const ctx = {
    abilityScores,
    level: char.level,
    skillProfs: skillProfs as never,
    saveProfs: saveProfs as never,
  };

  // Death save lifecycle
  if (d.action === "deathSave") {
    const r = roll("1d20", { purpose: "death save" });
    let s = char.deathSuccess;
    let f = char.deathFail;
    if (r.total >= 10) s = Math.min(3, s + 1);
    else f = Math.min(3, f + 1);
    const stabilized = s >= 3;
    const dead = f >= 3;
    const updates: Record<string, unknown> = { deathSuccess: s, deathFail: f };
    if (stabilized) updates.conditions = JSON.stringify([...(safeJsonParse<string[]>(char.conditions, [])), "stable"]);
    if (dead) updates.isAlive = false;
    await prisma.character.update({ where: { id: char.id }, data: updates });
    return NextResponse.json({
      ok: true,
      roll: { total: r.total, rolls: r.rolls, formatted: formatRoll(r) },
      deathSave: { success: s, fail: f, stabilized, dead },
    });
  }

  // Short rest
  if (d.action === "shortRest") {
    // Spend hit dice up to level; recover 1 hit die roll worth of HP
    const hd = Math.max(1, char.level);
    const r = roll(`${hd}d${hitDieSize(char.class)}+${abilityScores.con}`);
    const newHp = Math.min(char.maxHp, char.hp + Math.max(0, r.total));
    await prisma.character.update({ where: { id: char.id }, data: { hp: newHp } });
    return NextResponse.json({
      ok: true,
      restType: "short",
      hitDiceRolled: hd,
      roll: { total: r.total, rolls: r.rolls, formatted: formatRoll(r) },
      newHp,
    });
  }

  // Long rest
  if (d.action === "longRest") {
    // Full HP, reset slots, conditions cleared (caller can restore per-class)
    await prisma.character.update({
      where: { id: char.id },
      data: { hp: char.maxHp, conditions: JSON.stringify([]) },
    });
    return NextResponse.json({ ok: true, restType: "long", newHp: char.maxHp });
  }

  // Skill / ability check / save
  if (d.action === "skillCheck") {
    if (!d.skill) return NextResponse.json({ error: "skill required" }, { status: 400 });
    const r = skillCheck(ctx, d.skill, { dc: d.dc, mode: d.advantage });
    return NextResponse.json({ ok: true, type: "skillCheck", result: r });
  }
  if (d.action === "abilityCheck") {
    if (!d.ability) return NextResponse.json({ error: "ability required" }, { status: 400 });
    const r = abilityCheck(ctx, d.ability, { dc: d.dc, mode: d.advantage });
    return NextResponse.json({ ok: true, type: "abilityCheck", result: r });
  }
  if (d.action === "savingThrow") {
    if (!d.ability) return NextResponse.json({ error: "ability required" }, { status: 400 });
    const r = savingThrow(ctx, d.ability, { dc: d.dc, mode: d.advantage });
    return NextResponse.json({ ok: true, type: "savingThrow", result: r });
  }
  if (d.action === "attack") {
    if (!d.target) return NextResponse.json({ error: "target required" }, { status: 400 });
    const weapon = d.weapon ?? { useDex: false, proficient: true };
    const r = attackRoll(
      { abilityScores, level: char.level, proficient: weapon.proficient },
      { ac: d.target.ac },
      d.damage?.notation,
      d.damage?.damageType ?? "slashing",
      { useDex: weapon.useDex },
    );
    return NextResponse.json({ ok: true, type: "attack", result: r });
  }

  return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
}

function hitDieSize(cls: string): number {
  const c = cls.toLowerCase();
  if (c.includes("wizard") || c.includes("sorcerer")) return 6;
  if (c.includes("rogue") || c.includes("artificer") || c.includes("monk")) return 8;
  if (c.includes("fighter") || c.includes("paladin") || c.includes("ranger") || c.includes("bard")) return 10;
  if (c.includes("druid") || c.includes("cleric")) return 8;
  return 8;
}

export function GET() {
  return NextResponse.json({
    note: "POST to perform a rule-bound action. Resolves dice server-side.",
    example: {
      campaignId: "string",
      characterId: "string",
      action: "skillCheck | abilityCheck | savingThrow | attack | deathSave | shortRest | longRest",
    },
  });
  // keep types referenced
  const _a: AITurnOutput = { narration: "", effects: [] };
  const _m: MessageDTO = {
    id: "x",
    role: "dm",
    kind: "text",
    content: "",
    createdAt: new Date().toISOString(),
  };
  void _a;
  void _m;
}
