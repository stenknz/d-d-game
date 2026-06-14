import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/db/client";
import { safeJsonParse } from "@/lib/utils";
import {
  applyDamageToHP,
  applyHealToHP,
  type HPOnly,
} from "@/engine/combat";

const Schema = z.object({
  combatantId: z.string().min(1),
  action: z.enum(["damage", "heal", "addCondition", "removeCondition"]),
  amount: z.number().int().min(0).optional(),
  condition: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const c = await prisma.combatant.findUnique({ where: { id: parsed.data.combatantId } });
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let conditions = safeJsonParse<string[]>(c.conditions, []);
  let hpState: HPOnly = { hp: c.hp, tempHp: c.tempHp, maxHp: c.maxHp, isDead: c.isDead };

  if (parsed.data.action === "damage") {
    hpState = applyDamageToHP(hpState, parsed.data.amount ?? 0);
  } else if (parsed.data.action === "heal") {
    hpState = applyHealToHP(hpState, parsed.data.amount ?? 0);
  } else if (parsed.data.action === "addCondition" && parsed.data.condition) {
    if (!conditions.includes(parsed.data.condition)) {
      conditions = [...conditions, parsed.data.condition];
    }
  } else if (parsed.data.action === "removeCondition" && parsed.data.condition) {
    conditions = conditions.filter((x) => x !== parsed.data.condition);
  }

  await prisma.combatant.update({
    where: { id: c.id },
    data: {
      hp: hpState.hp,
      tempHp: hpState.tempHp,
      isDead: hpState.isDead,
      conditions: JSON.stringify(conditions),
    },
  });
  return NextResponse.json({ ok: true, combatant: { ...hpState, conditions } });
}
