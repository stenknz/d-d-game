import { roll, type RollResult } from "@/engine/dice/roll";
import type { RandomFn } from "@/engine/dice/rng";
import { getMod, profBonusForLevel } from "./abilities";
import type { AbilityScores } from "@/lib/types";

export interface AttackContext {
  abilityScores: AbilityScores;
  level: number;
  proficient: boolean; // proficient with the weapon
  rng?: RandomFn;
}

export interface AttackResult {
  toHit: RollResult;
  hit: number; // toHit.total
  hitBonus: number;
  isCrit: boolean;
  isFumble: boolean;
  isHit: boolean;
  targetAc: number;
  damage?: RollResult;
  damageTotal?: number;
  damageType?: string;
}

export function attackRoll(
  ctx: AttackContext,
  target: { ac: number },
  damageNotation?: string,
  damageType: string = "slashing",
  opts: { useDex?: boolean; mode?: "none" | "advantage" | "disadvantage" } = {},
): AttackResult {
  const mode = opts.mode ?? "none";
  const notation = mode === "none" ? "1d20" : mode === "advantage" ? "1d20 dAdv" : "1d20 dDis";
  const toHit = roll(notation, { rng: ctx.rng });
  const prof = ctx.proficient ? profBonusForLevel(ctx.level) : 0;
  const ability = opts.useDex ? "dex" : "str";
  const abilMod = getMod(ctx.abilityScores, ability);
  const hitBonus = abilMod + prof;
  const hit = toHit.total + hitBonus;
  const isCrit = toHit.isCrit;
  const isFumble = toHit.isFumble;
  const isHit = isCrit ? true : isFumble ? false : hit >= target.ac;
  const result: AttackResult = {
    toHit,
    hit,
    hitBonus,
    isCrit,
    isFumble,
    isHit,
    targetAc: target.ac,
  };
  if (damageNotation && isHit) {
    const dmg = roll(damageNotation, { rng: ctx.rng });
    const total = isCrit ? dmg.total * 2 : dmg.total;
    result.damage = dmg;
    result.damageTotal = total;
    result.damageType = damageType;
  }
  return result;
}
