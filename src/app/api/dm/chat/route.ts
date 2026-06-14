import { NextResponse } from "next/server";
import { DMChatSchema } from "@/lib/schemas";
import { prisma } from "@/db/client";
import { safeJsonParse } from "@/lib/utils";
import { orchestrator } from "@/ai/orchestrator";
import { retrieve, formatRetrievedForPrompt } from "@/rag/retrieve";
import { packEmbedding } from "@/rag/embed";
import { ollama } from "@/ai/ollama";
import { env } from "@/lib/env";
import type { PromptKey } from "@/ai/prompts";
import type { AIEffect, AITurnOutput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODE_MAP: Record<string, PromptKey> = {
  narrator: "narrator",
  combat: "combat",
  npc: "npc",
  quest: "quest",
  lore: "lore",
  world: "world",
  memory: "memory",
};

interface AppliedEffect {
  type: string;
  ok: boolean;
  detail?: string;
}

/**
 * Apply validated AI effects to game state. The model is *advisory*:
 * effects are validated by zod in `validators.ts` before reaching this
 * function. Anything we can't apply is logged as `{ ok: false }` so the
 * client sees it in the final SSE event.
 */
async function applyEffects(
  d: { campaignId: string; characterId?: string },
  sessionId: string,
  effects: AIEffect[],
): Promise<AppliedEffect[]> {
  const applied: AppliedEffect[] = [];
  // Cap memories per turn to avoid runaway embedding calls.
  let memoriesThisTurn = 0;
  const MAX_MEMORIES_PER_TURN = 5;

  for (const eff of effects) {
    try {
      switch (eff.type) {
        case "applyDamage": {
          const target = await prisma.combatant.findUnique({ where: { id: eff.targetId } });
          if (!target) {
            applied.push({ type: eff.type, ok: false, detail: "target_not_found" });
            break;
          }
          let remaining = eff.amount;
          let tempHp = target.tempHp;
          if (tempHp > 0) {
            const absorbed = Math.min(tempHp, remaining);
            tempHp -= absorbed;
            remaining -= absorbed;
          }
          const hp = Math.max(0, target.hp - remaining);
          await prisma.combatant.update({
            where: { id: target.id },
            data: { tempHp, hp, isDead: hp === 0 },
          });
          applied.push({ type: eff.type, ok: true });
          break;
        }
        case "applyHeal": {
          const target = await prisma.combatant.findUnique({ where: { id: eff.targetId } });
          if (!target) {
            applied.push({ type: eff.type, ok: false, detail: "target_not_found" });
            break;
          }
          const hp = Math.min(target.maxHp, target.hp + eff.amount);
          await prisma.combatant.update({
            where: { id: target.id },
            data: { hp, isDead: false },
          });
          applied.push({ type: eff.type, ok: true });
          break;
        }
        case "addCondition": {
          const target = await prisma.combatant.findUnique({ where: { id: eff.targetId } });
          if (!target) {
            applied.push({ type: eff.type, ok: false, detail: "target_not_found" });
            break;
          }
          const conds = safeJsonParse<string[]>(target.conditions, []);
          if (!conds.includes(eff.condition)) {
            conds.push(eff.condition);
            await prisma.combatant.update({
              where: { id: target.id },
              data: { conditions: JSON.stringify(conds) },
            });
          }
          applied.push({ type: eff.type, ok: true });
          break;
        }
        case "removeCondition": {
          const target = await prisma.combatant.findUnique({ where: { id: eff.targetId } });
          if (!target) {
            applied.push({ type: eff.type, ok: false, detail: "target_not_found" });
            break;
          }
          const conds = safeJsonParse<string[]>(target.conditions, []).filter(
            (c) => c !== eff.condition,
          );
          await prisma.combatant.update({
            where: { id: target.id },
            data: { conditions: JSON.stringify(conds) },
          });
          applied.push({ type: eff.type, ok: true });
          break;
        }
        case "startCombat": {
          await prisma.combatEncounter.create({
            data: {
              campaignId: d.campaignId,
              sessionId,
              name: eff.name ?? null,
              status: "rolling",
            },
          });
          applied.push({ type: eff.type, ok: true });
          break;
        }
        case "endCombat": {
          await prisma.combatEncounter.updateMany({
            where: { campaignId: d.campaignId, status: { not: "ended" } },
            data: { status: "ended", endedAt: new Date() },
          });
          applied.push({ type: eff.type, ok: true });
          break;
        }
        case "addMemory": {
          if (memoriesThisTurn >= MAX_MEMORIES_PER_TURN) {
            applied.push({ type: eff.type, ok: false, detail: "memory_cap_reached" });
            break;
          }
          memoriesThisTurn++;
          const content = eff.content;
          const importance = eff.importance ?? 0.5;
          let embedding: Buffer | null = null;
          try {
            const v = await ollama.embed({ model: env.embeddingModel, prompt: content });
            embedding = packEmbedding(v);
          } catch {
            embedding = null;
          }
          await prisma.memory.create({
            data: {
              campaignId: d.campaignId,
              characterId: d.characterId,
              scope: importance >= 0.7 ? "long" : "short",
              content,
              importance,
              embedding,
              refs: eff.refs ? JSON.stringify(eff.refs) : null,
            },
          });
          applied.push({ type: eff.type, ok: true });
          break;
        }
        case "narrate":
        case "rollDice":
          // Narration is the main `output.narration` field; rollDice is a
          // request the player must confirm via the UI (POST /api/dice).
          // We acknowledge it but do not mutate state.
          applied.push({ type: eff.type, ok: true });
          break;
        default: {
          const _exhaustive: never = eff;
          void _exhaustive;
          applied.push({ type: "unknown", ok: false });
        }
      }
    } catch (e) {
      applied.push({
        type: eff.type,
        ok: false,
        detail: e instanceof Error ? e.message : "apply_failed",
      });
    }
  }
  return applied;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = DMChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  // Find or create the active session for this campaign
  let session = await prisma.session.findFirst({
    where: { campaignId: d.campaignId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!session) {
    session = await prisma.session.create({ data: { campaignId: d.campaignId } });
  }
  await prisma.campaign.update({
    where: { id: d.campaignId },
    data: { lastPlayedAt: new Date() },
  });

  // Persist player message
  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: "player",
      kind: "text",
      content: d.text,
      refs: d.characterId ? JSON.stringify({ characterId: d.characterId }) : null,
    },
  });

  // Build context
  const recent = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const history = recent.reverse().map((m) => ({
    role: (m.role === "dm" ? "assistant" : m.role === "player" ? "user" : "system") as
      | "user"
      | "assistant"
      | "system",
    content: m.content,
  }));

  let retrieval = "";
  try {
    const items = await retrieve(d.campaignId, d.text, {
      characterId: d.characterId,
      includeLore: true,
      topK: env.ragTopK,
    });
    retrieval = formatRetrievedForPrompt(items);
  } catch {
    retrieval = "";
  }

  // Scene context
  const campaign = await prisma.campaign.findUnique({ where: { id: d.campaignId } });
  const scene = `Location: ${campaign?.currentLocation ?? "unknown"}\nParty level: see character sheets.`;

  // Settings (model + overrides)
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const promptOverrides = settings
    ? safeJsonParse<Record<string, string>>(settings.promptOverrides, {})
    : {};
  const model = settings?.defaultModel || env.defaultModel;
  const temperature = settings?.temperature ?? 0.7;

  const promptKey = MODE_MAP[d.mode] ?? "narrator";
  const stream = orchestrator.stream({
    campaignId: d.campaignId,
    characterId: d.characterId,
    mode: promptKey,
    history,
    retrieval,
    scene,
    model,
    temperature,
    promptOverrides,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let finalOutput: AITurnOutput | null = null;
        let modelUsed = model;
        for await (const ev of stream) {
          if (ev.type === "token") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", text: ev.text })}\n\n`),
            );
          } else if (ev.type === "final") {
            finalOutput = ev.output;
            modelUsed = ev.model;
          }
        }

        if (finalOutput) {
          // Apply effects FIRST so any side-effects (e.g. applyDamage) land
          // before the message is committed and emitted to the client.
          const applied = await applyEffects(d, session!.id, finalOutput.effects);

          const m = await prisma.message.create({
            data: {
              sessionId: session!.id,
              role: "dm",
              kind: "text",
              content: finalOutput.narration,
            },
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "final",
                sessionId: session!.id,
                messageId: m.id,
                message: {
                  id: m.id,
                  role: "dm",
                  kind: "text",
                  content: finalOutput.narration,
                  createdAt: m.createdAt.toISOString(),
                },
                effects: finalOutput.effects,
                applied,
                model: modelUsed,
              })}\n\n`,
            ),
          );
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: err instanceof Error ? err.message : "stream_failed",
            })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export function GET() {
  return NextResponse.json({
    note: "POST a player turn. Returns SSE stream of tokens + final JSON.",
    example: {
      campaignId: "string",
      characterId: "optional",
      text: "I push open the door and look inside.",
      mode: "narrator",
    },
  });
}
