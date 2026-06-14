import { describe, expect, it } from "vitest";
import { cosineSim, packEmbedding, unpackEmbedding } from "@/rag/embed";

describe("cosineSim", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSim([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
  });
  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSim([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 5);
  });
  it("returns -1 for opposite vectors", () => {
    expect(cosineSim([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
  });
  it("throws on length mismatch", () => {
    expect(() => cosineSim([1], [1, 2])).toThrow();
  });
});

describe("pack/unpack", () => {
  it("round-trips embeddings", () => {
    const v = [0.1, 0.2, -0.3, 0.4];
    const b = packEmbedding(v);
    const back = unpackEmbedding(b);
    for (let i = 0; i < v.length; i++) {
      expect(back[i]).toBeCloseTo(v[i]!, 5);
    }
  });
});
