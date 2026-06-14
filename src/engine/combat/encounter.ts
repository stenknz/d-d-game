import type { CombatantDTO, CombatEncounterDTO } from "@/lib/types";

export type EncounterStatus = "idle" | "rolling" | "active" | "ended";

export interface EncounterInit {
  id: string;
  campaignId: string;
  name?: string | null;
  status: EncounterStatus;
  round: number;
  turnIndex: number;
}

export function sortByInitiative(combatants: CombatantDTO[]): CombatantDTO[] {
  return [...combatants].sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    // Tie-breaker: higher DEX mod first, then alphabetical
    const aDex = a.initMod ?? 0;
    const bDex = b.initMod ?? 0;
    if (bDex !== aDex) return bDex - aDex;
    return a.name.localeCompare(b.name);
  });
}

export function startEncounter(init: EncounterInit, combatants: CombatantDTO[]): CombatEncounterDTO {
  if (combatants.length === 0) {
    throw new Error("Cannot start encounter with no combatants");
  }
  const ordered = sortByInitiative(combatants);
  return {
    id: init.id,
    campaignId: init.campaignId,
    name: init.name ?? null,
    status: "active",
    round: 1,
    turnIndex: 0,
    combatants: ordered,
  };
}

export function endEncounter(enc: CombatEncounterDTO): CombatEncounterDTO {
  return { ...enc, status: "ended" };
}

export function nextTurn(enc: CombatEncounterDTO): CombatEncounterDTO {
  if (enc.status !== "active") throw new Error("Encounter not active");
  const alive = enc.combatants.filter((c) => !c.isDead);
  if (alive.length === 0) {
    return { ...enc, status: "ended" };
  }
  let nextIndex = enc.turnIndex + 1;
  let nextRound = enc.round;
  if (nextIndex >= enc.combatants.length) {
    nextIndex = 0;
    nextRound = enc.round + 1;
  }
  // Skip dead combatants at the top of the round
  while (enc.combatants[nextIndex]?.isDead) {
    nextIndex++;
    if (nextIndex >= enc.combatants.length) {
      nextIndex = 0;
      nextRound++;
    }
  }
  return resetActionEconomy({
    ...enc,
    round: nextRound,
    turnIndex: nextIndex,
  });
}

export function resetActionEconomy(enc: CombatEncounterDTO): CombatEncounterDTO {
  return {
    ...enc,
    combatants: enc.combatants.map((c) =>
      c.isDead
        ? c
        : { ...c, actionUsed: false, bonusUsed: false, reactionUsed: false, movementUsed: 0 },
    ),
  };
}

/**
 * Snapshot/restore the per-turn action economy state for each combatant.
 * `prev` rewind restores the most recent snapshot, so an action used
 * during round 2 turn 1 cannot be reused on round 1 turn 1.
 */
export interface ActionEconomySnapshot {
  turnIndex: number;
  round: number;
  perCombatant: Record<string, Pick<CombatantDTO, "actionUsed" | "bonusUsed" | "reactionUsed" | "movementUsed" | "hp" | "tempHp" | "isDead" | "conditions">>;
}

export function snapshotActionEconomy(enc: CombatEncounterDTO): ActionEconomySnapshot {
  const perCombatant: ActionEconomySnapshot["perCombatant"] = {};
  for (const c of enc.combatants) {
    perCombatant[c.id] = {
      actionUsed: c.actionUsed,
      bonusUsed: c.bonusUsed,
      reactionUsed: c.reactionUsed,
      movementUsed: c.movementUsed,
      hp: c.hp,
      tempHp: c.tempHp,
      isDead: c.isDead,
      conditions: c.conditions,
    };
  }
  return { turnIndex: enc.turnIndex, round: enc.round, perCombatant };
}

export function restoreActionEconomy(
  enc: CombatEncounterDTO,
  snap: ActionEconomySnapshot,
): CombatEncounterDTO {
  return {
    ...enc,
    round: snap.round,
    turnIndex: snap.turnIndex,
    combatants: enc.combatants.map((c) => {
      const s = snap.perCombatant[c.id];
      return s
        ? {
            ...c,
            actionUsed: s.actionUsed,
            bonusUsed: s.bonusUsed,
            reactionUsed: s.reactionUsed,
            movementUsed: s.movementUsed,
            hp: s.hp,
            tempHp: s.tempHp,
            isDead: s.isDead,
            conditions: s.conditions,
          }
        : c;
    }),
  };
}

export function currentCombatant(enc: CombatEncounterDTO): CombatantDTO | null {
  if (enc.status !== "active") return null;
  return enc.combatants[enc.turnIndex] ?? null;
}

export function applyDamage(c: CombatantDTO, amount: number): CombatantDTO {
  if (amount <= 0) return c;
  let remaining = amount;
  let tempHp = c.tempHp;
  if (tempHp > 0) {
    const absorbed = Math.min(tempHp, remaining);
    tempHp -= absorbed;
    remaining -= absorbed;
  }
  const hp = Math.max(0, c.hp - remaining);
  return { ...c, tempHp, hp, isDead: hp === 0 };
}

export function applyHeal(c: CombatantDTO, amount: number): CombatantDTO {
  if (amount <= 0) return c;
  return { ...c, hp: Math.min(c.maxHp, c.hp + amount), isDead: false };
}

export function addCondition(c: CombatantDTO, condition: string): CombatantDTO {
  if (c.conditions.includes(condition)) return c;
  return { ...c, conditions: [...c.conditions, condition] };
}

export function removeCondition(c: CombatantDTO, condition: string): CombatantDTO {
  return { ...c, conditions: c.conditions.filter((x) => x !== condition) };
}

/**
 * Narrower helpers that operate only on the fields the engine reads.
 * Use these from API routes that hold partial combatant objects so the
 * type-checker keeps you honest about which fields actually matter.
 */
export interface HPOnly {
  hp: number;
  tempHp: number;
  maxHp: number;
  isDead: boolean;
}

export function applyDamageToHP(c: HPOnly, amount: number): HPOnly {
  if (amount <= 0) return c;
  let remaining = amount;
  let tempHp = c.tempHp;
  if (tempHp > 0) {
    const absorbed = Math.min(tempHp, remaining);
    tempHp -= absorbed;
    remaining -= absorbed;
  }
  const hp = Math.max(0, c.hp - remaining);
  return { ...c, tempHp, hp, isDead: hp === 0 };
}

export function applyHealToHP(c: HPOnly, amount: number): HPOnly {
  if (amount <= 0) return c;
  return { ...c, hp: Math.min(c.maxHp, c.hp + amount), isDead: false };
}
