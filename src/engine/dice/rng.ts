/**
 * Pluggable RNG. Default uses crypto for production; tests inject a
 * deterministic generator.
 */
export type RandomFn = (n: number) => number; // returns integer in [0, n)

export const cryptoRandom: RandomFn = (n) => {
  // Rejection sampling for unbiased uniform integer.
  if (n <= 0) throw new Error("Random range must be positive");
  const max = Math.floor(0xffffffff / n) * n;
  const buf = new Uint32Array(1);
  let r: number;
  do {
    crypto.getRandomValues(buf);
    r = buf[0] ?? 0;
  } while (r >= max);
  return r % n;
};

export function makeRng(seed: number): RandomFn {
  // Mulberry32: tiny, fast, deterministic. For tests.
  let s = seed >>> 0;
  return (n) => {
    if (n <= 0) throw new Error("Random range must be positive");
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) % n;
  };
}
