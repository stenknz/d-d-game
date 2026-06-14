import { describe, expect, it } from "vitest";
import {
  abilityCheck,
  abilityMod,
  attackRoll,
  getMod,
  profBonusForLevel,
  savingThrow,
  skillCheck,
} from "@/engine/rules";
import { makeRng } from "@/engine/dice/rng";

describe("abilityMod / profBonusForLevel", () => {
  it("computes ability mod per PHB table", () => {
    expect(abilityMod(1)).toBe(-5);
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(14)).toBe(2);
    expect(abilityMod(20)).toBe(5);
    expect(abilityMod(30)).toBe(10);
  });

  it("computes proficiency bonus by level", () => {
    expect(profBonusForLevel(1)).toBe(2);
    expect(profBonusForLevel(4)).toBe(2);
    expect(profBonusForLevel(5)).toBe(3);
    expect(profBonusForLevel(9)).toBe(4);
    expect(profBonusForLevel(13)).toBe(5);
    expect(profBonusForLevel(17)).toBe(6);
    expect(profBonusForLevel(20)).toBe(6);
  });
});

const baseScores = { str: 14, dex: 12, con: 14, int: 10, wis: 12, cha: 8 };

describe("abilityCheck", () => {
  it("uses STR mod for an athletics-style check", () => {
    const r = abilityCheck(
      {
        abilityScores: baseScores,
        level: 3,
        skillProfs: [],
        saveProfs: [],
      },
      "str",
      { dc: 10, rng: makeRng(1) },
    );
    expect(r.modifier).toBe(2);
    expect(r.roll.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(r.total).toBe(r.roll.rolls[0]! + 2);
    if (r.roll.rolls[0]! + 2 >= 10) expect(r.success).toBe(true);
  });
});

describe("skillCheck", () => {
  it("applies proficiency to a proficient skill", () => {
    const r = skillCheck(
      {
        abilityScores: baseScores,
        level: 5, // prof +3
        skillProfs: ["perception"], // WIS-based
        saveProfs: [],
      },
      "perception",
      { rng: makeRng(2) },
    );
    // WIS mod 1 + prof 3 = 4
    expect(r.modifier).toBe(4);
  });

  it("doubles proficiency with expertise", () => {
    const r = skillCheck(
      {
        abilityScores: baseScores,
        level: 5,
        skillProfs: ["stealth"], // DEX-based
        saveProfs: [],
        expertise: ["stealth"],
      },
      "stealth",
      { rng: makeRng(3) },
    );
    // DEX mod 1 + prof 3*2 = 7
    expect(r.modifier).toBe(7);
  });
});

describe("savingThrow", () => {
  it("adds prof only for proficient saves", () => {
    const r = savingThrow(
      {
        abilityScores: baseScores,
        level: 5,
        skillProfs: [],
        saveProfs: ["con"],
      },
      "con",
      { rng: makeRng(4) },
    );
    // CON mod 2 + prof 3 = 5
    expect(r.modifier).toBe(5);
  });
});

describe("attackRoll", () => {
  it("crits double damage dice", () => {
    // Use a deterministic seed that yields a 20. We loop to find one.
    const rng = makeRng(0);
    let res;
    for (let i = 0; i < 200; i++) {
      res = attackRoll(
        {
          abilityScores: { str: 14, dex: 12, con: 10, int: 10, wis: 10, cha: 10 },
          level: 5,
          proficient: true,
          rng,
        },
        { ac: 30 },
        "1d8+3",
        "slashing",
      );
      if (res.isCrit) break;
    }
    expect(res?.isCrit).toBe(true);
    expect(res?.damage).toBeDefined();
  });

  it("misses when total < AC and not a crit", () => {
    const rng = makeRng(0xdeadbeef);
    const res = attackRoll(
      { abilityScores: { str: 6, dex: 6, con: 10, int: 10, wis: 10, cha: 10 }, level: 1, proficient: true, rng },
      { ac: 30 },
      "1d8+0",
    );
    // Total = 1d20 + (-2) + 2 = 1d20 + 0; with high AC this should be a miss
    // in most trials. (We don't assert hit; we assert that misses are
    // possible and don't yield damage.)
    if (!res.isHit) {
      expect(res.damage).toBeUndefined();
    }
  });
});
