"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ABILITY_KEYS, type AbilityKey, type AbilityScores } from "@/lib/types";
import { useRouter } from "next/navigation";

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

const RACES = ["Human", "Elf", "Dwarf", "Halfling", "Gnome", "Tiefling", "Dragonborn", "Orc", "Half-Elf", "Half-Orc", "Goliath", "Aasimar"] as const;
const CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Artificer"] as const;

type Method = "standard" | "pointbuy" | "manual";

function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function startingClassHP(cls: string, conMod: number): number {
  const hit = cls === "Wizard" || cls === "Sorcerer" ? 6
    : cls === "Bard" || cls === "Cleric" || cls === "Druid" || cls === "Monk" || cls === "Rogue" || cls === "Warlock" || cls === "Artificer" ? 8
    : cls === "Fighter" || cls === "Paladin" || cls === "Ranger" ? 10
    : 12; // barbarian
  return hit + conMod;
}

export function CharacterCreator({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [species, setSpecies] = React.useState<string>(RACES[0]);
  const [klass, setKlass] = React.useState<string>(CLASSES[0]);
  const [method, setMethod] = React.useState<Method>("standard");
  const [scores, setScores] = React.useState<AbilityScores>(() => ({
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  }));
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Standard array assignment (drag-and-drop-less; we just click an ability then click a value)
  const [assigned, setAssigned] = React.useState<Record<AbilityKey, number | null>>({
    str: null, dex: null, con: null, int: null, wis: null, cha: null,
  });

  React.useEffect(() => {
    if (method === "standard") {
      setScores({ str: assigned.str ?? 10, dex: assigned.dex ?? 10, con: assigned.con ?? 10, int: assigned.int ?? 10, wis: assigned.wis ?? 10, cha: assigned.cha ?? 10 });
    } else if (method === "manual") {
      // leave as is
    } else {
      // point buy: scores already set
    }
  }, [method, assigned]);

  const conMod = abilityMod(scores.con);
  const maxHp = startingClassHP(klass, conMod);
  const used = ABILITY_KEYS.reduce((sum, k) => sum + (POINT_BUY_COSTS[scores[k]] ?? 0), 0);

  function setScore(k: AbilityKey, v: number) {
    if (method === "standard") {
      const current = assigned[k];
      if (current !== null) {
        // free up the previous slot
        const next = { ...assigned };
        for (const ak of ABILITY_KEYS) {
          if (next[ak] === current) next[ak] = null;
        }
        next[k] = v;
        setAssigned(next);
      } else {
        setAssigned({ ...assigned, [k]: v });
      }
    } else {
      setScores({ ...scores, [k]: v });
    }
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          name: name.trim(),
          species,
          class: klass,
          level: 1,
          xp: 0,
          abilityScores: scores,
          hp: maxHp,
          maxHp,
          ac: 10 + abilityMod(scores.dex),
          skillProfs: [],
          saveProfs: [],
          feats: [],
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error?.toString?.() ?? "failed");
      const { character } = await r.json();
      router.push(`/characters/${character.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lyra of Hollowbrook" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Species</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              >
                {RACES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <Label>Class</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={klass}
                onChange={(e) => setKlass(e.target.value)}
              >
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Ability method</Label>
            <div className="mt-1 flex gap-2">
              {(["standard", "pointbuy", "manual"] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={method === m ? "ember" : "outline"}
                  onClick={() => setMethod(m)}
                >
                  {m === "pointbuy" ? "Point buy" : m === "standard" ? "Standard array" : "Manual"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ability Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {method === "pointbuy" && (
            <p className="mb-2 text-xs text-muted-foreground">
              Budget: 27 points. Spent: {used}
            </p>
          )}
          {method === "standard" && (
            <div className="mb-3 flex flex-wrap gap-1">
              {STANDARD_ARRAY.map((v) => {
                const takenBy = ABILITY_KEYS.find((k) => assigned[k] === v);
                return (
                  <Button
                    key={v}
                    size="sm"
                    variant="outline"
                    disabled={takenBy !== undefined}
                    onClick={() => {
                      // Assign to first empty slot
                      const empty = ABILITY_KEYS.find((k) => assigned[k] === null);
                      if (empty) setAssigned({ ...assigned, [empty]: v });
                    }}
                  >
                    {v} {takenBy ? `→ ${takenBy.toUpperCase()}` : ""}
                  </Button>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {ABILITY_KEYS.map((k) => (
              <div key={k} className="flex items-center justify-between rounded border border-border p-2">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                  <div className="font-display text-lg">{scores[k]}</div>
                  <div className="text-xs text-muted-foreground">mod {abilityMod(scores[k]) >= 0 ? "+" : ""}{abilityMod(scores[k])}</div>
                </div>
                <div className="flex flex-col gap-1">
                  {method === "pointbuy" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setScore(k, Math.min(15, scores[k] + 1))}>+</Button>
                      <Button size="sm" variant="outline" onClick={() => setScore(k, Math.max(8, scores[k] - 1))}>-</Button>
                    </>
                  )}
                  {method === "manual" && (
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={scores[k]}
                      onChange={(e) => setScore(k, Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                      className="w-16"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div><span className="text-muted-foreground">HP:</span> {maxHp}</div>
            <div><span className="text-muted-foreground">AC:</span> {10 + abilityMod(scores.dex)}</div>
            <div><span className="text-muted-foreground">Prof:</span> +2</div>
            <div><span className="text-muted-foreground">Initiative:</span> {abilityMod(scores.dex) >= 0 ? "+" : ""}{abilityMod(scores.dex)}</div>
          </div>
          {err ? <p className="mt-3 text-sm text-destructive">{err}</p> : null}
          <div className="mt-4 flex justify-end">
            <Button variant="ember" disabled={!name.trim() || busy} onClick={submit}>
              {busy ? "Saving…" : "Create Character"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
