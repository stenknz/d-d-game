import { describe, expect, it } from "vitest";
import {
  addCondition,
  applyDamage,
  applyHeal,
  currentCombatant,
  endEncounter,
  nextTurn,
  removeCondition,
  resetActionEconomy,
  sortByInitiative,
  startEncounter,
} from "@/engine/combat";
import type { CombatEncounterDTO } from "@/lib/types";

const baseEncounter = {
  id: "enc1",
  campaignId: "c1",
  name: "Test",
  status: "idle" as const,
  round: 0,
  turnIndex: 0,
};

function mkCombatant(
  id: string,
  initiative: number,
  overrides: Partial<CombatEncounterDTO["combatants"][number]> = {},
): CombatEncounterDTO["combatants"][number] {
  return {
    id,
    name: id,
    side: "enemy",
    initiative,
    hp: 10,
    maxHp: 10,
    tempHp: 0,
    ac: 12,
    initMod: 0,
    conditions: [],
    actionUsed: false,
    bonusUsed: false,
    reactionUsed: false,
    movementUsed: 0,
    speed: 30,
    isDead: false,
    ...overrides,
  };
}

describe("sortByInitiative", () => {
  it("orders by initiative desc, then by DEX mod, then alphabetical", () => {
    const a = mkCombatant("alice", 10, { initMod: 0 });
    const b = mkCombatant("bob", 10, { initMod: 2 });
    const c = mkCombatant("carl", 15);
    const sorted = sortByInitiative([a, b, c]);
    expect(sorted.map((x) => x.id)).toEqual(["carl", "bob", "alice"]);
  });
});

describe("startEncounter", () => {
  it("starts with round 1, turn 0, sorted", () => {
    const enc = startEncounter(baseEncounter, [
      mkCombatant("a", 5),
      mkCombatant("b", 20),
    ]);
    expect(enc.round).toBe(1);
    expect(enc.turnIndex).toBe(0);
    expect(enc.combatants[0]!.name).toBe("b");
    expect(enc.status).toBe("active");
  });

  it("rejects empty combatants", () => {
    expect(() => startEncounter(baseEncounter, [])).toThrow();
  });
});

describe("turn advancement", () => {
  it("cycles turn and increments round", () => {
    let enc = startEncounter(baseEncounter, [
      mkCombatant("a", 5),
      mkCombatant("b", 20),
    ]);
    enc = nextTurn(enc);
    expect(enc.turnIndex).toBe(1);
    expect(enc.round).toBe(1);
    enc = nextTurn(enc);
    expect(enc.turnIndex).toBe(0);
    expect(enc.round).toBe(2);
  });

  it("skips dead combatants", () => {
    let enc = startEncounter(baseEncounter, [
      mkCombatant("a", 20),
      mkCombatant("b", 15, { isDead: true, hp: 0 }),
      mkCombatant("c", 10),
    ]);
    enc = nextTurn(enc);
    expect(enc.combatants[enc.turnIndex]!.id).toBe("c");
  });

  it("ends when everyone is dead", () => {
    let enc = startEncounter(baseEncounter, [
      mkCombatant("a", 20, { isDead: true, hp: 0 }),
      mkCombatant("b", 15, { isDead: true, hp: 0 }),
    ]);
    enc = nextTurn(enc);
    expect(enc.status).toBe("ended");
  });
});

describe("currentCombatant", () => {
  it("returns the active combatant", () => {
    const enc = startEncounter(baseEncounter, [mkCombatant("a", 10)]);
    expect(currentCombatant(enc)?.id).toBe("a");
  });

  it("returns null when not active", () => {
    expect(currentCombatant({ ...baseEncounter, status: "ended" } as CombatEncounterDTO)).toBeNull();
  });
});

describe("damage/heal", () => {
  it("applies damage and marks dead at 0 hp", () => {
    const c = applyDamage(mkCombatant("a", 10), 15);
    expect(c.hp).toBe(0);
    expect(c.isDead).toBe(true);
  });

  it("temp hp absorbs damage first", () => {
    const c = applyDamage(mkCombatant("a", 10, { tempHp: 5 }), 12);
    expect(c.tempHp).toBe(0);
    expect(c.hp).toBe(3);
    expect(c.isDead).toBe(false);
  });

  it("heal respects maxHp", () => {
    const c = applyHeal(mkCombatant("a", 10, { hp: 2 }), 100);
    expect(c.hp).toBe(10);
  });

  it("conditions add/remove uniquely", () => {
    const c = addCondition(mkCombatant("a", 10), "poisoned");
    const c2 = addCondition(c, "poisoned");
    expect(c2.conditions.length).toBe(1);
    const c3 = removeCondition(c2, "poisoned");
    expect(c3.conditions.length).toBe(0);
  });
});

describe("action economy", () => {
  it("resets at the start of each turn", () => {
    let enc = startEncounter(baseEncounter, [
      mkCombatant("a", 20, { actionUsed: true, bonusUsed: true, movementUsed: 30 }),
    ]);
    enc = nextTurn(enc); // round 1 -> 2, back to a
    enc = resetActionEconomy(enc);
    const a = currentCombatant(enc)!;
    expect(a.actionUsed).toBe(false);
    expect(a.bonusUsed).toBe(false);
    expect(a.movementUsed).toBe(0);
  });
});

describe("endEncounter", () => {
  it("sets status to ended", () => {
    const enc = startEncounter(baseEncounter, [mkCombatant("a", 10)]);
    expect(endEncounter(enc).status).toBe("ended");
  });
});
