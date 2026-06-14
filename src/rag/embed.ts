import { ollama } from "@/ai/ollama";
import { env } from "@/lib/env";

/**
 * Cosine similarity between two equal-length vectors.
 */
export function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function packEmbedding(v: number[]): Buffer {
  return Buffer.from(new Float32Array(v).buffer);
}

export function unpackEmbedding(b: Buffer): number[] {
  return Array.from(new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4));
}

export const embeddings = {
  async embed(text: string): Promise<number[]> {
    return ollama.embed({ model: env.embeddingModel, prompt: text });
  },
};

export interface RankedItem<T> {
  item: T;
  score: number;
}

export function rankByEmbedding<T extends { embedding?: Buffer | null }>(
  items: T[],
  query: number[],
  topK: number = env.ragTopK,
): RankedItem<T>[] {
  const scored: RankedItem<T>[] = [];
  for (const it of items) {
    if (!it.embedding) continue;
    const v = unpackEmbedding(it.embedding);
    scored.push({ item: it, score: cosineSim(query, v) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
