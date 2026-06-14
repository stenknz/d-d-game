import { prisma } from "@/db/client";
import { env } from "@/lib/env";
import { embeddings, rankByEmbedding } from "./embed";
import { safeJsonParse } from "@/lib/utils";

export interface RetrievedMemory {
  id: string;
  content: string;
  importance: number;
  scope: string;
  createdAt: Date;
  score: number;
}

interface CacheKey {
  campaignId: string;
  characterId?: string;
  query: string;
  includeLore: boolean;
  topK: number;
}

interface CacheEntry {
  vector: number[];
  result: RetrievedMemory[];
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_ENTRIES = 64;
const cache = new Map<string, CacheEntry>();

function keyOf(k: CacheKey): string {
  return `${k.campaignId}::${k.characterId ?? ""}::${k.includeLore ? "1" : "0"}::${k.topK}::${k.query}`;
}

/**
 * RAG retrieval: pull top-k relevant memories + lore for a campaign,
 * optionally biased toward a specific character.
 * The result (and the embedding for the query) is cached for 5 minutes
 * per (campaign, character, query, topK, includeLore) tuple.
 */
export async function retrieve(
  campaignId: string,
  query: string,
  opts: { characterId?: string; topK?: number; includeLore?: boolean } = {},
): Promise<RetrievedMemory[]> {
  const topK = opts.topK ?? env.ragTopK;
  const includeLore = opts.includeLore ?? false;
  const k: CacheKey = {
    campaignId,
    characterId: opts.characterId,
    query,
    includeLore,
    topK,
  };
  const key = keyOf(k);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.cachedAt < CACHE_TTL_MS) {
    return hit.result;
  }

  const queryVec = await embeddings.embed(query);
  const mems = await prisma.memory.findMany({
    where: { campaignId, ...(opts.characterId ? { characterId: opts.characterId } : {}) },
  });
  const ranked = rankByEmbedding(mems, queryVec, topK);
  const out: RetrievedMemory[] = ranked.map((r) => ({
    id: r.item.id,
    content: r.item.content,
    importance: r.item.importance,
    scope: r.item.scope,
    createdAt: r.item.createdAt,
    score: r.score,
  }));
  if (includeLore) {
    const lore = await prisma.loreEntry.findMany({ where: { campaignId } });
    const rankedLore = rankByEmbedding(lore, queryVec, Math.max(2, Math.floor(topK / 2)));
    for (const r of rankedLore) {
      out.push({
        id: `lore:${r.item.id}`,
        content: `[${r.item.kind}] ${r.item.title}: ${r.item.body}`,
        importance: r.item.importance,
        scope: "lore",
        createdAt: r.item.createdAt,
        score: r.score,
      });
    }
    out.sort((a, b) => b.score - a.score);
    out.length = Math.min(out.length, topK);
  }

  // Cache write with simple LRU-ish eviction
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { vector: queryVec, result: out, cachedAt: now });
  return out;
}

/** Test helper: clear the in-process RAG cache. */
export function _clearCache(): void {
  cache.clear();
}

export function formatRetrievedForPrompt(items: RetrievedMemory[]): string {
  if (items.length === 0) return "";
  const lines = items.map(
    (m, i) => `${i + 1}. (score=${m.score.toFixed(2)}, imp=${m.importance.toFixed(2)}) ${m.content}`,
  );
  return ["# Retrieved context", ...lines].join("\n");
}

/**
 * Long-term memory promotion: pull short-term memories above an importance
 * threshold; caller decides what to do with them.
 */
export async function listPromotionCandidates(campaignId: string, threshold = 0.7) {
  return prisma.memory.findMany({
    where: { campaignId, scope: "short", importance: { gte: threshold } },
    orderBy: { importance: "desc" },
  });
}

export async function promote(id: string) {
  return prisma.memory.update({ where: { id }, data: { scope: "long" } });
}

/** Helper for tests: build a memory record from raw values. */
export function memoryFromRow(row: {
  id: string;
  content: string;
  importance: number;
  scope: string;
  refs?: string | null;
}): {
  id: string;
  content: string;
  importance: number;
  scope: string;
  refs: Record<string, unknown>;
} {
  return {
    id: row.id,
    content: row.content,
    importance: row.importance,
    scope: row.scope,
    refs: safeJsonParse<Record<string, unknown>>(row.refs ?? null, {}),
  };
}
