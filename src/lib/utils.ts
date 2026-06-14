import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatModifier(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** Truncate a string with ellipsis. */
export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + "…";
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function assertNever(x: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${JSON.stringify(x)}`);
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
