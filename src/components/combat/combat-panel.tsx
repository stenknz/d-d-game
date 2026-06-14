"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { roll } from "@/engine/dice";
import { applyDamage, applyHeal } from "@/engine/combat";
import type { CombatEncounterDTO, CharacterDTO, CombatantDTO } from "@/lib/types";

interface Props {
  campaignId: string;
  sessionId: string | null;
  characters: CharacterDTO[];
  encounter: CombatEncounterDTO | null;
  setEncounter: (e: CombatEncounterDTO | null) => void;
}

export function CombatPanel({ campaignId, sessionId, characters, encounter, setEncounter }: Props) {
  const [log, setLog] = React.useState<string[]>([]);
  const [enemyName, setEnemyName] = React.useState("Goblin");
  const [enemyHp, setEnemyHp] = React.useState(7);
  const [enemyAc, setEnemyAc] = React.useState(13);

  async function startEncounter() {
    if (characters.length === 0) return;
    type CombatantInput = {
      name: string;
      side: "pc" | "ally" | "enemy" | "neutral";
      initiative: number;
      hp: number;
      maxHp: number;
      ac: number;
      initMod: number;
      speed: number;
      characterId?: string;
    };
    const combatants: CombatantInput[] = characters.map((c) => {
      const init = roll("1d20+0").total + c.initiativeMod;
      return {
        name: c.name,
        side: "pc",
        initiative: init,
        hp: c.hp,
        maxHp: c.maxHp,
        ac: c.ac,
        initMod: c.initiativeMod,
        speed: c.speed,
        characterId: c.id,
      };
    });
    combatants.push({
      name: enemyName,
      side: "enemy",
      initiative: roll("1d20+2").total,
      hp: enemyHp,
      maxHp: enemyHp,
      ac: enemyAc,
      initMod: 2,
      speed: 30,
    });

    const r = await fetch("/api/combat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, sessionId: sessionId ?? undefined, name: `${enemyName} encounter`, combatants }),
    });
    if (!r.ok) return;
    const { encounterId } = await r.json();
    await refresh(encounterId as string);
    setLog((l) => [...l, `Encounter started with ${combatants.length} combatants.`]);
  }

  async function refresh(encounterId: string) {
    const r = await fetch(`/api/combat?encounterId=${encounterId}`);
    if (!r.ok) return;
    const { encounter } = await r.json();
    setEncounter(encounter);
  }

  async function nextTurn() {
    if (!encounter) return;
    const r = await fetch("/api/combat/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encounterId: encounter.id, action: "next" }),
    });
    if (!r.ok) return;
    const { encounter: next } = await r.json();
    setEncounter(next);
    setLog((l) => [...l, `Round ${next.round}, ${next.combatants[next.turnIndex]?.name}'s turn.`]);
  }

  async function endEncounter() {
    if (!encounter) return;
    await fetch("/api/combat/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encounterId: encounter.id, action: "end" }),
    });
    setLog((l) => [...l, "Encounter ended."]);
    setEncounter(null);
  }

  async function attackCurrent() {
    if (!encounter) return;
    const cur = encounter.combatants[encounter.turnIndex];
    const target = encounter.combatants.find((c) => c.id !== cur?.id && !c.isDead && c.side !== cur?.side);
    if (!cur || !target) return;
    // Use STR mod 0 for simplicity in the demo; a fuller UI would let you pick the attack.
    const r = roll("1d20+2");
    const hit = r.total >= target.ac;
    if (!hit) {
      setLog((l) => [...l, `${cur.name} attacks ${target.name}: [${r.rolls.join(",")}] misses (AC ${target.ac}).`]);
      return;
    }
    const dmg = roll("1d6+1");
    const next = applyDamage(target, dmg.total);
    await fetch("/api/combat/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ combatantId: target.id, action: "damage", amount: dmg.total }),
    });
    setLog((l) => [...l, `${cur.name} hits ${target.name} for ${dmg.total} damage.`]);
    if (next.isDead) setLog((l) => [...l, `${target.name} falls.`]);
    await refresh(encounter.id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Combat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!encounter ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Enemy</Label>
                <Input value={enemyName} onChange={(e) => setEnemyName(e.target.value)} />
              </div>
              <div>
                <Label>HP</Label>
                <Input type="number" value={enemyHp} onChange={(e) => setEnemyHp(Number(e.target.value) || 1)} />
              </div>
              <div>
                <Label>AC</Label>
                <Input type="number" value={enemyAc} onChange={(e) => setEnemyAc(Number(e.target.value) || 10)} />
              </div>
            </div>
            <Button variant="ember" onClick={startEncounter} disabled={characters.length === 0}>
              Start encounter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Round {encounter.round} · {encounter.status}
            </div>
            <div className="space-y-1">
              {encounter.combatants.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between rounded border p-2 text-sm ${
                    i === encounter.turnIndex ? "border-ember bg-accent" : "border-border"
                  }`}
                >
                  <div>
                    <div className="font-display">
                      {c.name} <span className="text-xs text-muted-foreground">init {c.initiative}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      HP {c.hp}/{c.maxHp} · AC {c.ac}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.isDead ? <Badge variant="danger">down</Badge> : null}
                    <Badge variant={c.side === "pc" ? "ember" : c.side === "enemy" ? "danger" : "secondary"}>{c.side}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ember" onClick={nextTurn}>Next turn</Button>
              <Button size="sm" variant="outline" onClick={attackCurrent}>Attack (auto)</Button>
              <Button size="sm" variant="outline" onClick={endEncounter}>End</Button>
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="mt-3 max-h-40 overflow-y-auto rounded border border-border bg-background/40 p-2 font-mono text-xs">
            {log.slice(-20).map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
