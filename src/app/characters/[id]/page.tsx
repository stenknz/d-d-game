import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse, formatModifier } from "@/lib/utils";
import type { CharacterDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.character.findUnique({ where: { id } });
  if (!row) notFound();
  const char: CharacterDTO = {
    ...row,
    abilityScores: safeJsonParse(row.abilityScores, { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
    skillProfs: safeJsonParse(row.skillProfs, []),
    saveProfs: safeJsonParse(row.saveProfs, []),
    conditions: safeJsonParse(row.conditions, []),
    spellSlots: safeJsonParse(row.spellSlots, {}),
    feats: safeJsonParse(row.feats, []),
    // legacy fields: number getters don't exist on DTO; coerce
  } as unknown as CharacterDTO;
  const a = char.abilityScores;
  return (
    <main className="container mx-auto max-w-4xl py-10">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl">{char.name}</h1>
          <p className="text-muted-foreground">Level {char.level} {char.species} {char.class}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-display text-ember">{char.hp}<span className="text-base text-muted-foreground">/{char.maxHp}</span></div>
          <div className="text-sm text-muted-foreground">HP</div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ability Scores</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(["str","dex","con","int","wis","cha"] as const).map((k) => (
                <div key={k} className="rounded border border-border p-3 text-center">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                  <div className="font-display text-2xl">{a[k]}</div>
                  <div className="text-sm text-muted-foreground">{formatModifier(abilityMod(a[k]))}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Combat</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>AC</span><span className="font-display">{char.ac}</span></div>
            <div className="flex justify-between"><span>Initiative</span><span className="font-display">{formatModifier(char.initiativeMod)}</span></div>
            <div className="flex justify-between"><span>Speed</span><span className="font-display">{char.speed} ft</span></div>
            <div className="flex justify-between"><span>Proficiency</span><span className="font-display">+{char.profBonus}</span></div>
            {char.conditions.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {char.conditions.map((c) => <Badge key={c} variant="ember">{c}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
