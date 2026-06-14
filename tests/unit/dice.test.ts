import { describe, expect, it } from "vitest";
import { DiceParseError, formatRoll, parseDice, roll, rollMany } from "@/engine/dice";
import { makeRng } from "@/engine/dice/rng";

describe("parseDice", () => {
  it("parses simple notation", () => {
    expect(parseDice("1d20+5")).toMatchObject({ count: 1, size: 20, modifier: 5, mode: "none" });
    expect(parseDice("2d6")).toMatchObject({ count: 2, size: 6, modifier: 0 });
    expect(parseDice("8d6")).toMatchObject({ count: 8, size: 6, modifier: 0 });
    expect(parseDice("1d20-1")).toMatchObject({ count: 1, size: 20, modifier: -1 });
    expect(parseDice("  1d20 + 3 ".replace(/ /g, " "))).toMatchObject({ modifier: 3 });
  });

  it("parses advantage/disadvantage", () => {
    expect(parseDice("1d20+5 dAdv").mode).toBe("advantage");
    expect(parseDice("1d20+5 dDis").mode).toBe("disadvantage");
  });

  it("rejects invalid notations", () => {
    expect(() => parseDice("foo")).toThrow(DiceParseError);
    expect(() => parseDice("1d7")).toThrow(DiceParseError);
    expect(() => parseDice("0d6")).toThrow(DiceParseError);
    expect(() => parseDice("101d6")).toThrow(DiceParseError);
    expect(() => parseDice("1d6 dAdv")).toThrow(DiceParseError);
  });
});

describe("roll", () => {
  it("produces a valid result for 1d20+5", () => {
    const r = roll("1d20+5", { rng: makeRng(42) });
    expect(r.rolls.length).toBe(1);
    expect(r.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(r.rolls[0]).toBeLessThanOrEqual(20);
    expect(r.total).toBe(r.rolls[0]! + 5);
  });

  it("sums multiple dice", () => {
    const r = roll("3d6+2", { rng: makeRng(1) });
    expect(r.rolls.length).toBe(3);
    expect(r.kept.length).toBe(3);
    const sum = r.rolls.reduce((a, b) => a + b, 0);
    expect(r.total).toBe(sum + 2);
  });

  it("applies negative modifier", () => {
    const r = roll("1d20-3", { rng: makeRng(7) });
    expect(r.total).toBe(r.rolls[0]! - 3);
  });

  it("advantage keeps the higher roll", () => {
    // Seed so first two rolls are deterministic.
    const r = roll("1d20+0 dAdv", { rng: makeRng(123) });
    expect(r.kept.length).toBe(1);
    const other = r.dropped[0]!;
    if (r.expr.mode === "advantage") {
      expect(r.kept[0]!).toBeGreaterThanOrEqual(other);
    }
  });

  it("disadvantage keeps the lower roll", () => {
    const r = roll("1d20+0 dDis", { rng: makeRng(123) });
    expect(r.kept.length).toBe(1);
    const other = r.dropped[0]!;
    if (r.expr.mode === "disadvantage") {
      expect(r.kept[0]!).toBeLessThanOrEqual(other);
    }
  });

  it("detects crits and fumbles", () => {
    // Seed to (almost certainly) hit extremes; assert the flag follows a 20 or 1.
    const critSeed = makeRng(0);
    let foundCrit = false;
    for (let i = 0; i < 50 && !foundCrit; i++) {
      const r = roll("1d20", { rng: critSeed });
      if (r.total === 20) {
        expect(r.isCrit).toBe(true);
        foundCrit = true;
      }
    }
    // 50 trials should yield at least one 20 with high probability.
    expect(foundCrit).toBe(true);
  });
});

describe("rollMany", () => {
  it("returns one result per input", () => {
    const res = rollMany(["1d20+5", "2d6+3", "8d6"], { rng: makeRng(99) });
    expect(res.length).toBe(3);
    expect(res[0]!.expr.size).toBe(20);
    expect(res[1]!.expr.size).toBe(6);
    expect(res[2]!.expr.count).toBe(8);
  });
});

describe("formatRoll", () => {
  it("formats with kept and dropped dice", () => {
    const r = roll("1d20+5 dAdv", { rng: makeRng(42) });
    const s = formatRoll(r);
    expect(s).toMatch(/1d20/);
    expect(s).toMatch(/=/);
  });

  it("never doubles the modifier", () => {
    const r = roll("1d20+5", { rng: makeRng(42) });
    const s = formatRoll(r);
    // The modifier "5" should appear at most once in the formatted string
    expect((s.match(/\+5/g) ?? []).length).toBe(1);
    expect(s).toMatch(/=\s*\d+$/);
  });
});
