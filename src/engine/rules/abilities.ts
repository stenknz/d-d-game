import type { AbilityKey, AbilityScores, SkillKey } from "@/lib/types";
import { SKILL_ABILITY } from "@/lib/types";

/** Standard D&D 5.5e ability modifier: floor((score - 10) / 2). */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getAbility(scores: AbilityScores, key: AbilityKey): number {
  return scores[key];
}

export function getMod(scores: AbilityScores, key: AbilityKey): number {
  return abilityMod(getAbility(scores, key));
}

/** Proficiency bonus by total character level. */
export function profBonusForLevel(level: number): number {
  if (level < 1) return 2;
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

export function isSkillProficient(skillProfs: SkillKey[], skill: SkillKey): boolean {
  return skillProfs.includes(skill);
}

export function skillModifier(
  scores: AbilityScores,
  skill: SkillKey,
  profs: { skillProfs: SkillKey[]; profBonus: number },
  extras: { expertise?: SkillKey[] } = {},
): number {
  const base = getMod(scores, SKILL_ABILITY[skill]);
  if (extras.expertise?.includes(skill)) {
    return base + profs.profBonus * 2;
  }
  if (isSkillProficient(profs.skillProfs, skill)) {
    return base + profs.profBonus;
  }
  return base;
}

export function saveModifier(
  scores: AbilityScores,
  ability: AbilityKey,
  profs: { saveProfs: AbilityKey[]; profBonus: number },
): number {
  const base = getMod(scores, ability);
  return profs.saveProfs.includes(ability) ? base + profs.profBonus : base;
}

/** Spell save DC = 8 + profBonus + casting mod (handled by caller). */
export function spellSaveDc(profBonus: number, castingMod: number): number {
  return 8 + profBonus + castingMod;
}

/** Spell attack bonus = profBonus + casting mod. */
export function spellAttackBonus(profBonus: number, castingMod: number): number {
  return profBonus + castingMod;
}
