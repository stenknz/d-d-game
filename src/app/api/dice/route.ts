import { NextResponse } from "next/server";
import { DiceRollSchema } from "@/lib/schemas";
import { formatRoll, roll } from "@/engine/dice";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = DiceRollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const r = roll(parsed.data.notation, { purpose: parsed.data.purpose });
    return NextResponse.json({
      notation: r.expr.raw,
      rolls: r.rolls,
      kept: r.kept,
      dropped: r.dropped,
      modifier: r.modifier,
      total: r.total,
      isCrit: r.isCrit,
      isFumble: r.isFumble,
      formatted: formatRoll(r),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "roll_failed" },
      { status: 400 },
    );
  }
}
