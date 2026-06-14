import { z } from "zod";
import type { AIEffect, AITurnOutput } from "@/lib/types";

/**
 * Validators for AI-emitted effects. Anything that fails is dropped; the
 * server's rules engine is the source of truth, never the model.
 */

const EffectSchema: z.ZodType<AIEffect> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("applyDamage"),
      targetId: z.string().min(1),
      amount: z.number().int().min(0).max(1000),
      source: z.string().max(120).optional(),
    }),
    z.object({
      type: z.literal("applyHeal"),
      targetId: z.string().min(1),
      amount: z.number().int().min(0).max(1000),
    }),
    z.object({
      type: z.literal("addCondition"),
      targetId: z.string().min(1),
      condition: z.string().min(1).max(40),
      duration: z.number().int().min(0).optional(),
    }),
    z.object({
      type: z.literal("removeCondition"),
      targetId: z.string().min(1),
      condition: z.string().min(1).max(40),
    }),
    z.object({
      type: z.literal("startCombat"),
      name: z.string().max(120).optional(),
    }),
    z.object({ type: z.literal("endCombat") }),
    z.object({
      type: z.literal("rollDice"),
      notation: z
        .string()
        .min(2)
        .max(40)
        .regex(/^(\d+d\d+)([+-]\d+)?(\s+(dAdv|dDis))?$/i),
      purpose: z.string().max(120).optional(),
    }),
    z.object({
      type: z.literal("addMemory"),
      content: z.string().min(1).max(800),
      importance: z.number().min(0).max(1).optional(),
      refs: z
        .object({
          npcId: z.string().min(1).optional(),
          questId: z.string().min(1).optional(),
          locationId: z.string().min(1).optional(),
        })
        .optional(),
    }),
    z.object({
      type: z.literal("narrate"),
      text: z.string().min(1).max(2000),
    }),
  ]),
);

export const AITurnOutputSchema = z.object({
  narration: z.string().max(8000),
  effects: z.array(EffectSchema).max(50),
});

export function validateAiOutput(raw: unknown): AITurnOutput | null {
  const parsed = AITurnOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data as AITurnOutput;
}

/**
 * Some models occasionally wrap JSON in code fences or add prose around it.
 * This helper tries to extract the first JSON object/array from a string.
 */
export function extractJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  // Strip common code fences
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence && fence[1]) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* fall through */
    }
  }

  // Find first balanced JSON object
  const start = trimmed.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = trimmed.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
