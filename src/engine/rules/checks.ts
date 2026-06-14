import type { RandomFn } from "@/engine/dice/rng";
import { roll, type RollResult } from "@/engine/dice/roll";
import type { AbilityKey, AbilityScores, SkillKey } from "@/lib/types";
import { SKILL_ABILITY } from "@/lib/types";
import { getMod, profBonusForLevel, skillModifier } from "./abilities";

export type RollMode = "none" | "advantage" | "disadvantage";

export interface CheckContext {
  abilityScores: AbilityScores;
  level: number;
  skillProfs: SkillKey[];
  saveProfs: AbilityKey[];
  expertise?: SkillKey[];
  rng?: RandomFn;
}

export interface CheckResult {
  roll: RollResult;
  ability: AbilityKey;
  skill?: SkillKey;
  modifier: number;
  /** Total = roll total + modifier. Exposed at the top level for ergonomics. */
  total: number;
  dc?: number;
  success?: boolean;
  label: string;
}

export function abilityCheck(
  ctx: CheckContext,
  ability: AbilityKey,
  opts: { dc?: number; mode?: RollMode; label?: string; rng?: RandomFn } = {},
): CheckResult {
  const mode = opts.mode ?? "none";
  const notation =
    mode === "none" ? "1d20" : mode === "advantage" ? "1d20 dAdv" : "1d20 dDis";
  const r = roll(notation, { rng: opts.rng ?? ctx.rng });
  const mod = getMod(ctx.abilityScores, ability);
  const total = r.total + mod;
  return {
    roll: { ...r, total, modifier: mod },
    ability,
    modifier: mod,
    total,
    dc: opts.dc,
    success: opts.dc === undefined ? undefined : total >= opts.dc,
    label: opts.label ?? `${ability.toUpperCase()} check`,
  };
}

export function skillCheck(
  ctx: CheckContext,
  skill: SkillKey,
  opts: { dc?: number; mode?: RollMode; label?: string; rng?: RandomFn } = {},
): CheckResult {
  const mode = opts.mode ?? "none";
  const notation = mode === "none" ? "1d20" : mode === "advantage" ? "1d20 dAdv" : "1d20 dDis";
  const r = roll(notation, { rng: opts.rng ?? ctx.rng });
  const mod = skillModifier(
    ctx.abilityScores,
    skill,
    { skillProfs: ctx.skillProfs, profBonus: profBonusForLevel(ctx.level) },
    { expertise: ctx.expertise },
  );
  const total = r.total + mod;
  return {
    roll: { ...r, total, modifier: mod },
    ability: SKILL_ABILITY[skill],
    skill,
    modifier: mod,
    total,
    dc: opts.dc,
    success: opts.dc === undefined ? undefined : total >= opts.dc,
    label: opts.label ?? `${skill} check`,
  };
}

export function savingThrow(
  ctx: CheckContext,
  ability: AbilityKey,
  opts: { dc?: number; mode?: RollMode; label?: string; rng?: RandomFn } = {},
): CheckResult {
  const mode = opts.mode ?? "none";
  const notation = mode === "none" ? "1d20" : mode === "advantage" ? "1d20 dAdv" : "1d20 dDis";
  const r = roll(notation, { rng: opts.rng ?? ctx.rng });
  const prof = profBonusForLevel(ctx.level);
  const mod = getMod(ctx.abilityScores, ability) + (ctx.saveProfs.includes(ability) ? prof : 0);
  const total = r.total + mod;
  return {
    roll: { ...r, total, modifier: mod },
    ability,
    modifier: mod,
    total,
    dc: opts.dc,
    success: opts.dc === undefined ? undefined : total >= opts.dc,
    label: opts.label ?? `${ability.toUpperCase()} save`,
  };
}
