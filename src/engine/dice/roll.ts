import { cryptoRandom, type RandomFn } from "./rng";

export type DieSize = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export const DIE_SIZES: readonly DieSize[] = [4, 6, 8, 10, 12, 20, 100] as const;

/**
 * Parsed dice expression. We support the common shorthand:
 *   NdM            -> count, size
 *   NdM+K          -> +K (negative K allowed)
 *   NdM+K dAdv     -> advantage (d20 only)
 *   NdM+K dDis     -> disadvantage (d20 only)
 *
 * Examples: 1d20+5, 2d6+3, 8d6, 1d20, 1d20-1 dAdv
 */
export interface DiceExpr {
  raw: string;
  count: number;
  size: DieSize;
  modifier: number;
  mode: "none" | "advantage" | "disadvantage";
  purpose?: string;
}

const TOKEN_RE = /^(\d+)d(\d+)([+-]\d+)?(?:\s+(dAdv|dDis))?$/i;

export class DiceParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiceParseError";
  }
}

export function parseDice(notation: string, purpose?: string): DiceExpr {
  const trimmed = notation.trim();
  // Normalize: drop whitespace around the +/- modifier, between dice and mode.
  const normalized = trimmed
    .replace(/\s*([+\-])\s*/g, "$1")
    .replace(/\s*(\d+d\d+)\s+(dAdv|dDis)\s*$/i, "$1 $2");
  const m = TOKEN_RE.exec(normalized);
  if (!m) throw new DiceParseError(`Invalid dice notation: "${notation}"`);

  const count = Number(m[1]);
  const size = Number(m[2]) as DieSize;
  if (!DIE_SIZES.includes(size)) {
    throw new DiceParseError(`Unsupported die size: d${size}`);
  }
  if (count < 1 || count > 100) {
    throw new DiceParseError(`Invalid die count: ${count} (1-100)`);
  }
  const modifier = m[3] ? Number(m[3]) : 0;
  const modeToken = (m[4] || "").toLowerCase();
  const mode: DiceExpr["mode"] =
    modeToken === "dadv" ? "advantage" : modeToken === "ddis" ? "disadvantage" : "none";
  if (mode !== "none" && size !== 20) {
    throw new DiceParseError("Advantage/disadvantage only valid for d20");
  }
  return { raw: trimmed, count, size, modifier, mode, purpose };
}

export interface RollResult {
  expr: DiceExpr;
  rolls: number[];
  kept: number[]; // rolls actually used (post advantage/disadvantage)
  dropped: number[]; // the other die (for advantage/disadvantage)
  modifier: number;
  total: number;
  isCrit: boolean;
  isFumble: boolean;
  rng: RandomFn;
}

function rollOnce(size: DieSize, rng: RandomFn): number {
  return rng(size) + 1;
}

export function roll(notation: string, opts?: { rng?: RandomFn; purpose?: string }): RollResult {
  const rng = opts?.rng ?? cryptoRandom;
  const expr = parseDice(notation, opts?.purpose);
  const rolls: number[] = [];

  // Advantage/disadvantage on d20 means "roll twice, keep one". If the
  // user wrote `1d20+5 dAdv` we still want 2 physical rolls; if they
  // wrote `2d20+5 dAdv` we also want 2 rolls (one extra to be dropped).
  // For all non-dAdv/dDis rolls, honor the count as written.
  const totalRolls = expr.mode === "none" ? expr.count : Math.max(2, expr.count);
  for (let i = 0; i < totalRolls; i++) {
    rolls.push(rollOnce(expr.size, rng));
  }

  let kept = [...rolls];
  let dropped: number[] = [];
  if (expr.mode !== "none" && expr.size === 20) {
    // Keep the best (advantage) or worst (disadvantage) die.
    const useFirst =
      expr.mode === "advantage"
        ? rolls[0]! >= rolls[1]!
        : rolls[0]! <= rolls[1]!;
    kept = [useFirst ? rolls[0]! : rolls[1]!];
    dropped = [useFirst ? rolls[1]! : rolls[0]!];
  }

  const sum = kept.reduce((a, b) => a + b, 0);
  const total = sum + expr.modifier;
  const isCrit = expr.size === 20 && kept.includes(20);
  const isFumble = expr.size === 20 && kept.every((r) => r === 1);

  return {
    expr,
    rolls,
    kept,
    dropped,
    modifier: expr.modifier,
    total,
    isCrit,
    isFumble,
    rng,
  };
}

/** Roll many expressions and return results in input order. */
export function rollMany(notes: string[], opts?: { rng?: RandomFn }): RollResult[] {
  return notes.map((n) => roll(n, opts));
}

/** Format a roll for display: "1d20+5: [14] + 5 = 19" */
export function formatRoll(r: RollResult): string {
  const parts: string[] = [];
  parts.push(`${r.expr.count}d${r.expr.size}`);
  if (r.expr.mode !== "none") {
    parts.push(`(${r.expr.mode})`);
  }
  if (r.modifier !== 0) {
    parts.push(r.modifier > 0 ? `+${r.modifier}` : `${r.modifier}`);
  }
  const keptStr = r.kept.length > 1 ? `[${r.kept.join(", ")}]` : `[${r.kept[0]}]`;
  const dropStr = r.dropped.length ? ` (dropped [${r.dropped.join(", ")}])` : "";
  return `${parts.join(" ")}: ${keptStr}${dropStr} = ${r.total}`;
}
