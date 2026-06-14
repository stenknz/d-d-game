import { NextResponse } from "next/server";
import { CharacterCreateSchema } from "@/lib/schemas";
import { characterRepo } from "@/db/repositories/campaigns";
import { profBonusForLevel } from "@/engine/rules";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }
  const characters = await characterRepo.listByCampaign(campaignId);
  return NextResponse.json({ characters });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CharacterCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const character = await characterRepo.create({
    campaignId: d.campaignId,
    name: d.name,
    species: d.species,
    class: d.class,
    subclass: d.subclass,
    background: d.background,
    alignment: d.alignment,
    level: d.level,
    xp: d.xp,
    profBonus: profBonusForLevel(d.level),
    abilityScores: d.abilityScores,
    hp: d.hp,
    maxHp: d.maxHp,
    ac: d.ac,
    initiativeMod: 0,
    speed: 30,
    skillProfs: d.skillProfs,
    saveProfs: d.saveProfs,
    feats: d.feats,
    notes: d.notes,
  });
  return NextResponse.json({ character }, { status: 201 });
}
